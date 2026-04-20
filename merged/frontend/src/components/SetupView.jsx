import React, { useRef } from 'react'
import { useFarmStore, CROP_TYPES, cropName } from '../store/farmStore'
import { useGPS } from '../hooks/useAR'

export default function SetupView() {
  const plots       = useFarmStore(s => s.plots)
  const config      = useFarmStore(s => s.config)
  const lang        = useFarmStore(s => s.lang)
  const gps         = useFarmStore(s => s.gpsPosition)
  const walkMode    = useFarmStore(s => s.walkMode)
  const t           = useFarmStore(s => s.t)
  const recordPlot  = useFarmStore(s => s.recordPlot)
  const deletePlot  = useFarmStore(s => s.deletePlot)
  const clearAllPlots = useFarmStore(s => s.clearAllPlots)
  const updateConfig  = useFarmStore(s => s.updateConfig)
  const exportData    = useFarmStore(s => s.exportData)
  const importData    = useFarmStore(s => s.importData)
  const setWalkMode   = useFarmStore(s => s.setWalkMode)
  const addAlert      = useFarmStore(s => s.addAlert)
  const importRef     = useRef()
  const plotIdRef     = useRef()
  const [cropSel, setCropSel] = React.useState('wheat')

  useGPS()

  const pv = Object.values(plots)
  const card = { background:'rgba(126,200,80,0.04)', border:'1px solid rgba(126,200,80,0.15)', borderRadius:12, padding:14, marginBottom:12 }
  const hd   = { fontFamily:"'Syne','Noto Sans Devanagari',sans-serif", fontWeight:700, fontSize:13, color:'#7EC850', marginBottom:10 }
  const inp  = { width:'100%', background:'rgba(126,200,80,0.06)', border:'1px solid rgba(126,200,80,0.22)', borderRadius:8, padding:'8px 11px', color:'#D6ECC2', fontSize:13, fontFamily:"'DM Mono','Noto Sans Devanagari',monospace", outline:'none' }
  const lbl  = { fontSize:11, color:'rgba(214,236,194,0.5)', display:'block', marginBottom:4 }
  const btn1 = { background:'linear-gradient(135deg,#3A7D44,#7EC850)', border:'none', borderRadius:10, padding:'10px 18px', color:'#0B1508', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Mono','Noto Sans Devanagari',monospace" }
  const btn2 = { background:'transparent', border:'1px solid rgba(126,200,80,0.22)', borderRadius:10, padding:'10px 16px', color:'rgba(214,236,194,0.6)', fontSize:12, cursor:'pointer', fontFamily:"'DM Mono','Noto Sans Devanagari',monospace" }
  const btn3 = { background:'rgba(230,57,70,0.08)', border:'1px solid rgba(230,57,70,0.25)', borderRadius:10, padding:'10px 14px', color:'#E63946', fontSize:12, cursor:'pointer', fontFamily:"'DM Mono',monospace" }
  const btn4 = { background:'rgba(245,200,66,0.1)', border:'1px solid rgba(245,200,66,0.3)', borderRadius:10, padding:'10px 14px', color:'#F5C842', fontSize:12, cursor:'pointer', fontFamily:"'DM Mono',monospace" }

  const gpsColor = gps.ok && gps.accuracy < 15 ? '#7EC850' : gps.ok ? '#F5C842' : '#E63946'
  const gpsLabel = gps.ok ? `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)} ±${Math.round(gps.accuracy)}m` : t('gps_bad')

  const doRecord = () => {
    const id = plotIdRef.current?.value?.trim()
    if (!id) { addAlert(t('enter_plot_id'), 'error'); return }
    if (!gps.ok) { addAlert(t('gps_not_ready'), 'error'); return }
    recordPlot(id.replace(/\s+/g,'-'), cropSel, gps)
    if (plotIdRef.current) plotIdRef.current.value = ''
    addAlert(`✅ "${id}" ${t('recorded')}`, 'success')
  }

  return (
    <div style={{ height:'100%', overflowY:'auto', paddingBottom:20 }}>

      {/* Walk & Record */}
      <div style={card}>
        <h3 style={hd}>{t('record_plots')}</h3>
        <p style={{ fontSize:11, color:'rgba(214,236,194,0.5)', marginBottom:12 }}>{t('record_plots_desc')}</p>

        {/* GPS status */}
        <div style={{ background:'rgba(11,21,8,0.6)', border:`1px solid ${gpsColor}44`, borderRadius:10, padding:'10px 12px', marginBottom:12, fontSize:11 }}>
          <div style={{ color:gpsColor, fontWeight:600, marginBottom:2 }}>📍 {t('current_gps')}</div>
          <div style={{ color:'rgba(214,236,194,0.65)' }}>{gpsLabel}</div>
          {gps.ok && gps.accuracy > 20 && (
            <div style={{ color:'#F5C842', fontSize:10, marginTop:3 }}>⚠️ Move to open area for better accuracy</div>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginBottom:10 }}>
          <div>
            <label style={lbl}>{t('plot_id')}</label>
            <input ref={plotIdRef} className="plot-id-input" style={inp} placeholder={t('plot_id_placeholder') || 'e.g. A1'} />
          </div>
          <div>
            <label style={lbl}>{t('crop')}</label>
            <select value={cropSel} onChange={e=>setCropSel(e.target.value)} style={{ ...inp, padding:'8px' }}>
              {Object.entries(CROP_TYPES).map(([k,v])=>(
                <option key={k} value={k}>{v.emoji} {cropName(k,lang)}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={doRecord} style={{ ...btn1, flex:1 }}>📍 {t('walk_record')}</button>
          <button onClick={()=>{ if(window.confirm(t('confirm_clear'))) clearAllPlots() }} style={btn3}>{t('clear_all')}</button>
        </div>
      </div>

      {/* Saved plots list */}
      <div style={card}>
        <h3 style={hd}>{t('saved_plots')} ({pv.length})</h3>
        {!pv.length
          ? <div style={{ textAlign:'center', padding:20, color:'rgba(214,236,194,0.4)', fontSize:12 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📭</div>
              {t('no_plots')}
            </div>
          : pv.map(p => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(126,200,80,0.05)', border:'1px solid rgba(126,200,80,0.12)', borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#D6ECC2' }}>
                  {p.id} {p.cropType ? CROP_TYPES[p.cropType]?.emoji : ''}
                </div>
                <div style={{ fontSize:10, color:'rgba(214,236,194,0.45)' }}>
                  {p.cropType ? cropName(p.cropType,lang) : t('empty_plots')} •{' '}
                  <span style={{ color: p.realGPS ? '#7EC850' : 'rgba(214,236,194,0.35)' }}>
                    {p.realGPS ? t('real_gps_badge') : t('simulated_badge')}
                  </span>
                </div>
                {p.realGPS && p.lat && (
                  <div style={{ fontSize:9, color:'rgba(126,200,80,0.5)', marginTop:2 }}>
                    {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                  </div>
                )}
              </div>
              <button onClick={()=>deletePlot(p.id)} style={{ background:'rgba(230,57,70,0.1)', border:'1px solid rgba(230,57,70,0.25)', borderRadius:7, padding:'5px 10px', color:'#E63946', fontSize:11, cursor:'pointer' }}>✕</button>
            </div>
          ))
        }
      </div>

      {/* Field Config */}
      <div style={card}>
        <h3 style={hd}>{t('field_config')}</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={lbl}>{t('rows')}</label>
            <input type="number" defaultValue={config.rows} min={1} max={20} style={inp}
              onChange={e=>updateConfig({ rows:parseInt(e.target.value)||8 })} />
          </div>
          <div>
            <label style={lbl}>{t('cols')}</label>
            <input type="number" defaultValue={config.cols} min={1} max={20} style={inp}
              onChange={e=>updateConfig({ cols:parseInt(e.target.value)||10 })} />
          </div>
        </div>
        <div>
          <label style={lbl}>{t('farm_name')}</label>
          <input type="text" defaultValue={config.name} style={inp}
            onChange={e=>updateConfig({ name:e.target.value })} />
        </div>
      </div>

      {/* Data Management */}
      <div style={card}>
        <h3 style={hd}>{t('data_mgmt')}</h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
          <button onClick={exportData} style={btn4}>{t('exportData')}</button>
          <button onClick={()=>importRef.current?.click()} style={btn2}>{t('importData')}</button>
          <input ref={importRef} type="file" accept=".json" style={{ display:'none' }}
            onChange={e=>{ if(e.target.files[0]) importData(e.target.files[0]) }} />
        </div>
        <p style={{ fontSize:10, color:'rgba(214,236,194,0.35)' }}>{t('data_note')}</p>
      </div>

    </div>
  )
}
