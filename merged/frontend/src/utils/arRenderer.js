// arRenderer.js — GPS→screen math + Canvas AR drawing with visible high-contrast fonts
import { CROP_TYPES, cropName } from '../store/farmStore'

const MLAT = 111000, MLNG = 104647

export function gpsToScreen(pLat, pLng, uLat, uLng, heading, w, h) {
  const dx = (pLng - uLng) * MLNG
  const dy = (pLat - uLat) * MLAT
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist > 80) return null
  const rad = (heading * Math.PI) / 180
  const rx = dx * Math.cos(rad) + dy * Math.sin(rad)
  const ry = -dx * Math.sin(rad) + dy * Math.cos(rad)
  const ax = Math.atan2(rx, ry) * (180 / Math.PI)
  if (Math.abs(ax) > 35) return null
  return {
    x: w / 2 + (ax / 35) * (w / 2),
    y: h * 0.52,
    scale: Math.max(0.5, 1 - dist / 80),
    dist,
  }
}

// ── Stroke text helper — draws text with a solid outline so it reads over any background ──
function strokeText(ctx, text, x, y, fillColor, strokeColor, strokeWidth) {
  ctx.strokeStyle = strokeColor || 'rgba(0,0,0,0.95)'
  ctx.lineWidth   = strokeWidth || 5
  ctx.lineJoin    = 'round'
  ctx.strokeText(text, x, y)
  ctx.fillStyle   = fillColor || '#FFFFFF'
  ctx.fillText(text, x, y)
}

export function drawCropMarker(ctx, x, y, scale, plot, lang) {
  const c = CROP_TYPES[plot.cropType]
  if (!c) return

  const sz  = Math.max(56, 72 * scale)
  const fsc = Math.max(0.7, scale)   // font scale, don't shrink too small
  ctx.save()
  ctx.translate(x, y)

  // ── Outer glow ────────────────────────────────────────────────────────────
  const g = ctx.createRadialGradient(0, 0, sz * 0.2, 0, 0, sz * 1.6)
  g.addColorStop(0, c.color + '60')
  g.addColorStop(0.5, c.color + '25')
  g.addColorStop(1, 'transparent')
  ctx.beginPath(); ctx.arc(0, 0, sz * 1.6, 0, Math.PI * 2)
  ctx.fillStyle = g; ctx.fill()

  // ── Main circle — solid dark background so text is always readable ────────
  ctx.beginPath(); ctx.arc(0, 0, sz * 0.62, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(8,16,6,0.93)'
  ctx.shadowColor = c.color; ctx.shadowBlur = 14 * scale
  ctx.fill()
  ctx.shadowBlur = 0

  // Border ring
  ctx.strokeStyle = c.color; ctx.lineWidth = 3.5 * scale; ctx.stroke()

  // ── Progress arc ─────────────────────────────────────────────────────────
  ctx.beginPath()
  ctx.arc(0, 0, sz * 0.62, -Math.PI / 2, -Math.PI / 2 + plot.progress * Math.PI * 2)
  ctx.strokeStyle = c.color + 'DD'; ctx.lineWidth = 5 * scale; ctx.lineCap = 'round'
  ctx.stroke()

  // ── Emoji ─────────────────────────────────────────────────────────────────
  ctx.font = `${sz * 0.58}px serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(c.emoji, 0, 2)

  // ── Label tag above circle ────────────────────────────────────────────────
  const name      = cropName(plot.cropType, lang)
  const pct       = Math.round(plot.progress * 100)
  const labelText = name
  const subText   = `${pct}% • ${plot.status}`

  const tagY  = -(sz * 0.62 + 14 * fsc)
  const fSize = Math.round(Math.max(14, 16 * fsc))

  // Measure for background pill
  ctx.font = `bold ${fSize}px "DM Mono", "Noto Sans Devanagari", monospace`
  const tw = ctx.measureText(labelText).width
  const sw = ctx.measureText(subText).width
  const pillW = Math.max(tw, sw) + 22 * fsc
  const pillH = fSize * 2.7

  // Pill background — high opacity so text is always sharp
  ctx.beginPath()
  ctx.roundRect(-pillW / 2, tagY - pillH + 6, pillW, pillH, 8 * fsc)
  ctx.fillStyle = 'rgba(6,12,5,0.94)'
  ctx.strokeStyle = c.color; ctx.lineWidth = 2 * fsc
  ctx.fill(); ctx.stroke()

  // Crop name — big, white, readable
  ctx.font = `bold ${fSize}px "DM Mono", "Noto Sans Devanagari", monospace`
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'
  strokeText(ctx, labelText, 0, tagY - pillH + 10, '#FFFFFF', 'rgba(0,0,0,0.9)', 4)

  // Sub-text — progress + status
  const subY = tagY - pillH + 10 + fSize + 2
  ctx.font = `${Math.round(fSize * 0.78)}px "DM Mono", monospace`
  strokeText(ctx, subText, 0, subY, c.color, 'rgba(0,0,0,0.9)', 3)

  // ── Plot ID badge (bottom left of circle) ─────────────────────────────────
  const idText = `Plot ${plot.id}`
  const idFSize = Math.round(Math.max(11, 12 * fsc))
  ctx.font = `bold ${idFSize}px "DM Mono", monospace`
  const idW = ctx.measureText(idText).width + 12 * fsc
  const idX = -sz * 0.3
  const idY = sz * 0.68
  ctx.beginPath()
  ctx.roundRect(idX - idW / 2, idY, idW, idFSize + 8 * fsc, 5 * fsc)
  ctx.fillStyle = c.color + 'EE'; ctx.fill()
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'
  strokeText(ctx, idText, idX, idY + 4 * fsc, '#0B1508', 'rgba(0,0,0,0.2)', 1)

  // ── GPS dot ───────────────────────────────────────────────────────────────
  if (plot.realGPS) {
    ctx.beginPath(); ctx.arc(sz * 0.5, -sz * 0.5, 6 * fsc, 0, Math.PI * 2)
    ctx.fillStyle = '#7EC850'
    ctx.shadowColor = '#7EC850'; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0
  }

  // ── Stem + ground pin ────────────────────────────────────────────────────
  ctx.beginPath()
  ctx.moveTo(0, sz * 0.62)
  ctx.lineTo(0, sz * 1.1)
  ctx.strokeStyle = c.color + '99'; ctx.lineWidth = 2.5 * scale
  ctx.shadowColor = c.color; ctx.shadowBlur = 4; ctx.stroke(); ctx.shadowBlur = 0
  ctx.beginPath(); ctx.arc(0, sz * 1.1, 5 * fsc, 0, Math.PI * 2)
  ctx.fillStyle = c.color; ctx.fill()

  ctx.restore()
}


export function drawHUD(ctx, w, h, heading, gpsOk, gpsAcc, plotCount, demoMode, lang, t) {
  // ── Compass (top right) ──────────────────────────────────────────────────
  const cx = w - 56, cy = 58, cr = 38
  ctx.save()
  // Shadow behind compass
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 12
  ctx.beginPath(); ctx.arc(cx, cy, cr + 2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(8,16,6,0.92)'; ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(126,200,80,0.5)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke()

  ctx.save(); ctx.translate(cx, cy); ctx.rotate((heading * Math.PI) / 180)
  ctx.beginPath(); ctx.moveTo(0, -cr * 0.65); ctx.lineTo(6, 5); ctx.lineTo(-6, 5); ctx.closePath()
  ctx.fillStyle = '#E63946'; ctx.shadowColor = '#E63946'; ctx.shadowBlur = 6; ctx.fill()
  ctx.beginPath(); ctx.moveTo(0, cr * 0.65); ctx.lineTo(6, -5); ctx.lineTo(-6, -5); ctx.closePath()
  ctx.fillStyle = '#A8D8EA'; ctx.shadowColor = 'transparent'; ctx.fill()
  ctx.restore()

  // N label
  ctx.font = 'bold 11px "DM Mono", monospace'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  strokeText(ctx, 'N', cx, cy - cr * 0.82, '#FFFFFF', 'rgba(0,0,0,0.95)', 3)
  ctx.font = '10px "DM Mono", monospace'
  strokeText(ctx, Math.round(heading) + '°', cx, cy + cr * 0.8, 'rgba(214,236,194,0.9)', 'rgba(0,0,0,0.95)', 2)
  ctx.restore()

  // ── Bottom info bar ─────────────────────────────────────────────────────
  const bh = 50
  // Gradient fade so bar blends with camera
  const barGrad = ctx.createLinearGradient(0, h - bh - 10, 0, h)
  barGrad.addColorStop(0, 'rgba(8,16,6,0)')
  barGrad.addColorStop(0.25, 'rgba(8,16,6,0.88)')
  barGrad.addColorStop(1, 'rgba(8,16,6,0.96)')
  ctx.fillStyle = barGrad; ctx.fillRect(0, h - bh - 10, w, bh + 10)

  // Top border line of bar
  ctx.strokeStyle = 'rgba(126,200,80,0.25)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, h - bh); ctx.lineTo(w, h - bh); ctx.stroke()

  const mid = h - bh / 2 + 5
  const gpsColor = gpsOk
    ? gpsAcc < 15 ? '#7EC850' : gpsAcc < 40 ? '#F5C842' : '#FF9F1C'
    : '#E63946'
  const gpsStr = gpsOk ? `📍 GPS ±${Math.round(gpsAcc)}m` : demoMode ? '🎮 DEMO' : '❌ No GPS'

  ctx.font = 'bold 13px "DM Mono", monospace'
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  strokeText(ctx, gpsStr, 16, mid, gpsColor, 'rgba(0,0,0,0.95)', 4)

  ctx.textAlign = 'center'
  strokeText(ctx, `${plotCount} ${t('active_crops')}`, w / 2, mid, '#FFFFFF', 'rgba(0,0,0,0.95)', 4)

  ctx.textAlign = 'right'
  strokeText(ctx, demoMode ? t('demo_mode') : t('ar_live'), w - 16, mid,
    demoMode ? '#F5C842' : '#A8D8EA', 'rgba(0,0,0,0.95)', 4)

  // ── Subtle scan line ───────────────────────────────────────────────────
  const sy = (Date.now() / 22) % h
  const sg = ctx.createLinearGradient(0, sy - 50, 0, sy + 12)
  sg.addColorStop(0, 'rgba(126,200,80,0)')
  sg.addColorStop(1, 'rgba(126,200,80,0.06)')
  ctx.fillStyle = sg; ctx.fillRect(0, sy - 50, w, 62)
}


export function renderARFrame(canvas, plots, gpsPosition, deviceOrientation, demoMode, lang, t) {
  const ctx = canvas.getContext('2d')
  const w   = canvas.width, h = canvas.height
  ctx.clearRect(0, 0, w, h)

  if (demoMode) {
    const bg = ctx.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, 'rgba(5,10,3,0.97)'); bg.addColorStop(1, 'rgba(11,21,8,0.97)')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)
    // Grid lines
    ctx.strokeStyle = 'rgba(126,200,80,0.05)'; ctx.lineWidth = 1
    for (let x = 0; x < w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    for (let y = 0; y < h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
  }

  const heading    = deviceOrientation.alpha
  const activePlots = Object.values(plots).filter(p => p.cropType)
  const visible    = []

  activePlots.forEach(plot => {
    let pos
    if (demoMode && !gpsPosition.ok) {
      const i     = activePlots.indexOf(plot)
      const count = Math.min(activePlots.length, 8)
      if (i >= count) return
      const angle = -28 + i * (56 / Math.max(count - 1, 1))
      pos = { x: w / 2 + (angle / 35) * (w / 2), y: h * 0.5 + Math.sin(i * 0.9) * 30, scale: 0.85, dist: 10 + i * 4 }
    } else {
      pos = gpsToScreen(plot.lat, plot.lng, gpsPosition.lat, gpsPosition.lng, heading, w, h)
    }
    if (pos) visible.push({ plot, pos })
  })

  if (activePlots.length === 0) {
    ctx.font = 'bold 15px "DM Mono", monospace'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    strokeText(ctx, t('no_crops_ar'), w / 2, h * 0.48, '#FFE566', 'rgba(0,0,0,0.95)', 5)
  }

  visible.sort((a, b) => b.pos.dist - a.pos.dist)
  visible.forEach(({ plot, pos }) => drawCropMarker(ctx, pos.x, pos.y, pos.scale, plot, lang))
  drawHUD(ctx, w, h, heading, gpsPosition.ok, gpsPosition.accuracy, activePlots.length, demoMode, lang, t)
}


// ── WALK & RECORD HUD ── drawn on top of camera during GPS recording mode ────
export function drawWalkRecordHUD(ctx, w, h, gps, walkPlotId) {
  // Top banner
  const bh = 72
  const grad = ctx.createLinearGradient(0, 0, 0, bh + 8)
  grad.addColorStop(0, 'rgba(6,12,5,0.97)')
  grad.addColorStop(1, 'rgba(6,12,5,0)')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, bh + 8)

  ctx.font = 'bold 17px "DM Mono", monospace'
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'
  strokeText(ctx, '🚶 WALK & RECORD MODE', w / 2, 12, '#7EC850', 'rgba(0,0,0,0.95)', 5)

  ctx.font = '13px "DM Mono", monospace'
  strokeText(ctx, walkPlotId ? `Recording Plot: ${walkPlotId}` : 'Walk to your plot, then tap 📍', w / 2, 36, '#D6ECC2', 'rgba(0,0,0,0.95)', 4)

  // GPS quality pill (center of screen)
  const gpsColor = gps.ok
    ? gps.accuracy < 12 ? '#7EC850' : gps.accuracy < 35 ? '#F5C842' : '#FF9F1C'
    : '#E63946'
  const gpsQual  = !gps.ok ? 'No GPS Signal'
    : gps.accuracy < 12 ? '✅ Excellent GPS'
    : gps.accuracy < 35 ? '⚡ Good GPS'
    : '⚠️ Weak GPS — move to open area'
  const gpsStr   = gps.ok ? `${gpsQual} — ±${Math.round(gps.accuracy)}m` : gpsQual

  const pillW = Math.min(w - 40, 340)
  ctx.fillStyle = 'rgba(6,12,5,0.9)'
  ctx.strokeStyle = gpsColor; ctx.lineWidth = 2
  ctx.beginPath(); ctx.roundRect((w - pillW) / 2, h / 2 - 28, pillW, 56, 14); ctx.fill(); ctx.stroke()

  ctx.font = 'bold 14px "DM Mono", monospace'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  strokeText(ctx, gpsStr, w / 2, h / 2 - 6, gpsColor, 'rgba(0,0,0,0.9)', 4)
  if (gps.ok) {
    ctx.font = '11px "DM Mono", monospace'
    strokeText(ctx, `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`, w / 2, h / 2 + 12, 'rgba(214,236,194,0.8)', 'rgba(0,0,0,0.9)', 3)
  }

  // Crosshair at center
  const cx2 = w / 2, cy2 = h / 2 + 70
  const cr2  = 24
  ctx.strokeStyle = gpsColor + 'CC'; ctx.lineWidth = 2
  ctx.shadowColor = gpsColor; ctx.shadowBlur = 8
  ctx.beginPath(); ctx.moveTo(cx2 - cr2, cy2); ctx.lineTo(cx2 + cr2, cy2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx2, cy2 - cr2); ctx.lineTo(cx2, cy2 + cr2); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx2, cy2, 6, 0, Math.PI * 2)
  ctx.fillStyle = gpsColor; ctx.fill()
  ctx.shadowBlur = 0
}


// ─── PHOTO OVERLAY — burned into saved photos ─────────────────────────────────
export function drawPhotoOverlay(ctx, W, H, plots, gps, config, lang, now) {
  const activePlots = Object.values(plots).filter(p => p.cropType)
  const allPlots    = Object.values(plots)
  const farmName    = config?.name || 'My Farm'

  const sc  = Math.max(0.5, Math.min(3, W / 1080))
  const pad = Math.round(16 * sc)
  const fs  = { sm: Math.round(11 * sc), md: Math.round(13 * sc), lg: Math.round(16 * sc), xl: Math.round(20 * sc) }

  // ── TOP HEADER ────────────────────────────────────────────────────────────
  const headerH = Math.round(64 * sc)
  const hg = ctx.createLinearGradient(0, 0, W, 0)
  hg.addColorStop(0, 'rgba(11,21,8,0.97)'); hg.addColorStop(1, 'rgba(11,21,8,0.97)')
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, headerH)
  ctx.strokeStyle = '#7EC850'; ctx.lineWidth = Math.round(2 * sc)
  ctx.beginPath(); ctx.moveTo(0, headerH); ctx.lineTo(W, headerH); ctx.stroke()

  ctx.font = `bold ${fs.xl}px "DM Mono", monospace`
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#7EC850'; ctx.fillText(`🌾 ${farmName}`, pad, headerH / 2)

  const dtStr = now.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
  ctx.font = `${fs.sm}px "DM Mono", monospace`; ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(214,236,194,0.75)'; ctx.fillText(dtStr, W - pad, headerH / 2 - Math.round(6 * sc))
  ctx.fillStyle = gps.ok ? '#7EC850' : '#F5C842'
  ctx.fillText(gps.ok ? `📍 GPS ±${Math.round(gps.accuracy)}m` : '📍 No GPS', W - pad, headerH / 2 + Math.round(8 * sc))

  // ── MINI FIELD GRID ───────────────────────────────────────────────────────
  if (allPlots.length > 0) {
    const rows = config?.rows || 8, cols = config?.cols || 10
    const gridW = Math.round(cols * 10 * sc), gridH = Math.round(rows * 10 * sc)
    const gx = W - pad - gridW, gy = Math.round(8 * sc)
    ctx.fillStyle = 'rgba(126,200,80,0.08)'; ctx.strokeStyle = 'rgba(126,200,80,0.25)'; ctx.lineWidth = 1
    ctx.fillRect(gx - 2, gy - 2, gridW + 4, gridH + 4); ctx.strokeRect(gx - 2, gy - 2, gridW + 4, gridH + 4)
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const id = `${r}-${c}`, plot = plots[id]
      const cx2 = gx + c * Math.round(10 * sc), cy2 = gy + r * Math.round(10 * sc)
      const cw = Math.round(9 * sc), ch = Math.round(9 * sc)
      ctx.fillStyle = plot?.cropType ? CROP_TYPES[plot.cropType]?.color + 'cc' : 'rgba(126,200,80,0.06)'
      ctx.fillRect(cx2, cy2, cw, ch)
      ctx.strokeStyle = 'rgba(126,200,80,0.15)'; ctx.lineWidth = 0.5; ctx.strokeRect(cx2, cy2, cw, ch)
    }
  }

  // ── BOTTOM PANEL ──────────────────────────────────────────────────────────
  const cardH   = Math.round(72 * sc), cardGap = Math.round(8 * sc)
  const maxCards = Math.min(activePlots.length, Math.floor((H * 0.42 - pad * 2 - Math.round(44 * sc)) / (cardH + cardGap)))
  const panelH  = maxCards > 0 ? pad * 2 + Math.round(44 * sc) + maxCards * (cardH + cardGap) : Math.round(80 * sc)
  const panelY  = H - panelH
  const pg = ctx.createLinearGradient(0, panelY, 0, H)
  pg.addColorStop(0, 'rgba(5,12,4,0.0)'); pg.addColorStop(0.1, 'rgba(11,21,8,0.97)'); pg.addColorStop(1, 'rgba(6,14,5,0.99)')
  ctx.fillStyle = pg; ctx.fillRect(0, panelY, W, panelH)
  ctx.strokeStyle = '#7EC850'; ctx.lineWidth = Math.round(2 * sc)
  ctx.beginPath(); ctx.moveTo(0, panelY + Math.round(20 * sc)); ctx.lineTo(W, panelY + Math.round(20 * sc)); ctx.stroke()

  ctx.font = `bold ${fs.lg}px "DM Mono", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  ctx.fillStyle = '#D6ECC2'; ctx.fillText('📋 SEEDING RECORD', pad, panelY + pad)

  if (activePlots.length === 0) {
    ctx.fillStyle = 'rgba(245,200,66,0.7)'; ctx.font = `bold ${fs.md}px "DM Mono", monospace`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('No crops recorded yet', W / 2, panelY + panelH / 2)
  } else {
    const sorted   = [...activePlots].sort((a, b) => ({ seedling:0,growing:1,maturing:2,ready:3 }[a.status]??4) - ({ seedling:0,growing:1,maturing:2,ready:3 }[b.status]??4))
    const cardsStartY = panelY + pad + Math.round(36 * sc)
    const twoCol  = W > 700 * sc, colCount = twoCol ? 2 : 1
    const colW    = Math.floor((W - pad * (colCount + 1)) / colCount)
    sorted.slice(0, maxCards * colCount).forEach((plot, i) => {
      const col = i % colCount, row = Math.floor(i / colCount)
      const cx2 = pad + col * (colW + pad), cy2 = cardsStartY + row * (cardH + cardGap)
      if (cy2 + cardH > H - pad / 2) return
      const cropInfo = CROP_TYPES[plot.cropType]; if (!cropInfo) return
      const STATUS_COLORS = { seedling:'#D6ECC2', growing:'#A8D8EA', maturing:'#F5C842', ready:'#7EC850' }
      const statusColor = STATUS_COLORS[plot.status] || '#D6ECC2', cropColor = cropInfo.color
      const radius = Math.round(8 * sc)
      function rr(x,y,w2,h2,r2){ ctx.beginPath(); ctx.moveTo(x+r2,y); ctx.lineTo(x+w2-r2,y); ctx.quadraticCurveTo(x+w2,y,x+w2,y+r2); ctx.lineTo(x+w2,y+h2-r2); ctx.quadraticCurveTo(x+w2,y+h2,x+w2-r2,y+h2); ctx.lineTo(x+r2,y+h2); ctx.quadraticCurveTo(x,y+h2,x,y+h2-r2); ctx.lineTo(x,y+r2); ctx.quadraticCurveTo(x,y,x+r2,y); ctx.closePath() }
      rr(cx2, cy2, colW, cardH, radius)
      ctx.fillStyle = 'rgba(15,28,12,0.92)'; ctx.strokeStyle = cropColor + 'bb'; ctx.lineWidth = Math.round(1.5*sc); ctx.fill(); ctx.stroke()
      ctx.fillStyle = cropColor; ctx.fillRect(cx2, cy2, Math.round(5*sc), cardH)
      const innerX = cx2 + Math.round(14*sc)
      ctx.font = `${Math.round(28*sc)}px serif`; ctx.textAlign='left'; ctx.textBaseline='middle'
      ctx.fillText(cropInfo.emoji, innerX, cy2 + cardH/2)
      const textX = innerX + Math.round(34*sc)
      ctx.fillStyle='#D6ECC2'; ctx.font=`bold ${fs.lg}px "DM Mono",monospace`; ctx.textAlign='left'; ctx.textBaseline='top'
      ctx.fillText(`Plot ${plot.id}`, textX, cy2+Math.round(7*sc))
      ctx.fillStyle=cropColor; ctx.font=`bold ${fs.md}px "DM Mono",monospace`
      ctx.fillText(cropName(plot.cropType, lang), textX, cy2+Math.round(7*sc)+Math.round(18*sc))
      ctx.fillStyle='rgba(214,236,194,0.55)'; ctx.font=`${fs.sm}px "DM Mono",monospace`
      ctx.fillText(plot.plantedDate ? `Planted: ${plot.plantedDate}` : 'Date unknown', textX, cy2+Math.round(7*sc)+Math.round(36*sc))
      if (plot.daysPlanted !== undefined) {
        ctx.fillStyle='rgba(168,216,234,0.7)'
        ctx.fillText(`Day ${plot.daysPlanted}/${cropInfo.days} — ~${Math.max(0,cropInfo.days-plot.daysPlanted)}d left`, textX, cy2+Math.round(7*sc)+Math.round(51*sc))
      }
      // Status pill right side
      const rightX = cx2 + colW - Math.round(82*sc)
      const pillW2 = Math.round(72*sc), pillH2 = Math.round(18*sc)
      rr(rightX, cy2+Math.round(7*sc), pillW2, pillH2, Math.round(4*sc))
      ctx.fillStyle=statusColor+'33'; ctx.strokeStyle=statusColor+'88'; ctx.lineWidth=Math.round(1*sc); ctx.fill(); ctx.stroke()
      ctx.fillStyle=statusColor; ctx.font=`bold ${Math.round(9*sc)}px "DM Mono",monospace`; ctx.textAlign='center'; ctx.textBaseline='middle'
      ctx.fillText(({seedling:'SEEDING',growing:'GROWING',maturing:'MATURING',ready:'READY'}[plot.status]||'UNKNOWN'), rightX+pillW2/2, cy2+Math.round(7*sc)+pillH2/2)
    })
  }
}
