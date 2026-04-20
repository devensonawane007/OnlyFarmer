import React from 'react'
import { useFarmStore, CROP_TYPES, cropName } from '../store/farmStore'

export default function Dashboard() {
  const plots    = useFarmStore(s => s.plots)
  const lang     = useFarmStore(s => s.lang)
  const setView  = useFarmStore(s => s.setView)
  const gps      = useFarmStore(s => s.gpsPosition)
  const t        = useFarmStore(s => s.t)

  const pv       = Object.values(plots)
  const active   = pv.filter(p => p.cropType)
  const ready    = active.filter(p => p.status === 'ready').length
  const empty    = pv.filter(p => !p.cropType).length
  const alerts   = active.filter(p => p.status === 'ready' || p.moisture < 45)

  const counts = {}
  active.forEach(p => counts[p.cropType] = (counts[p.cropType] || 0) + 1)

  const card = { background:'rgba(126,200,80,0.04)', border:'1px solid rgba(126,200,80,0.15)', borderRadius:12, padding:14 }
  const hd   = { fontFamily:"'Syne','Noto Sans Devanagari',sans-serif", fontWeight:700, fontSize:13, color:'#7EC850', marginBottom:10 }

  return (
    <div style={{ height:'100%', overflowY:'auto', display:'flex', flexDirection:'column', gap:12, paddingBottom:16 }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:8 }}>
        {[
          { icon:'🌾', label:t('total_plots'),    val:pv.length,        color:'#7EC850' },
          { icon:'✅', label:t('harvest_ready'),  val:ready,            color:'#7EC850' },
          { icon:'🌿', label:t('active_crops'),   val:active.length,    color:'#A8D8EA' },
          { icon:'⬜', label:t('empty_plots'),    val:empty,            color:'rgba(214,236,194,0.35)' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(126,200,80,0.04)', border:'1px solid rgba(126,200,80,0.15)', borderRadius:10, padding:'10px 12px' }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:s.color, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:9, color:'rgba(214,236,194,0.45)', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* AR Launch */}
      <button
        onClick={() => setView('ar')}
        style={{ background:'linear-gradient(135deg,rgba(58,125,68,0.32),rgba(126,200,80,0.15))', border:'1px solid rgba(126,200,80,0.38)', borderRadius:14, padding:'16px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, width:'100%', textAlign:'left', transition:'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(126,200,80,0.2)' }}
        onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
      >
        <div style={{ fontSize:38 }}>📱</div>
        <div>
          <div style={{ fontFamily:"'Syne','Noto Sans Devanagari',sans-serif", fontWeight:800, fontSize:16, color:'#7EC850', marginBottom:3 }}>{t('ar_launch_title')}</div>
          <div style={{ fontSize:11, color:'rgba(214,236,194,0.55)' }}>{t('ar_launch_sub')}</div>
        </div>
        <div style={{ marginLeft:'auto', color:'#7EC850', fontSize:20 }}>→</div>
      </button>

      {/* Alerts + Crop Breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={card}>
          <h3 style={hd}>{t('alerts_title')}</h3>
          {!active.length
            ? <p style={{ color:'rgba(214,236,194,0.35)', fontSize:11 }}>{t('no_plots').slice(0,40)}</p>
            : !alerts.length
            ? <p style={{ color:'rgba(214,236,194,0.4)', fontSize:11 }}>{t('no_alerts')}</p>
            : alerts.slice(0,4).map(p => (
              <div key={p.id} style={{ display:'flex', gap:7, padding:'5px 0', borderBottom:'1px solid rgba(126,200,80,0.07)', fontSize:11 }}>
                <span>{CROP_TYPES[p.cropType]?.emoji}</span>
                <div>
                  <div style={{ color: p.status==='ready' ? '#7EC850' : '#F5C842' }}>
                    {p.status==='ready' ? t('alert_ready') : `${t('alert_moisture')} (${p.moisture}%)`}
                  </div>
                  <div style={{ color:'rgba(214,236,194,0.4)', fontSize:9 }}>{cropName(p.cropType,lang)} — {p.id}</div>
                </div>
              </div>
            ))
          }
        </div>

        <div style={card}>
          <h3 style={hd}>{t('crop_breakdown')}</h3>
          {!Object.keys(counts).length
            ? <p style={{ color:'rgba(214,236,194,0.35)', fontSize:11 }}>{t('no_crops')}</p>
            : Object.entries(counts).map(([k, n]) => {
              const c = CROP_TYPES[k], pct = Math.round(n / pv.length * 100)
              return (
                <div key={k} style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:3 }}>
                    <span>{c.emoji} {cropName(k,lang)}</span>
                    <span style={{ color:c.color }}>{n}</span>
                  </div>
                  <div style={{ height:4, background:'rgba(126,200,80,0.1)', borderRadius:2 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:c.color, borderRadius:2 }} />
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>

      {/* GPS */}
      <div style={{ background:'rgba(168,216,234,0.05)', border:'1px solid rgba(168,216,234,0.15)', borderRadius:12, padding:'11px 14px', display:'flex', gap:10, alignItems:'center', fontSize:11 }}>
        <span style={{ fontSize:18 }}>📍</span>
        <div>
          <div style={{ color:'#A8D8EA', fontWeight:600 }}>
            {t('your_location')}: {gps.ok ? `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}` : '—'}
          </div>
          <div style={{ color:'rgba(168,216,234,0.45)', marginTop:2 }}>
            {t('accuracy')}: {gps.ok ? `±${Math.round(gps.accuracy)}m` : t('gps_bad')}
          </div>
        </div>
      </div>
    </div>
  )
}
