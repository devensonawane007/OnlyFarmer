import React, { useState } from 'react'
import { useFarmStore, CROP_TYPES, cropName } from '../store/farmStore'

export default function PlotDetailPanel({ plotId, inAR = false }) {
  const plot         = useFarmStore(s => s.plots[plotId])
  const lang         = useFarmStore(s => s.lang)
  const removeCrop   = useFarmStore(s => s.removeCrop)
  const updateSensors= useFarmStore(s => s.updateSensors)
  const setSelectedPlot = useFarmStore(s => s.setSelectedPlot)
  const t = useFarmStore(s => s.t)
  const [editSensors, setEditSensors] = useState(false)
  const [m, setM] = useState(plot?.moisture || 65)
  const [h, setH] = useState(plot?.health   || 90)
  const [temp, setTemp] = useState(plot?.temperature || 28)

  if (!plot?.cropType) return null
  const c = CROP_TYPES[plot.cropType]
  const daysLeft = Math.max(0, c.days - plot.daysPlanted)
  const hDate = new Date(Date.now() + daysLeft * 86400000).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
  const statusMap = { ready:t('status_ready'), maturing:t('status_maturing'), growing:t('status_growing'), seedling:t('status_seedling') }

  const inp = { width:'100%', background:'rgba(126,200,80,0.06)', border:'1px solid rgba(126,200,80,0.22)', borderRadius:8, padding:'7px 10px', color:'#D6ECC2', fontSize:12, outline:'none', fontFamily:"'DM Mono',monospace" }
  const lbl = { fontSize:10, color:'rgba(214,236,194,0.5)', display:'block', marginBottom:3 }

  const wrapStyle = inAR
    ? { position:'fixed', bottom:55, left:'50%', transform:'translateX(-50%)', width:'min(340px,92vw)', zIndex:85, background:'rgba(11,21,8,0.97)', border:`1px solid ${c.color}55`, borderRadius:14, padding:16, backdropFilter:'blur(20px)' }
    : { background:'rgba(11,21,8,0.97)', border:`1px solid ${c.color}44`, borderRadius:14, padding:16 }

  const saveSensors = () => {
    updateSensors(plotId, parseInt(m), parseInt(h), parseInt(temp))
    setEditSensors(false)
  }

  return (
    <div style={wrapStyle}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:40, height:40, borderRadius:9, background:c.color+'20', border:`1px solid ${c.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{c.emoji}</div>
          <div>
            <div style={{ fontFamily:"'Syne','Noto Sans Devanagari',sans-serif", fontWeight:700, fontSize:15, color:c.color }}>{cropName(plot.cropType,lang)}</div>
            <div style={{ fontSize:10, color:'rgba(214,236,194,0.45)' }}>
              Plot {plotId} {plot.realGPS && <span style={{ color:'#7EC850' }}>• {t('real_gps_badge')}</span>}
            </div>
          </div>
        </div>
        {!inAR && <button onClick={()=>setSelectedPlot(null)} style={{ background:'transparent', border:'none', color:'rgba(214,236,194,0.35)', fontSize:16, cursor:'pointer' }}>✕</button>}
      </div>

      {/* Status badge */}
      <div style={{ display:'inline-block', background:c.color+'20', border:`1px solid ${c.color}44`, borderRadius:20, padding:'3px 11px', fontSize:10, color:c.color, marginBottom:12 }}>
        {statusMap[plot.status] || plot.status}
      </div>

      {/* Progress */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(214,236,194,0.5)', marginBottom:4 }}>
          <span>Progress</span><span>{Math.round(plot.progress*100)}%</span>
        </div>
        <div style={{ height:5, background:'rgba(126,200,80,0.1)', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${plot.progress*100}%`, background:`linear-gradient(90deg,${c.color}77,${c.color})`, borderRadius:3 }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:12 }}>
        {[
          [t('days_left'), daysLeft, 'd', c.color],
          [t('moisture'),  plot.moisture, '%', '#A8D8EA'],
          [t('health'),    plot.health,   '%', '#7EC850'],
        ].map(([lbl2,val,unit,color])=>(
          <div key={lbl2} style={{ background:'rgba(126,200,80,0.04)', border:'1px solid rgba(126,200,80,0.1)', borderRadius:7, padding:7, textAlign:'center' }}>
            <div style={{ fontSize:15, fontWeight:700, color }}>{val}</div>
            <div style={{ fontSize:8, color:'rgba(214,236,194,0.4)' }}>{unit}</div>
            <div style={{ fontSize:8, color:'rgba(214,236,194,0.35)', marginTop:1 }}>{lbl2}</div>
          </div>
        ))}
      </div>

      {/* Harvest date */}
      <div style={{ background:'rgba(126,200,80,0.05)', border:'1px solid rgba(126,200,80,0.13)', borderRadius:8, padding:'7px 10px', fontSize:11, color:'rgba(214,236,194,0.6)', marginBottom:10 }}>
        📅 {t('harvest_date')}: <strong style={{ color:'#7EC850' }}>{hDate}</strong>
      </div>

      {/* Temperature */}
      {plot.temperature && (
        <div style={{ fontSize:11, color:'rgba(214,236,194,0.45)', marginBottom:10 }}>🌡️ {plot.temperature}°C</div>
      )}

      {/* GPS coords */}
      {plot.lat && (
        <div style={{ fontSize:10, color:'rgba(214,236,194,0.3)', marginBottom:12, fontFamily:'DM Mono,monospace' }}>
          📍 {plot.lat.toFixed(6)}, {plot.lng.toFixed(6)}
          {plot.realGPS && <span style={{ color:'#7EC850', marginLeft:5 }}>✓</span>}
        </div>
      )}

      {/* Notes */}
      {plot.notes && (
        <div style={{ fontSize:10, color:'rgba(214,236,194,0.45)', marginBottom:10, padding:'6px 8px', background:'rgba(126,200,80,0.04)', borderRadius:6 }}>
          📝 {plot.notes}
        </div>
      )}

      {/* Edit sensors */}
      {editSensors ? (
        <div style={{ marginBottom:10 }}>
          <label style={lbl}>{t('moisture')}</label>
          <input type="number" value={m} onChange={e=>setM(e.target.value)} min={0} max={100} style={{ ...inp, marginBottom:8 }} />
          <label style={lbl}>{t('health')}</label>
          <input type="number" value={h} onChange={e=>setH(e.target.value)} min={0} max={100} style={{ ...inp, marginBottom:8 }} />
          <label style={lbl}>{t('temperature')}</label>
          <input type="number" value={temp} onChange={e=>setTemp(e.target.value)} min={-10} max={60} style={{ ...inp, marginBottom:10 }} />
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={saveSensors} style={{ flex:1, background:'linear-gradient(135deg,#3A7D44,#7EC850)', border:'none', borderRadius:8, padding:'8px', color:'#0B1508', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>{t('save')}</button>
            <button onClick={()=>setEditSensors(false)} style={{ background:'transparent', border:'1px solid rgba(126,200,80,0.2)', borderRadius:8, padding:'8px 12px', color:'rgba(214,236,194,0.5)', cursor:'pointer', fontSize:12, fontFamily:"'DM Mono',monospace" }}>{t('cancel')}</button>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button onClick={()=>{ setM(plot.moisture); setH(plot.health); setTemp(plot.temperature||28); setEditSensors(true) }}
            style={{ flex:1, background:'rgba(245,200,66,0.1)', border:'1px solid rgba(245,200,66,0.3)', borderRadius:8, padding:'8px', color:'#F5C842', fontSize:11, cursor:'pointer', fontFamily:"'DM Mono','Noto Sans Devanagari',monospace" }}>
            {t('edit_sensors')}
          </button>
          <button onClick={()=>removeCrop(plotId)}
            style={{ flex:1, background:'rgba(230,57,70,0.08)', border:'1px solid rgba(230,57,70,0.28)', borderRadius:8, padding:'8px', color:'#E63946', fontSize:11, cursor:'pointer', fontFamily:"'DM Mono','Noto Sans Devanagari',monospace" }}>
            {t('remove_crop')}
          </button>
        </div>
      )}
    </div>
  )
}
