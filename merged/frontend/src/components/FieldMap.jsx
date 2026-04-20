import React, { useState } from 'react'
import { useFarmStore, CROP_TYPES, cropName } from '../store/farmStore'
import PlotDetailPanel from './PlotDetailPanel'

const STATUS_COLORS = { ready:'#7EC850', maturing:'#F5C842', growing:'#A8D8EA', seedling:'#D6ECC2' }

export default function FieldMap() {
  const plots         = useFarmStore(s => s.plots)
  const config        = useFarmStore(s => s.config)
  const lang          = useFarmStore(s => s.lang)
  const selectedPlot  = useFarmStore(s => s.selectedPlot)
  const filterCrop    = useFarmStore(s => s.filterCrop)
  const setSelectedPlot = useFarmStore(s => s.setSelectedPlot)
  const setFilterCrop   = useFarmStore(s => s.setFilterCrop)
  const addCropToPlot   = useFarmStore(s => s.addCropToPlot)
  const t = useFarmStore(s => s.t)
  const [addingPlot, setAddingPlot]   = useState(null)
  const [cropSel, setCropSel]         = useState('wheat')
  const [dateSel, setDateSel]         = useState(new Date().toISOString().split('T')[0])
  const [notesSel, setNotesSel]       = useState('')

  const rows = config.rows || 8, cols = config.cols || 10

  const cells = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push(`${r}-${c}`)

  const clickCell = (id) => {
    if (plots[id]?.cropType) { setSelectedPlot(id) }
    else { setAddingPlot(id); setCropSel('wheat'); setDateSel(new Date().toISOString().split('T')[0]); setNotesSel('') }
  }

  const confirmPlant = () => {
    addCropToPlot(addingPlot, cropSel, dateSel, notesSel)
    setAddingPlot(null)
  }

  const inp = { width:'100%', background:'rgba(126,200,80,0.06)', border:'1px solid rgba(126,200,80,0.22)', borderRadius:8, padding:'8px 11px', color:'#D6ECC2', fontSize:12, fontFamily:"'DM Mono','Noto Sans Devanagari',monospace", outline:'none' }
  const lbl = { fontSize:11, color:'rgba(214,236,194,0.5)', display:'block', marginBottom:4 }

  return (
    <div style={{ display:'flex', gap:14, height:'100%' }}>
      {/* Left: grid */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, minWidth:0 }}>
        {/* Filter */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {['all', ...Object.keys(CROP_TYPES)].map(k => (
            <button key={k} onClick={() => setFilterCrop(k)}
              style={{ background: filterCrop===k ? 'rgba(126,200,80,0.18)':'transparent', border:`1px solid ${filterCrop===k?'#7EC850':'rgba(126,200,80,0.18)'}`, borderRadius:20, padding:'3px 10px', fontSize:10, color:filterCrop===k?'#7EC850':'rgba(214,236,194,0.5)', cursor:'pointer' }}>
              {k==='all' ? 'All' : `${CROP_TYPES[k].emoji} ${cropName(k,lang)}`}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:3, background:'rgba(126,200,80,0.03)', border:'1px solid rgba(126,200,80,0.12)', borderRadius:12, padding:10 }}>
          {cells.map(id => {
            const plot = plots[id]
            const show = filterCrop==='all' || (plot?.cropType===filterCrop)
            const isSel = selectedPlot===id
            const color = plot?.cropType ? CROP_TYPES[plot.cropType].color : 'transparent'
            const bg = plot?.cropType && show ? (STATUS_COLORS[plot.status]||'#fff')+'33' : 'rgba(214,236,194,0.03)'
            return (
              <div key={id} onClick={() => clickCell(id)} title={plot?.cropType ? `${cropName(plot.cropType,lang)} (${t('status_'+plot.status)})` : t('map_hint')}
                style={{ aspectRatio:'1', borderRadius:4, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', background:bg, border: isSel ? '2px solid #7EC850' : `1px solid ${plot?.cropType&&show?color+'44':'rgba(126,200,80,0.06)'}`, transform: isSel ? 'scale(1.15)' : 'scale(1)', transition:'transform 0.1s', zIndex: isSel ? 3 : 1 }}>
                {plot?.cropType && show && <span style={{ fontSize:10 }}>{CROP_TYPES[plot.cropType].emoji}</span>}
                {plot?.realGPS && <div style={{ position:'absolute', top:2, right:2, width:4, height:4, borderRadius:'50%', background:'#7EC850' }} />}
                {plot?.cropType && show && <div style={{ position:'absolute', bottom:0, left:0, height:2, borderRadius:2, width:`${plot.progress*100}%`, background:color }} />}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', fontSize:10, color:'rgba(214,236,194,0.45)' }}>
          {Object.entries(STATUS_COLORS).map(([s,c])=>(
            <span key={s} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:c+'88', border:`1px solid ${c}` }}/>{t('status_'+s)}
            </span>
          ))}
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#7EC850' }}/> Real GPS
          </span>
        </div>
      </div>

      {/* Right: detail */}
      <div style={{ width:260, flexShrink:0 }}>
        {selectedPlot && plots[selectedPlot]?.cropType
          ? <PlotDetailPanel plotId={selectedPlot} />
          : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1px dashed rgba(126,200,80,0.2)', borderRadius:12, padding:24, textAlign:'center', height:'100%', gap:10 }}>
              <div style={{ fontSize:32 }}>🌱</div>
              <p style={{ color:'rgba(214,236,194,0.4)', fontSize:12 }}>{t('map_hint')}</p>
            </div>
        }
      </div>

      {/* Add Crop Modal */}
      {addingPlot && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)' }}>
          <div style={{ background:'#0B1508', border:'1px solid rgba(126,200,80,0.28)', borderRadius:16, padding:22, width:'min(340px,94vw)' }}>
            <h3 style={{ fontFamily:"'Syne','Noto Sans Devanagari',sans-serif", fontWeight:700, color:'#7EC850', marginBottom:6 }}>{t('plant_crop')}</h3>
            <p style={{ fontSize:11, color:'rgba(214,236,194,0.5)', marginBottom:14 }}>Plot {addingPlot}</p>

            <label style={lbl}>{t('select_crop')}</label>
            <select value={cropSel} onChange={e=>setCropSel(e.target.value)} style={{ ...inp, marginBottom:10 }}>
              {Object.entries(CROP_TYPES).map(([k,v])=>(
                <option key={k} value={k}>{v.emoji} {cropName(k,lang)} ({v.days}d)</option>
              ))}
            </select>

            <label style={lbl}>{t('date_planted')}</label>
            <input type="date" value={dateSel} onChange={e=>setDateSel(e.target.value)} style={{ ...inp, marginBottom:10 }} />

            <label style={lbl}>{t('notes')}</label>
            <textarea value={notesSel} onChange={e=>setNotesSel(e.target.value)} rows={2} placeholder="..." style={{ ...inp, resize:'none', marginBottom:14 }} />

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={confirmPlant} style={{ flex:1, background:'linear-gradient(135deg,#3A7D44,#7EC850)', border:'none', borderRadius:10, padding:'10px', color:'#0B1508', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>
                {t('plant')}
              </button>
              <button onClick={()=>setAddingPlot(null)} style={{ background:'transparent', border:'1px solid rgba(126,200,80,0.2)', borderRadius:10, padding:'10px 16px', color:'rgba(214,236,194,0.5)', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:13 }}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
