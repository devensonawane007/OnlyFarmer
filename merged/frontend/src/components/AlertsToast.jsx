import React from 'react'
import { useFarmStore } from '../store/farmStore'

const STYLES = {
  success: { bg:'rgba(126,200,80,0.15)',  border:'#7EC850', icon:'✅' },
  info:    { bg:'rgba(168,216,234,0.15)', border:'#A8D8EA', icon:'ℹ️' },
  error:   { bg:'rgba(230,57,70,0.15)',   border:'#E63946', icon:'⚠️' },
}

export default function AlertsToast() {
  const alerts = useFarmStore(s => s.alerts)
  return (
    <div style={{ position:'fixed', top:14, right:14, zIndex:200, display:'flex', flexDirection:'column', gap:7, pointerEvents:'none' }}>
      {alerts.map(a => {
        const s = STYLES[a.type] || STYLES.info
        return (
          <div key={a.id} style={{ background:s.bg, border:`1px solid ${s.border}55`, borderRadius:10, padding:'9px 14px', fontSize:12, display:'flex', gap:8, alignItems:'center', backdropFilter:'blur(12px)', boxShadow:`0 4px 20px ${s.border}22`, maxWidth:270, fontFamily:"'DM Mono','Noto Sans Devanagari',monospace", color:'#D6ECC2' }}>
            <span>{s.icon}</span><span>{a.msg}</span>
          </div>
        )
      })}
    </div>
  )
}
