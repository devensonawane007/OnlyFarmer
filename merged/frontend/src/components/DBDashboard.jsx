/**
 * DBDashboard.jsx — Live view of the SmartFarm SQLite database
 * Shows stats, recent AR captures, crop identifications, GPS log, plot sync status
 */
import React, { useEffect, useState, useCallback } from 'react'
import { useFarmStore, CROP_TYPES } from '../store/farmStore'
import { getDBStats, listARCaptures, listCropIdentifications, getGPSHistory, listDiseaseScans, syncPlots } from '../services/api'

const C = {
  bg:      'rgba(11,21,8,0.97)',
  card:    'rgba(15,28,12,0.9)',
  border:  'rgba(126,200,80,0.18)',
  green:   '#7EC850',
  yellow:  '#F5C842',
  blue:    '#A8D8EA',
  dim:     'rgba(214,236,194,0.45)',
  dimMore: 'rgba(214,236,194,0.25)',
}

function StatCard({ icon, label, value, color = C.green }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${color}33`, borderRadius: 12, padding: '14px 16px', textAlign: 'center', flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 10, color: C.dimMore, marginTop: 4, fontFamily: "'DM Mono',monospace" }}>{label}</div>
    </div>
  )
}

function Section({ title, children, color = C.green }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, color, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 1, background: `${color}33` }} />
        {title}
        <div style={{ flex: 1, height: 1, background: `${color}33` }} />
      </div>
      {children}
    </div>
  )
}

function TableRow({ cells, highlight }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '7px 10px', background: highlight ? 'rgba(126,200,80,0.05)' : 'transparent', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontFamily: "'DM Mono',monospace", color: C.dim, flexWrap: 'wrap' }}>
      {cells.map((c, i) => (
        <span key={i} style={{ flex: c.flex || 1, color: c.color || C.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.val}</span>
      ))}
    </div>
  )
}

function fmtTime(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

function fmtCoord(n) {
  return n != null ? Number(n).toFixed(4) : '—'
}

export default function DBDashboard() {
  const lang   = useFarmStore(s => s.lang)
  const plots  = useFarmStore(s => s.plots)
  const setView = useFarmStore(s => s.setView)

  const [stats,   setStats]   = useState(null)
  const [captures, setCaptures] = useState([])
  const [ids,      setIds]      = useState([])
  const [gpsLog,   setGpsLog]   = useState([])
  const [diseases, setDiseases] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [syncing,  setSyncing]  = useState(false)
  const [tab, setTab] = useState('overview')
  const [backendOk, setBackendOk] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [s, c, i, g, d] = await Promise.all([
      getDBStats(), listARCaptures(), listCropIdentifications(), getGPSHistory(50), listDiseaseScans()
    ])
    setBackendOk(s !== null)
    if (s) setStats(s)
    if (c) setCaptures(c)
    if (i) setIds(i)
    if (g) setGpsLog(g)
    if (d) setDiseases(d)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSync = async () => {
    setSyncing(true)
    await syncPlots(plots)
    await load()
    setSyncing(false)
  }

  const TABS = ['overview', 'plots', 'captures', 'crop id', 'gps', 'disease']

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 10, overflowY: 'auto', fontFamily: "'DM Mono','Noto Sans Devanagari',monospace" }}>

      {/* Header */}
      <div style={{ background: 'rgba(15,28,12,0.95)', borderBottom: `1px solid ${C.green}33`, padding: '12px 16px', position: 'sticky', top: 0, zIndex: 5, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', color: C.green, fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.green }}>🗄️ SmartFarm Database</div>
          <div style={{ fontSize: 10, color: C.dimMore, marginTop: 1 }}>
            {backendOk === null ? '⏳ Connecting…' : backendOk ? '🟢 Backend online · SQLite synced' : '🔴 Backend offline · showing localStorage only'}
          </div>
        </div>
        <button onClick={handleSync} disabled={syncing || !backendOk} style={{ background: syncing ? 'rgba(126,200,80,0.1)' : 'rgba(126,200,80,0.15)', border: `1px solid ${C.green}44`, borderRadius: 8, padding: '6px 12px', color: C.green, fontSize: 11, cursor: syncing || !backendOk ? 'not-allowed' : 'pointer' }}>
          {syncing ? '⏳ Syncing…' : '⬆ Sync Now'}
        </button>
        <button onClick={load} style={{ background: 'rgba(168,216,234,0.1)', border: `1px solid ${C.blue}44`, borderRadius: 8, padding: '6px 12px', color: C.blue, fontSize: 11, cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 14px', overflowX: 'auto', borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: tab === t ? `${C.green}22` : 'transparent', border: `1px solid ${tab === t ? C.green : C.border}`, borderRadius: 8, padding: '5px 12px', color: tab === t ? C.green : C.dimMore, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 14px', maxWidth: 900, margin: '0 auto' }}>

        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', color: C.dim, padding: 40 }}>⏳ Loading database…</div>
            ) : !backendOk ? (
              <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔌</div>
                <div style={{ color: '#E63946', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Backend Offline</div>
                <div style={{ color: C.dimMore, fontSize: 12 }}>Start the FastAPI backend:<br/><code style={{ color: C.yellow, fontSize: 11 }}>cd backend && uvicorn main:app --reload</code></div>
              </div>
            ) : (
              <>
                <Section title="Database Records" color={C.green}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <StatCard icon="🌾" label="Plots" value={stats?.plots} />
                    <StatCard icon="🌱" label="With Crops" value={stats?.plots_with_crop} />
                    <StatCard icon="📸" label="AR Captures" value={stats?.ar_captures} />
                    <StatCard icon="🔍" label="Crop IDs" value={stats?.crop_identifications} color={C.blue} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <StatCard icon="🦠" label="Disease Scans" value={stats?.disease_scans} color={C.yellow} />
                    <StatCard icon="📍" label="GPS Entries" value={stats?.gps_log_entries} />
                    <StatCard icon="💬" label="Chat Messages" value={stats?.chat_messages} color={C.dim} />
                    <StatCard icon="🚛" label="Transporters" value={stats?.exchange_transporters} color={C.blue} />
                  </div>
                </Section>

                <Section title="Local State vs DB" color={C.yellow}>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, color: C.dim }}>
                      <span>📱 Local plots (localStorage)</span>
                      <span style={{ color: C.green, fontWeight: 700 }}>{Object.keys(plots).length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 12, color: C.dim }}>
                      <span>🗄️ DB plots (SQLite)</span>
                      <span style={{ color: C.blue, fontWeight: 700 }}>{stats?.plots ?? '—'}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.dimMore, lineHeight: 1.6 }}>
                      Plots auto-sync to DB 1.5s after every change. Hit <strong style={{ color: C.green }}>⬆ Sync Now</strong> to force-push all local plots immediately.
                    </div>
                  </div>
                </Section>

                <Section title="Tables" color={C.dim}>
                  {[
                    { name: 'farms', desc: 'Farm configuration & metadata' },
                    { name: 'plots', desc: 'GPS-tagged plot records with crop info' },
                    { name: 'sensor_readings', desc: 'Moisture / health / temperature time-series' },
                    { name: 'ar_captures', desc: 'Every GPS-tagged seeding photo event' },
                    { name: 'crop_identifications', desc: 'AI vision crop ID results' },
                    { name: 'gps_log', desc: 'Continuous GPS position history' },
                    { name: 'disease_scans', desc: 'Plant disease detection results' },
                    { name: 'exchange_orders', desc: 'Farm Direct Exchange importer orders' },
                    { name: 'exchange_transporters', desc: 'Registered transporters' },
                    { name: 'chat_history', desc: 'Kisan AI conversation log' },
                  ].map(t => (
                    <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderBottom: `1px solid ${C.border}`, fontSize: 11 }}>
                      <code style={{ color: C.green, background: 'rgba(126,200,80,0.08)', padding: '2px 6px', borderRadius: 4, minWidth: 180 }}>{t.name}</code>
                      <span style={{ color: C.dimMore }}>{t.desc}</span>
                    </div>
                  ))}
                </Section>
              </>
            )}
          </>
        )}

        {/* ── PLOTS ────────────────────────────────────────────────── */}
        {tab === 'plots' && (
          <Section title={`Plots — ${Object.keys(plots).length} in local store`} color={C.green}>
            <TableRow cells={[
              { val: 'Plot ID', color: C.green }, { val: 'Crop', color: C.green },
              { val: 'Status', color: C.green }, { val: 'Progress', color: C.green },
              { val: 'GPS', color: C.green }, { val: 'Planted', color: C.green }
            ]} />
            {Object.values(plots).length === 0 && <div style={{ textAlign: 'center', color: C.dimMore, padding: 24, fontSize: 12 }}>No plots recorded yet. Use Setup → Walk & Record.</div>}
            {Object.values(plots).sort((a, b) => a.id > b.id ? 1 : -1).map((p, i) => {
              const ci = p.cropType ? CROP_TYPES[p.cropType] : null
              return (
                <TableRow key={p.id} highlight={i % 2 === 0} cells={[
                  { val: p.id, color: C.green },
                  { val: ci ? `${ci.emoji} ${p.cropType}` : '—', color: ci?.color || C.dimMore },
                  { val: p.status || '—', color: p.status === 'ready' ? C.green : p.status === 'maturing' ? C.yellow : C.dim },
                  { val: p.cropType ? `${Math.round((p.progress || 0) * 100)}%` : '—' },
                  { val: p.realGPS ? `📍 ${fmtCoord(p.lat)},${fmtCoord(p.lng)}` : '(sim)', color: p.realGPS ? C.green : C.dimMore },
                  { val: p.plantedDate || '—' },
                ]} />
              )
            })}
          </Section>
        )}

        {/* ── AR CAPTURES ──────────────────────────────────────────── */}
        {tab === 'captures' && (
          <Section title={`AR Photo Captures — ${captures.length} records`} color={C.green}>
            {captures.length === 0 && <div style={{ textAlign: 'center', color: C.dimMore, padding: 24, fontSize: 12 }}>No photos captured yet. Use AR View → 📸.</div>}
            <TableRow cells={[
              { val: 'Filename', color: C.green, flex: 3 },
              { val: 'GPS', color: C.green },
              { val: 'Plots', color: C.green },
              { val: 'Time', color: C.green },
            ]} />
            {captures.map((c, i) => (
              <TableRow key={c.id} highlight={i % 2 === 0} cells={[
                { val: c.filename?.replace('smartfarm_', '').slice(0, 32) + '…', flex: 3 },
                { val: c.gps_ok ? `📍 ±${Math.round(c.gps_accuracy || 0)}m` : '—', color: c.gps_ok ? C.green : C.dimMore },
                { val: `${c.active_plot_count ?? 0} crops / ${c.seeding_plot_count ?? 0} seeding` },
                { val: fmtTime(c.captured_at) },
              ]} />
            ))}
          </Section>
        )}

        {/* ── CROP IDENTIFICATIONS ─────────────────────────────────── */}
        {tab === 'crop id' && (
          <Section title={`AI Crop Identifications — ${ids.length} records`} color={C.blue}>
            {ids.length === 0 && <div style={{ textAlign: 'center', color: C.dimMore, padding: 24, fontSize: 12 }}>No crop IDs yet. Use AR View → 🔍 Identify Crop.</div>}
            <TableRow cells={[
              { val: 'Crop', color: C.blue }, { val: 'Confidence', color: C.blue },
              { val: 'Stage', color: C.blue }, { val: 'Assigned', color: C.blue },
              { val: 'GPS', color: C.blue }, { val: 'Time', color: C.blue },
            ]} />
            {ids.map((r, i) => {
              const ci = r.identified_crop ? CROP_TYPES[r.identified_crop] : null
              return (
                <TableRow key={r.id} highlight={i % 2 === 0} cells={[
                  { val: ci ? `${ci.emoji} ${r.identified_crop}` : r.raw_name || '—', color: ci?.color || C.dim },
                  { val: r.confidence != null ? `${r.confidence}%` : '—', color: r.confidence >= 80 ? C.green : C.yellow },
                  { val: r.stage_name || '—' },
                  { val: r.assigned_to_plot || '—', color: r.assigned_to_plot ? C.green : C.dimMore },
                  { val: r.gps_lat != null ? `${fmtCoord(r.gps_lat)},${fmtCoord(r.gps_lng)}` : '—' },
                  { val: fmtTime(r.identified_at) },
                ]} />
              )
            })}
          </Section>
        )}

        {/* ── GPS LOG ───────────────────────────────────────────────── */}
        {tab === 'gps' && (
          <Section title={`GPS Position Log — last ${gpsLog.length} entries`} color={C.yellow}>
            {gpsLog.length === 0 && <div style={{ textAlign: 'center', color: C.dimMore, padding: 24, fontSize: 12 }}>No GPS entries yet. GPS logs every 10 seconds while AR is active.</div>}
            <TableRow cells={[
              { val: 'Latitude', color: C.yellow }, { val: 'Longitude', color: C.yellow },
              { val: 'Accuracy', color: C.yellow }, { val: 'Altitude', color: C.yellow },
              { val: 'Time', color: C.yellow },
            ]} />
            {gpsLog.map((g, i) => (
              <TableRow key={g.id} highlight={i % 2 === 0} cells={[
                { val: fmtCoord(g.lat), color: C.green },
                { val: fmtCoord(g.lng), color: C.green },
                { val: g.accuracy_m != null ? `±${Math.round(g.accuracy_m)}m` : '—', color: g.accuracy_m < 15 ? C.green : g.accuracy_m < 40 ? C.yellow : '#FF9F1C' },
                { val: g.altitude_m != null ? `${Math.round(g.altitude_m)}m` : '—' },
                { val: fmtTime(g.logged_at) },
              ]} />
            ))}
          </Section>
        )}

        {/* ── DISEASE SCANS ─────────────────────────────────────────── */}
        {tab === 'disease' && (
          <Section title={`Disease Scans — ${diseases.length} records`} color={C.yellow}>
            {diseases.length === 0 && <div style={{ textAlign: 'center', color: C.dimMore, padding: 24, fontSize: 12 }}>No disease scans yet. Use the Disease Detection tab.</div>}
            <TableRow cells={[
              { val: 'Crop', color: C.yellow }, { val: 'Disease', color: C.yellow },
              { val: 'Confidence', color: C.yellow }, { val: 'Severity', color: C.yellow },
              { val: 'Time', color: C.yellow },
            ]} />
            {diseases.map((d, i) => (
              <TableRow key={d.id} highlight={i % 2 === 0} cells={[
                { val: d.crop || d.detected_crop || '—' },
                { val: (d.disease || '').replace(/[_]+/g, ' ').slice(0, 30), color: d.is_healthy ? C.green : C.yellow },
                { val: d.confidence != null ? `${Math.round(d.confidence)}%` : '—' },
                { val: d.severity || '—', color: d.severity === 'High' ? '#E63946' : d.severity === 'Medium' ? C.yellow : C.green },
                { val: fmtTime(d.timestamp) },
              ]} />
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}
