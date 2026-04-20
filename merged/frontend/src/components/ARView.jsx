import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useFarmStore } from '../store/farmStore'
import { useARCamera, useDeviceOrientation, useGPS } from '../hooks/useAR'
import { useCropIdentifier } from '../hooks/useCropIdentifier'
import { renderARFrame, gpsToScreen, drawWalkRecordHUD } from '../utils/arRenderer'
import PlotDetailPanel from './PlotDetailPanel'
import CropIdentifyPanel from './CropIdentifyPanel'
import ARWalkRecord from './ARWalkRecord'

export default function ARView() {
  const canvasRef   = useRef(null)
  const animRef     = useRef(null)
  const demoRef     = useRef(null)
  const { videoRef, startCamera, stopCamera, capturePhoto, downloadPhoto } = useARCamera()

  const [started,    setStarted]    = useState(false)
  const [capturing,  setCapturing]  = useState(false)
  const [flashOn,    setFlashOn]    = useState(false)
  const [showIdPanel, setShowIdPanel] = useState(false)
  const [walkMode,   setWalkMode]   = useState(false)   // ← NEW: walk & record mode

  const plots     = useFarmStore(s => s.plots)
  const gps       = useFarmStore(s => s.gpsPosition)
  const orient    = useFarmStore(s => s.deviceOrientation)
  const demoMode  = useFarmStore(s => s.demoMode)
  const lang      = useFarmStore(s => s.lang)
  const selected  = useFarmStore(s => s.selectedPlot)
  const t         = useFarmStore(s => s.t)
  const setView      = useFarmStore(s => s.setView)
  const setSelected  = useFarmStore(s => s.setSelectedPlot)
  const setDemoMode  = useFarmStore(s => s.setDemoMode)
  const updatePlot   = useFarmStore(s => s.updatePlot)

  const { loading: idLoading, result: idResult, error: idError, identify, reset: resetId } = useCropIdentifier()

  useDeviceOrientation()
  useGPS()

  const plotCount    = Object.keys(plots).length
  const activePlots  = Object.values(plots).filter(p => p.cropType)
  const seedingPlots = activePlots.filter(p => p.status === 'seedling' || p.status === 'growing')

  // ── Resize canvas ──────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width  = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }
    resize(); window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ── Render loop — switches between normal AR and walk-record HUD ───────────
  useEffect(() => {
    if (!started) return
    const loop = () => {
      const canvas = canvasRef.current; if (!canvas) { animRef.current = requestAnimationFrame(loop); return }
      if (walkMode) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        renderARFrame(canvas, plots, gps, orient, demoMode, lang, t)
        drawWalkRecordHUD(ctx, canvas.width, canvas.height, gps, null)
      } else {
        renderARFrame(canvas, plots, gps, orient, demoMode, lang, t)
      }
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [started, plots, gps, orient, demoMode, lang, walkMode])

  useEffect(() => () => {
    stopCamera(); cancelAnimationFrame(animRef.current)
    if (demoRef.current) clearInterval(demoRef.current)
  }, [])

  const startAR = async () => {
    const stream = await startCamera()
    if (stream) { setStarted(true); setDemoMode(false) }
  }
  const startDemo = () => {
    setDemoMode(true); setStarted(true)
    let h = 0
    demoRef.current = setInterval(() => {
      useFarmStore.setState(s => ({ deviceOrientation: { ...s.deviceOrientation, alpha: (h += 0.4) % 360 } }))
    }, 50)
  }
  const exit = () => {
    stopCamera()
    if (demoRef.current) { clearInterval(demoRef.current); demoRef.current = null }
    cancelAnimationFrame(animRef.current)
    setDemoMode(false); setStarted(false); setSelected(null); setShowIdPanel(false); resetId(); setWalkMode(false)
    setView('dashboard')
  }

  const handleCapture = async () => {
    if (capturing) return
    setCapturing(true); setFlashOn(true)
    setTimeout(() => setFlashOn(false), 180)
    await downloadPhoto(canvasRef.current)
    setCapturing(false)
  }

  const handleIdentify = async () => {
    if (idLoading) return
    const video = videoRef.current
    const hasVideo = video && video.videoWidth > 0
    let blob
    if (hasVideo) {
      const result = await capturePhoto(null)
      blob = result?.blob
    } else if (demoMode) {
      const canvas = canvasRef.current; if (!canvas) return
      blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.85))
    }
    if (!blob) return
    setShowIdPanel(true)
    await identify(blob)
  }

  const handleTap = useCallback((e) => {
    if (showIdPanel || walkMode) return
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const tx = e.clientX - rect.left, ty = e.clientY - rect.top
    const w = canvas.width, h = canvas.height
    const active = Object.values(plots).filter(p => p.cropType && p.lat && p.lng)
    let best = null, bd = Infinity
    active.forEach((plot, i) => {
      let sx, sy, sc2
      if (demoMode && !gps.ok) {
        const count = Math.min(active.length, 8)
        if (i >= count) return
        const angle = -28 + i * (56 / Math.max(count - 1, 1))
        sx = w / 2 + (angle / 35) * (w / 2); sy = h * 0.5 + Math.sin(i * 0.9) * 30; sc2 = 0.85
      } else {
        const pos = gpsToScreen(plot.lat, plot.lng, gps.lat, gps.lng, orient.alpha, w, h)
        if (!pos) return
        sx = pos.x; sy = pos.y; sc2 = pos.scale
      }
      const d = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2)
      if (d < 70 * sc2 && d < bd) { bd = d; best = plot }
    })
    if (best) setSelected(best.id)
    else setSelected(null)
  }, [plots, gps, orient, demoMode, showIdPanel, walkMode])

  const handleAssignToPlot = useCallback((plotId, cropKey) => {
    if (!updatePlot || !plotId || !cropKey) return
    const today = new Date().toISOString().split('T')[0]
    updatePlot(plotId, { cropType: cropKey, plantedDate: today, progress: 0.05, status: 'seedling', notes: `Auto-identified by AI on ${today}` })
    useFarmStore.getState().addAlert(`🌱 ${cropKey} planted in plot ${plotId}`, 'success')
    setShowIdPanel(false); resetId()
  }, [updatePlot, resetId])

  const hasPlots = plotCount > 0
  const gpsColor = gps.ok
    ? gps.accuracy < 15 ? '#7EC850' : gps.accuracy < 40 ? '#F5C842' : '#FF9F1C'
    : '#E63946'

  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:10 }}>

      {/* Camera */}
      <video ref={videoRef} autoPlay playsInline muted
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
          opacity: started && !demoMode ? 1 : 0, transition:'opacity 0.5s' }} />

      {/* AR Canvas */}
      <canvas ref={canvasRef} onClick={handleTap}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', cursor: walkMode ? 'crosshair' : 'crosshair',
          display: started ? 'block' : 'none',
          background: demoMode ? 'linear-gradient(160deg,#050a03,#0B1508)' : 'transparent' }} />

      {/* Flash */}
      {flashOn && <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.55)', zIndex:20, pointerEvents:'none' }} />}

      {/* ── Start screen ── */}
      {!started && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg,#070e05,#0F1A0A,#060d04)', padding:24 }}>
          <div style={{ position:'relative', width:120, height:120, marginBottom:20 }}>
            {[0, 0.5].map((delay,i)=>(
              <div key={i} style={{ position:'absolute', inset:0, borderRadius:'50%', border:`2px solid rgba(126,200,80,${0.12+i*0.1})`, animation:`ring 2.2s ease-out ${delay}s infinite` }}/>
            ))}
            <style>{`@keyframes ring{0%{transform:scale(0.8);opacity:1}100%{transform:scale(2.4);opacity:0}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}`}</style>
            <div style={{ position:'absolute', inset:'22%', background:'rgba(126,200,80,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, animation:'float 3s ease infinite' }}>🌾</div>
          </div>

          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:'#7EC850', marginBottom:4 }}>{t('nav_ar')}</h2>
          <p style={{ color:'rgba(214,236,194,0.5)', fontSize:12, marginBottom:12, textAlign:'center', maxWidth:260 }}>{t('ar_launch_sub')}</p>

          <div style={{ background:'rgba(126,200,80,0.06)', border:'1px solid rgba(126,200,80,0.2)', borderRadius:12, padding:'10px 18px', marginBottom:10, textAlign:'center', minWidth:240 }}>
            <div style={{ fontSize:11, color: hasPlots ? '#7EC850' : '#F5C842', marginBottom:4 }}>
              {hasPlots ? `✅ ${plotCount} plots · ${activePlots.length} crops · ${seedingPlots.length} seeding` : t('ar_no_plots')}
            </div>
            <div style={{ fontSize:10, color: gpsColor }}>📍 {gps.ok ? `GPS ready · ±${Math.round(gps.accuracy)}m` : 'Waiting for GPS…'}</div>
          </div>

          {/* Feature chips */}
          <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', justifyContent:'center' }}>
            {[{icon:'📸',label:'Seeding photos'},{icon:'🔍',label:'AI crop ID'},{icon:'🚶',label:'Walk & Record'}].map(f => (
              <div key={f.label} style={{ background:'rgba(168,216,234,0.06)', border:'1px solid rgba(168,216,234,0.15)', borderRadius:8, padding:'5px 10px', fontSize:10, color:'rgba(168,216,234,0.7)', display:'flex', alignItems:'center', gap:4 }}>
                {f.icon} {f.label}
              </div>
            ))}
          </div>

          <button onClick={startAR}
            style={{ background:'linear-gradient(135deg,#3A7D44,#7EC850)', border:'none', borderRadius:12, padding:'12px 32px', color:'#0B1508', fontWeight:700, fontSize:14, cursor:'pointer', marginBottom:8, fontFamily:"'DM Mono',monospace", boxShadow:'0 0 30px rgba(126,200,80,0.3)' }}>
            📷 {t('nav_ar')}
          </button>
          <button onClick={startDemo}
            style={{ background:'rgba(126,200,80,0.07)', border:'1px solid rgba(126,200,80,0.22)', borderRadius:10, padding:'8px 20px', color:'rgba(126,200,80,0.75)', fontSize:11, cursor:'pointer', marginBottom:8, fontFamily:"'DM Mono',monospace" }}>
            🎮 {t('demo_mode')}
          </button>
          <button onClick={exit}
            style={{ background:'transparent', border:'none', color:'rgba(214,236,194,0.3)', fontSize:12, cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>
            {t('back')}
          </button>
        </div>
      )}

      {/* ── AR Controls ── */}
      {started && (
        <>
          {/* Exit */}
          <button onClick={exit}
            style={{ position:'absolute', top:14, left:14, background:'rgba(8,16,6,0.92)', border:'1px solid rgba(126,200,80,0.35)', borderRadius:10, padding:'8px 14px', color:'#7EC850', fontSize:13, fontWeight:700, cursor:'pointer', zIndex:5, backdropFilter:'blur(8px)', fontFamily:"'DM Mono',monospace", textShadow:'0 1px 3px rgba(0,0,0,0.9)' }}>
            ← Exit
          </button>

          {/* GPS badge */}
          <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', background:'rgba(8,16,6,0.92)', border:`1.5px solid ${gpsColor}77`, borderRadius:10, padding:'6px 14px', color: gpsColor, fontSize:12, fontWeight:700, zIndex:5, backdropFilter:'blur(8px)', fontFamily:"'DM Mono',monospace", whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:7, textShadow:'0 1px 3px rgba(0,0,0,0.9)' }}>
            <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:gpsColor, boxShadow:`0 0 8px ${gpsColor}` }} />
            {gps.ok ? `GPS ±${Math.round(gps.accuracy)}m` : 'No GPS'}
          </div>

          {/* Walk mode toggle (top right) */}
          <button onClick={() => setWalkMode(w => !w)}
            style={{ position:'absolute', top:14, right:14, background: walkMode ? 'rgba(126,200,80,0.25)' : 'rgba(8,16,6,0.92)', border:`1.5px solid ${walkMode ? '#7EC850' : 'rgba(126,200,80,0.35)'}`, borderRadius:10, padding:'7px 12px', color: walkMode ? '#7EC850' : 'rgba(214,236,194,0.8)', fontSize:12, fontWeight:700, cursor:'pointer', zIndex:5, backdropFilter:'blur(8px)', fontFamily:"'DM Mono',monospace", display:'flex', alignItems:'center', gap:6, textShadow:'0 1px 3px rgba(0,0,0,0.9)' }}>
            🚶 {walkMode ? 'Recording…' : 'Walk & Record'}
          </button>

          {/* Right-side action buttons */}
          {!walkMode && (
            <div style={{ position:'absolute', bottom:80, right:20, zIndex:5, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              {/* 📸 Photo */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <button onClick={handleCapture} disabled={capturing}
                  style={{ width:58, height:58, borderRadius:'50%', background: capturing ? 'rgba(126,200,80,0.15)' : 'rgba(8,16,6,0.95)', border:`2.5px solid ${capturing ? 'rgba(126,200,80,0.3)' : '#7EC850'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, cursor: capturing ? 'not-allowed' : 'pointer', backdropFilter:'blur(8px)', boxShadow: capturing ? 'none' : '0 0 20px rgba(126,200,80,0.4)', transition:'all 0.15s' }}>
                  {capturing ? '⏳' : '📸'}
                </button>
                <div style={{ fontSize:9, color:'rgba(126,200,80,0.7)', fontFamily:"'DM Mono',monospace", textAlign:'center', lineHeight:1.3, textShadow:'0 1px 3px rgba(0,0,0,0.9)' }}>
                  {capturing ? 'Saving…' : 'Photo'}
                </div>
              </div>

              {/* 🔍 Identify */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <button onClick={handleIdentify} disabled={idLoading}
                  style={{ width:58, height:58, borderRadius:'50%', background: idLoading ? 'rgba(168,216,234,0.15)' : 'rgba(8,16,6,0.95)', border:`2.5px solid ${idLoading ? 'rgba(168,216,234,0.5)' : 'rgba(168,216,234,0.6)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, cursor: idLoading ? 'not-allowed' : 'pointer', backdropFilter:'blur(8px)', boxShadow:'0 0 16px rgba(168,216,234,0.2)', transition:'all 0.2s', animation: idLoading ? 'pulse-id 1s ease-in-out infinite' : 'none' }}>
                  {idLoading ? '⏳' : '🔍'}
                </button>
                <style>{`@keyframes pulse-id{0%,100%{box-shadow:0 0 10px rgba(168,216,234,0.2)}50%{box-shadow:0 0 28px rgba(168,216,234,0.65)}}`}</style>
                <div style={{ fontSize:9, color:'rgba(168,216,234,0.7)', fontFamily:"'DM Mono',monospace", textAlign:'center', lineHeight:1.3, textShadow:'0 1px 3px rgba(0,0,0,0.9)' }}>
                  {idLoading ? 'Reading…' : 'Identify'}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Walk & Record overlay ── */}
      {started && walkMode && (
        <ARWalkRecord gps={gps} onClose={() => setWalkMode(false)} />
      )}

      {/* Plot detail */}
      {selected && plots[selected]?.cropType && !showIdPanel && !walkMode && (
        <PlotDetailPanel plotId={selected} inAR />
      )}

      {/* AI Identify panel */}
      {showIdPanel && (
        <CropIdentifyPanel
          result={idResult} loading={idLoading} error={idError}
          onClose={() => { setShowIdPanel(false); resetId() }}
          onAssignToPlot={handleAssignToPlot}
        />
      )}
    </div>
  )
}
