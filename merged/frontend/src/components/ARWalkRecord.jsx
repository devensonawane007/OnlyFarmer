// ARWalkRecord.jsx — In-AR Walk & Record: farmer walks field, GPS is captured, crop stored instantly
import React, { useState, useEffect, useRef } from 'react'
import { useFarmStore, CROP_TYPES, cropName } from '../store/farmStore'

const CROP_LIST = Object.entries(CROP_TYPES)

const API_BASE = 'http://localhost:8000'

async function syncPlotToServer(plot, farmName) {
  try {
    await fetch(`${API_BASE}/plotdb/plots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: plot.id, farm_name: farmName,
        crop_type: plot.cropType, crop_emoji: CROP_TYPES[plot.cropType]?.emoji || '',
        lat: plot.lat, lng: plot.lng, accuracy: plot.accuracy || 99,
        planted_date: plot.plantedDate, days_planted: plot.daysPlanted || 0,
        status: plot.status || 'seedling', progress: plot.progress || 0,
        moisture: plot.moisture || 65, health: plot.health || 90,
        temperature: plot.temperature || 28, notes: plot.notes || '',
        real_gps: plot.realGPS || false,
      }),
    })
  } catch { /* offline — saved locally anyway */ }
}

export default function ARWalkRecord({ onClose, gps }) {
  const plots        = useFarmStore(s => s.plots)
  const config       = useFarmStore(s => s.config)
  const recordPlot   = useFarmStore(s => s.recordPlot)
  const addCropToPlot = useFarmStore(s => s.addCropToPlot)
  const addAlert     = useFarmStore(s => s.addAlert)
  const lang         = useFarmStore(s => s.lang)

  const [step, setStep]           = useState('idle')   // idle | choose_plot | choose_crop | confirm | saved
  const [plotId, setPlotId]       = useState('')
  const [customId, setCustomId]   = useState('')
  const [cropKey, setCropKey]     = useState('')
  const [capturedGps, setCapturedGps] = useState(null)
  const [saved, setSaved]         = useState([])

  // ── Step 1: farmer taps "📍 Record here" button ───────────────────────────
  const handleRecord = () => {
    if (!gps.ok) {
      addAlert('GPS not ready. Move to open area.', 'error')
      return
    }
    setCapturedGps({ ...gps })
    setStep('choose_plot')
  }

  // ── Step 2: choose which plot ID this location is ─────────────────────────
  const handlePlotChosen = (id) => {
    setPlotId(id)
    setStep('choose_crop')
  }

  // ── Step 3: choose crop ───────────────────────────────────────────────────
  const handleCropChosen = (key) => {
    setCropKey(key)
    setStep('confirm')
  }

  // ── Step 4: confirm and save ──────────────────────────────────────────────
  const handleConfirm = () => {
    const finalId = plotId === '__custom__' ? customId.trim() : plotId
    if (!finalId) { addAlert('Enter a plot ID first', 'error'); return }

    const today = new Date().toISOString().split('T')[0]

    // First record the GPS location for the plot
    recordPlot(finalId, cropKey, capturedGps)
    // Then add the crop (recordPlot sets the plot with no crop, addCropToPlot fills it in)
    addCropToPlot(finalId, cropKey, today, `GPS recorded in AR — ±${Math.round(capturedGps.accuracy)}m`)

    // Sync to server database
    const updatedPlot = { ...useFarmStore.getState().plots[finalId] }
    syncPlotToServer(updatedPlot, config?.name || 'My Farm')

    const info = { id: finalId, cropKey, emoji: CROP_TYPES[cropKey]?.emoji, lat: capturedGps.lat, lng: capturedGps.lng, acc: Math.round(capturedGps.accuracy) }
    setSaved(prev => [info, ...prev])
    addAlert(`✅ ${CROP_TYPES[cropKey]?.emoji} Plot ${finalId} recorded at ±${Math.round(capturedGps.accuracy)}m`, 'success')
    setStep('saved')
  }

  // ── Reset to record another ────────────────────────────────────────────────
  const recordAnother = () => {
    setStep('idle'); setPlotId(''); setCropKey(''); setCapturedGps(null); setCustomId('')
  }

  const gpsColor = gps.ok
    ? gps.accuracy < 12 ? '#7EC850' : gps.accuracy < 35 ? '#F5C842' : '#FF9F1C'
    : '#E63946'

  // Existing empty plot slots (from grid config)
  const rows = config?.rows || 8, cols = config?.cols || 10
  const allSlots = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const id = `${r}-${c}`
    if (!plots[id]?.cropType) allSlots.push(id)
  }
  // Also include any free-form named plots
  const namedPlots = Object.keys(plots).filter(k => !plots[k]?.cropType && !/^\d+-\d+$/.test(k))

  const availablePlots = [...allSlots.slice(0, 20), ...namedPlots, '__custom__']

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:40,
      display:'flex', flexDirection:'column', justifyContent:'flex-end',
      pointerEvents: step === 'idle' ? 'none' : 'all',
    }}>
      {/* ── IDLE: just show the record button floating over AR ── */}
      {step === 'idle' && (
        <div style={{ pointerEvents:'all', position:'absolute', bottom:160, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <button onClick={handleRecord}
            style={{
              background: gps.ok ? 'linear-gradient(135deg,#3A7D44,#7EC850)' : 'rgba(230,57,70,0.8)',
              border:'none', borderRadius:18, padding:'14px 28px',
              color:'#0B1508', fontWeight:800, fontSize:15,
              cursor: gps.ok ? 'pointer' : 'default',
              fontFamily:"'DM Mono',monospace",
              boxShadow: gps.ok ? '0 0 30px rgba(126,200,80,0.5), 0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.5)',
              display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap',
            }}>
            📍 Record Crop Here
          </button>
          <div style={{ fontSize:10, color: gpsColor, fontFamily:"'DM Mono',monospace", background:'rgba(0,0,0,0.75)', borderRadius:8, padding:'3px 10px', textShadow:'0 1px 3px rgba(0,0,0,0.9)' }}>
            {gps.ok ? `GPS ±${Math.round(gps.accuracy)}m` : 'Waiting for GPS…'}
          </div>
          {/* Recent saves */}
          {saved.length > 0 && (
            <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4, alignItems:'center' }}>
              {saved.slice(0, 3).map((s, i) => (
                <div key={i} style={{ background:'rgba(11,21,8,0.9)', border:'1px solid rgba(126,200,80,0.35)', borderRadius:10, padding:'4px 12px', fontSize:11, color:'#D6ECC2', fontFamily:"'DM Mono',monospace", display:'flex', alignItems:'center', gap:6 }}>
                  {s.emoji} Plot {s.id} — ±{s.acc}m
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PANEL for steps 2-4 ──────────────────────────────────────────── */}
      {step !== 'idle' && (
        <div style={{
          background:'linear-gradient(180deg, rgba(8,18,6,0.98) 0%, rgba(11,21,8,0.99) 100%)',
          borderTop:'2px solid #7EC850',
          borderRadius:'20px 20px 0 0',
          padding:'0 0 env(safe-area-inset-bottom,20px)',
          maxHeight:'80vh', overflowY:'auto',
          fontFamily:"'DM Mono','Noto Sans Devanagari',monospace",
          pointerEvents:'all',
        }}>
          {/* Handle */}
          <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 0' }}>
            <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.12)' }} />
          </div>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 18px 0' }}>
            <span style={{ fontSize:11, color:'rgba(126,200,80,0.6)', letterSpacing:2, textTransform:'uppercase' }}>
              🚶 Walk & Record
            </span>
            {step !== 'saved' && (
              <button onClick={recordAnother}
                style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'4px 10px', color:'rgba(214,236,194,0.5)', fontSize:11, cursor:'pointer' }}>
                Cancel
              </button>
            )}
          </div>

          {/* ── GPS captured pill ── */}
          {capturedGps && (
            <div style={{ margin:'10px 18px 0', background:'rgba(126,200,80,0.08)', border:'1px solid rgba(126,200,80,0.25)', borderRadius:12, padding:'8px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:16 }}>📍</span>
              <div>
                <div style={{ fontSize:12, color:'#7EC850', fontWeight:700 }}>GPS Captured — ±{Math.round(capturedGps.accuracy)}m</div>
                <div style={{ fontSize:10, color:'rgba(214,236,194,0.5)' }}>{capturedGps.lat.toFixed(6)}, {capturedGps.lng.toFixed(6)}</div>
              </div>
            </div>
          )}

          {/* ── STEP: Choose plot ── */}
          {step === 'choose_plot' && (
            <div style={{ padding:'14px 18px 20px' }}>
              <div style={{ fontSize:14, color:'#D6ECC2', fontWeight:700, marginBottom:12 }}>Which plot is this location?</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, maxHeight:220, overflowY:'auto' }}>
                {availablePlots.map(id => (
                  <button key={id} onClick={() => id === '__custom__' ? handlePlotChosen('__custom__') : handlePlotChosen(id)}
                    style={{ background:'rgba(126,200,80,0.07)', border:'1px solid rgba(126,200,80,0.3)', borderRadius:10, padding:'10px 4px', color:'#D6ECC2', fontSize:11, cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
                    {id === '__custom__' ? '✏️ Custom' : id}
                  </button>
                ))}
              </div>
              {plotId === '__custom__' && (
                <input value={customId} onChange={e => setCustomId(e.target.value)} placeholder="e.g. A1, North-Field"
                  style={{ marginTop:10, width:'100%', boxSizing:'border-box', background:'rgba(15,28,12,0.9)', border:'1px solid rgba(126,200,80,0.4)', borderRadius:10, padding:'10px 14px', color:'#D6ECC2', fontSize:13, fontFamily:"'DM Mono',monospace" }} />
              )}
            </div>
          )}

          {/* ── STEP: Choose crop ── */}
          {step === 'choose_crop' && (
            <div style={{ padding:'14px 18px 20px' }}>
              <div style={{ fontSize:13, color:'rgba(214,236,194,0.5)', marginBottom:4 }}>Plot: <strong style={{color:'#7EC850'}}>{plotId}</strong></div>
              <div style={{ fontSize:14, color:'#D6ECC2', fontWeight:700, marginBottom:12 }}>What crop did you plant here?</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
                {CROP_LIST.map(([key, info]) => (
                  <button key={key} onClick={() => handleCropChosen(key)}
                    style={{ background:'rgba(15,28,12,0.85)', border:`1.5px solid ${info.color}44`, borderRadius:14, padding:'12px 10px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10, transition:'all 0.15s' }}>
                    <span style={{ fontSize:24 }}>{info.emoji}</span>
                    <div>
                      <div style={{ fontSize:13, color:'#D6ECC2', fontWeight:700 }}>{info.name.en}</div>
                      <div style={{ fontSize:11, color:'rgba(214,236,194,0.45)' }}>{info.name[lang] || info.name.hi}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: Confirm ── */}
          {step === 'confirm' && (
            <div style={{ padding:'14px 18px 24px' }}>
              <div style={{ fontSize:14, color:'#D6ECC2', fontWeight:700, marginBottom:14 }}>Confirm recording:</div>
              <div style={{ background:'rgba(126,200,80,0.06)', border:'1px solid rgba(126,200,80,0.2)', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
                {[
                  ['📍 Plot', plotId === '__custom__' ? customId : plotId],
                  ['🌱 Crop', `${CROP_TYPES[cropKey]?.emoji} ${CROP_TYPES[cropKey]?.name?.en}`],
                  ['🗺️ GPS', `${capturedGps?.lat.toFixed(5)}, ${capturedGps?.lng.toFixed(5)}`],
                  ['📡 Accuracy', `±${Math.round(capturedGps?.accuracy || 0)}m`],
                  ['📅 Date', new Date().toLocaleDateString('en-IN')],
                ].map(([label, val]) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:12, color:'rgba(214,236,194,0.5)' }}>{label}</span>
                    <span style={{ fontSize:12, color:'#D6ECC2', fontWeight:700 }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep('choose_crop')}
                  style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px', color:'rgba(214,236,194,0.5)', fontSize:13, cursor:'pointer' }}>
                  ← Change
                </button>
                <button onClick={handleConfirm}
                  style={{ flex:2, background:'linear-gradient(135deg,#3A7D44,#7EC850)', border:'none', borderRadius:12, padding:'12px', color:'#0B1508', fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 0 20px rgba(126,200,80,0.3)' }}>
                  ✅ Save to Database
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Saved ── */}
          {step === 'saved' && (
            <div style={{ padding:'20px 18px 24px', textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
              <div style={{ fontSize:16, color:'#7EC850', fontWeight:700, marginBottom:6 }}>
                Plot {plotId === '__custom__' ? customId : plotId} Saved!
              </div>
              <div style={{ fontSize:12, color:'rgba(214,236,194,0.5)', marginBottom:18 }}>
                {CROP_TYPES[cropKey]?.emoji} {CROP_TYPES[cropKey]?.name?.en} — GPS ±{Math.round(capturedGps?.accuracy || 0)}m — synced to database
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button onClick={recordAnother}
                  style={{ background:'linear-gradient(135deg,#3A7D44,#7EC850)', border:'none', borderRadius:12, padding:'11px 22px', color:'#0B1508', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  📍 Record Another
                </button>
                <button onClick={onClose}
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'11px 22px', color:'rgba(214,236,194,0.6)', fontSize:13, cursor:'pointer' }}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
