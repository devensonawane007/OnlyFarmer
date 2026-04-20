// CropIdentifyPanel.jsx — AR overlay panel showing AI crop identification result
import React, { useEffect, useRef, useState } from 'react'
import { useFarmStore, cropName as getCropName, CROP_TYPES } from '../store/farmStore'

const STAGE_COLORS = {
  seedling:  { bg: '#D6ECC233', border: '#D6ECC2', dot: '#D6ECC2', label: 'Seedling'  },
  germination: { bg: '#A8D8EA33', border: '#A8D8EA', dot: '#A8D8EA', label: 'Germination' },
  vegetative: { bg: '#7EC85033', border: '#7EC850', dot: '#7EC850', label: 'Vegetative' },
  growing:   { bg: '#A8D8EA33', border: '#A8D8EA', dot: '#A8D8EA', label: 'Growing'   },
  flowering: { bg: '#F5C84233', border: '#F5C842', dot: '#F5C842', label: 'Flowering' },
  maturing:  { bg: '#F5C84233', border: '#F5C842', dot: '#F5C842', label: 'Maturing'  },
  ready:     { bg: '#7EC85033', border: '#7EC850', dot: '#7EC850', label: 'Ready'      },
  unknown:   { bg: '#ffffff18', border: '#ffffff44', dot: '#ffffff88', label: 'Unknown' },
}

function ConfidenceBar({ value, color }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 80)
    return () => clearTimeout(t)
  }, [value])
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:3,
          background: value >= 80 ? '#7EC850' : value >= 60 ? '#F5C842' : '#FF9F1C',
          width: `${animated}%`,
          transition: 'width 0.9s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: `0 0 8px ${value >= 80 ? '#7EC85088' : '#F5C84288'}`,
        }} />
      </div>
      <span style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color: value >= 80 ? '#7EC850' : '#F5C842', minWidth:36 }}>
        {value}%
      </span>
    </div>
  )
}

export default function CropIdentifyPanel({ result, loading, error, onClose, onAssignToPlot }) {
  const lang   = useFarmStore(s => s.lang)
  const plots  = useFarmStore(s => s.plots)
  const [visible, setVisible] = useState(false)
  const [selectedPlot, setSelectedPlot] = useState('')

  // Slide in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 320)
  }

  const emptyPlots = Object.values(plots).filter(p => !p.cropType)
  const stageKey   = result?.stageName?.toLowerCase() || 'unknown'
  const stageStyle = STAGE_COLORS[stageKey] || STAGE_COLORS.unknown
  const cropColor  = result?.cropInfo?.color || '#7EC850'
  const cropEmoji  = result?.cropInfo?.emoji || '🌱'

  // Local name in current language
  const localName = result?.names?.[lang] || result?.names?.en || result?.rawName || ''
  const englishName = result?.names?.en || result?.rawName || ''

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
      transition: 'background 0.32s',
      backdropFilter: visible ? 'blur(2px)' : 'none',
    }} onClick={e => e.target === e.currentTarget && handleClose()}>

      <div style={{
        background: 'linear-gradient(180deg, rgba(8,18,6,0.97) 0%, rgba(11,21,8,0.99) 100%)',
        borderTop: `2px solid ${cropColor}66`,
        borderRadius: '20px 20px 0 0',
        padding: '0 0 env(safe-area-inset-bottom,16px)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.38s cubic-bezier(0.34,1.1,0.64,1)',
        maxHeight: '82vh',
        overflowY: 'auto',
        fontFamily: "'DM Mono','Noto Sans Devanagari',monospace",
      }}>

        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px 0' }}>
          <span style={{ fontSize:11, color:'rgba(214,236,194,0.45)', letterSpacing:2, textTransform:'uppercase' }}>
            AI Crop Vision
          </span>
          <button onClick={handleClose}
            style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'4px 10px', color:'rgba(214,236,194,0.6)', fontSize:11, cursor:'pointer' }}>
            ✕ Close
          </button>
        </div>

        {/* ── Loading state ─────────────────────────────────────── */}
        {loading && (
          <div style={{ padding:'32px 18px', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12, animation:'spin 1.2s linear infinite' }}>🔍</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
            <div style={{ color:'#7EC850', fontSize:14, fontWeight:700, marginBottom:6 }}>Identifying crop…</div>
            <div style={{ color:'rgba(214,236,194,0.45)', fontSize:12 }}>Analysing leaf shape, color & texture</div>
            {/* Animated dots */}
            <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:16 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#7EC850', opacity:0.3, animation:`pulse 1.2s ease-in-out ${i*0.22}s infinite` }} />
              ))}
            </div>
            <style>{`@keyframes pulse{0%,100%{opacity:0.2;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
          </div>
        )}

        {/* ── Error state ───────────────────────────────────────── */}
        {!loading && error && (
          <div style={{ padding:'24px 18px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
            <div style={{ color:'#F5C842', fontSize:13, marginBottom:6 }}>Could not identify crop</div>
            <div style={{ color:'rgba(214,236,194,0.4)', fontSize:11 }}>{error}</div>
          </div>
        )}

        {/* ── Result ───────────────────────────────────────────── */}
        {!loading && result && !result.notACrop && (
          <div style={{ padding:'14px 18px 20px', animation:'fadein 0.4s ease' }}>

            {/* Crop hero */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              {/* Emoji bubble */}
              <div style={{
                width:64, height:64, borderRadius:16,
                background: `linear-gradient(135deg, ${cropColor}22, ${cropColor}11)`,
                border: `2px solid ${cropColor}55`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:34, flexShrink:0,
                boxShadow: `0 0 20px ${cropColor}33`,
              }}>
                {cropEmoji}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                {/* Local name big */}
                <div style={{ fontSize:22, fontWeight:800, color: cropColor, lineHeight:1.1, marginBottom:2 }}>
                  {localName}
                </div>
                {/* English name (if different) */}
                {localName !== englishName && (
                  <div style={{ fontSize:12, color:'rgba(214,236,194,0.5)', marginBottom:4 }}>{englishName}</div>
                )}
                {/* All three language names */}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {result.names && Object.entries(result.names).map(([l, n]) => (
                    n && n !== localName ? (
                      <span key={l} style={{ fontSize:10, color:'rgba(214,236,194,0.4)', background:'rgba(255,255,255,0.05)', borderRadius:4, padding:'2px 6px' }}>
                        {l.toUpperCase()}: {n}
                      </span>
                    ) : null
                  ))}
                </div>
              </div>
            </div>

            {/* Confidence */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:'rgba(214,236,194,0.4)', marginBottom:5, letterSpacing:1, textTransform:'uppercase' }}>AI Confidence</div>
              <ConfidenceBar value={result.confidence} />
            </div>

            {/* Growth stage */}
            <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'flex-start' }}>
              <div style={{
                flex:1, background: stageStyle.bg, border:`1px solid ${stageStyle.border}44`,
                borderRadius:10, padding:'10px 12px',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: stageStyle.dot, boxShadow:`0 0 6px ${stageStyle.dot}` }} />
                  <span style={{ fontSize:11, color: stageStyle.dot, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>
                    {stageStyle.label} Stage
                  </span>
                </div>
                <div style={{ fontSize:12, color:'rgba(214,236,194,0.65)', lineHeight:1.4 }}>
                  {result.stageDescription || 'Current observed growth stage'}
                </div>
              </div>
            </div>

            {/* What AI sees */}
            {result.whatISee && (
              <div style={{ background:'rgba(126,200,80,0.05)', border:'1px solid rgba(126,200,80,0.12)', borderRadius:10, padding:'10px 12px', marginBottom:14 }}>
                <div style={{ fontSize:10, color:'rgba(126,200,80,0.5)', marginBottom:4, letterSpacing:1, textTransform:'uppercase' }}>What AI sees</div>
                <div style={{ fontSize:12, color:'rgba(214,236,194,0.6)', lineHeight:1.5, fontStyle:'italic' }}>
                  "{result.whatISee}"
                </div>
              </div>
            )}

            {/* Care tips */}
            {result.careTips?.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, color:'rgba(214,236,194,0.4)', marginBottom:8, letterSpacing:1, textTransform:'uppercase' }}>
                  🌿 Care tips for this stage
                </div>
                {result.careTips.map((tip, i) => (
                  <div key={i} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
                    <div style={{ width:20, height:20, borderRadius:6, background:`${cropColor}22`, border:`1px solid ${cropColor}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:cropColor, fontWeight:700, flexShrink:0, marginTop:1 }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize:12, color:'rgba(214,236,194,0.75)', lineHeight:1.5 }}>{tip}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Assign to plot (if there are empty plots) */}
            {result.cropKey && emptyPlots.length > 0 && onAssignToPlot && (
              <div style={{ borderTop:'1px solid rgba(126,200,80,0.12)', paddingTop:14 }}>
                <div style={{ fontSize:10, color:'rgba(214,236,194,0.4)', marginBottom:8, letterSpacing:1, textTransform:'uppercase' }}>
                  📍 Save to a plot
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <select
                    value={selectedPlot}
                    onChange={e => setSelectedPlot(e.target.value)}
                    style={{ flex:1, background:'rgba(15,28,12,0.9)', border:'1px solid rgba(126,200,80,0.3)', borderRadius:8, padding:'8px 10px', color:'#D6ECC2', fontSize:12, fontFamily:"'DM Mono',monospace", cursor:'pointer' }}
                  >
                    <option value=''>Select plot…</option>
                    {emptyPlots.map(p => (
                      <option key={p.id} value={p.id}>Plot {p.id}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => selectedPlot && onAssignToPlot(selectedPlot, result.cropKey)}
                    disabled={!selectedPlot}
                    style={{ background: selectedPlot ? `linear-gradient(135deg, ${cropColor}cc, ${cropColor})` : 'rgba(126,200,80,0.1)', border:'none', borderRadius:8, padding:'8px 14px', color: selectedPlot ? '#0B1508' : 'rgba(126,200,80,0.3)', fontSize:12, fontWeight:700, cursor: selectedPlot ? 'pointer' : 'not-allowed' }}>
                    Plant 🌱
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Not a crop ─────────────────────────────────────────── */}
        {!loading && result?.notACrop && (
          <div style={{ padding:'20px 18px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🤔</div>
            <div style={{ color:'#F5C842', fontSize:13, marginBottom:6 }}>No crop detected</div>
            <div style={{ color:'rgba(214,236,194,0.5)', fontSize:12, lineHeight:1.5 }}>{result.whatISee || 'Point the camera at a crop or field to identify it.'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
