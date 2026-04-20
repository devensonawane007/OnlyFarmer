/**
 * api.js — SmartFarm backend API client
 *
 * All calls go to the FastAPI backend (port 8000).
 * Every function is fire-and-forget safe: if the backend is offline,
 * it silently logs and returns null — the frontend still works fully
 * offline via localStorage.
 */

const BASE = 'http://localhost:8000'

async function post(path, body) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn(`[API] POST ${path} failed:`, e.message)
    return null
  }
}

async function get(path) {
  try {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) throw new Error(`${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn(`[API] GET ${path} failed:`, e.message)
    return null
  }
}

// ── AR Captures ────────────────────────────────────────────────────────────────
export async function saveARCapture({ filename, gps, plots, fileSize }) {
  const activePlots  = Object.values(plots || {}).filter(p => p.cropType)
  const seedingPlots = activePlots.filter(p => p.status === 'seedling' || p.status === 'growing')
  return post('/ar/capture', {
    filename,
    farm_name:          'My Farm',
    gps_lat:            gps?.lat      ?? null,
    gps_lng:            gps?.lng      ?? null,
    gps_accuracy:       gps?.accuracy ?? null,
    gps_ok:             gps?.ok       ?? false,
    plots_snapshot:     plots,
    active_plot_count:  activePlots.length,
    seeding_plot_count: seedingPlots.length,
    file_size_bytes:    fileSize       ?? null,
  })
}

export async function listARCaptures(limit = 50) {
  return get(`/ar/captures?limit=${limit}`)
}

// ── Crop Identifications ──────────────────────────────────────────────────────
export async function saveCropIdentification({ result, gps, assignedToPlot }) {
  if (!result) return null
  return post('/ar/identify', {
    identified_crop:   result.cropKey           ?? null,
    raw_name:          result.rawName            ?? null,
    confidence:        result.confidence         ?? null,
    stage_name:        result.stageName          ?? null,
    stage_description: result.stageDescription  ?? null,
    care_tips:         result.careTips           ?? [],
    names:             result.names              ?? {},
    what_i_see:        result.whatISee           ?? null,
    not_a_crop:        result.notACrop           ?? false,
    assigned_to_plot:  assignedToPlot            ?? null,
    gps_lat:           gps?.lat  ?? null,
    gps_lng:           gps?.lng  ?? null,
  })
}

export async function listCropIdentifications(limit = 50) {
  return get(`/ar/identifications?limit=${limit}`)
}

// ── GPS Log ───────────────────────────────────────────────────────────────────
// Throttled: only log to DB every 10 s to avoid hammering with watchPosition
let _lastGpsLog = 0
const GPS_LOG_INTERVAL_MS = 10_000

export async function logGPS({ lat, lng, accuracy, altitude, speed, ok }) {
  const now = Date.now()
  if (now - _lastGpsLog < GPS_LOG_INTERVAL_MS) return null
  _lastGpsLog = now
  return post('/ar/gps', {
    lat, lng,
    accuracy_m: accuracy ?? null,
    altitude_m: altitude ?? null,
    speed_ms:   speed    ?? null,
    ok:         ok       ?? false,
  })
}

export async function getGPSHistory(limit = 200) {
  return get(`/ar/gps/history?limit=${limit}`)
}

// ── Plot Sync ─────────────────────────────────────────────────────────────────
export async function syncPlots(plots) {
  const list = Object.values(plots).map(p => ({
    id:           p.id,
    crop_type:    p.cropType    ?? null,
    planted_date: p.plantedDate ?? null,
    days_planted: p.daysPlanted ?? 0,
    progress:     p.progress    ?? 0,
    status:       p.status      ?? 'empty',
    notes:        p.notes       ?? '',
    lat:          p.lat         ?? null,
    lng:          p.lng         ?? null,
    accuracy_m:   p.accuracy    ?? null,
    real_gps:     p.realGPS     ?? false,
    moisture:     p.moisture    ?? 65,
    health:       p.health      ?? 90,
    temperature:  p.temperature ?? 28,
    recorded_at:  p.recordedAt  ?? null,
  }))
  return post('/ar/plots/sync', list)
}

export async function getDBPlots() {
  return get('/ar/plots')
}

// ── Disease Scans ─────────────────────────────────────────────────────────────
export async function listDiseaseScans() {
  return get('/problem/list')
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export async function getDBStats() {
  return get('/ar/stats')
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export async function saveChatMessage({ sessionId = 'default', role, content, lang = 'en' }) {
  return post('/ar/chat/save', { session_id: sessionId, role, content, lang })
}

export async function getChatHistory(sessionId = 'default', limit = 100) {
  return get(`/ar/chat/history?session_id=${sessionId}&limit=${limit}`)
}
