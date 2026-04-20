// hooks/useAR.js — GPS watchPosition + Camera + GPS-tagged seeding-record photo
import { useEffect, useRef, useCallback } from 'react'
import { useFarmStore } from '../store/farmStore'
import { drawPhotoOverlay } from '../utils/arRenderer'
import { logGPS, saveARCapture } from '../services/api'

// ─── CAMERA HOOK ──────────────────────────────────────────────────────────────
export function useARCamera() {
  const videoRef = useRef(null)
  const setCameraStream = useFarmStore(s => s.setCameraStream)
  const addAlert = useFarmStore(s => s.addAlert)

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 3840, min: 640 },
          height: { ideal: 2160, min: 480 },
        },
        audio: false,
      }
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      }
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      return stream
    } catch (err) {
      addAlert(`Camera error: ${err.message || 'Access denied'}`, 'error')
      return null
    }
  }

  const stopCamera = () => {
    const s = useFarmStore.getState().cameraStream
    if (s) { s.getTracks().forEach(t => t.stop()); setCameraStream(null) }
    if (videoRef.current) { videoRef.current.srcObject = null }
  }

  /**
   * Capture a high-quality photo from the live camera feed.
   * Burns a full seeding-record overlay onto the image:
   *  - Top banner: farm name, GPS, timestamp, mini field grid
   *  - Bottom panel: one card per plot showing:
   *    plot ID, crop emoji + name, planting date, days elapsed,
   *    estimated harvest date, growth progress bar, GPS coords, status badge
   *
   * @param {HTMLCanvasElement|null} arCanvas - the live AR overlay canvas (optional)
   */
  const capturePhoto = useCallback(async (arCanvas = null) => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return null

    const { gpsPosition: gps, plots, config, lang } = useFarmStore.getState()
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    const latStr  = gps.ok ? gps.lat.toFixed(6) : 'no-gps'
    const lngStr  = gps.ok ? gps.lng.toFixed(6) : 'no-gps'
    const accStr  = gps.ok ? `acc${Math.round(gps.accuracy)}m` : 'simulated'
    const activeCrops = Object.values(plots).filter(p => p.cropType).map(p => p.cropType).join('-').slice(0, 40) || 'empty'
    const filename = `smartfarm_${dateStr}_${timeStr}_lat${latStr}_lng${lngStr}_${accStr}_${activeCrops}.jpg`

    // ── Draw onto a full-resolution canvas ──────────────────────────────────
    const W = video.videoWidth
    const H = video.videoHeight
    const canvas = document.createElement('canvas')
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // 1. Camera frame
    ctx.drawImage(video, 0, 0, W, H)

    // 2. AR markers overlay (scale from the screen-size AR canvas to photo resolution)
    if (arCanvas && arCanvas.width > 0) {
      ctx.save()
      ctx.globalAlpha = 0.92
      ctx.drawImage(arCanvas, 0, 0, W, H)
      ctx.restore()
    }

    // 3. The rich seeding-record overlay (farm name + GPS + per-plot cards + mini grid)
    drawPhotoOverlay(ctx, W, H, plots, gps, config, lang, now)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve({ blob, filename, gps, plots, timestamp: now.toISOString() }), 'image/jpeg', 0.93)
    })
  }, [])

  /**
   * Capture and auto-download the GPS-tagged seeding-record photo.
   */
  const downloadPhoto = useCallback(async (arCanvas = null) => {
    const result = await capturePhoto(arCanvas)
    if (!result) return
    const { blob, filename } = result
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)

    const activePlots = Object.values(result.plots).filter(p => p.cropType).length
    useFarmStore.getState().addAlert(
      `📸 Seeding photo saved — ${activePlots} plot${activePlots !== 1 ? 's' : ''} recorded`,
      'success'
    )

    // Persist to DB (fire-and-forget)
    saveARCapture({
      filename: result.filename,
      gps:      result.gps,
      plots:    result.plots,
      fileSize: blob.size,
    })

    // Log to localStorage
    const captures = JSON.parse(localStorage.getItem('sf_ar_captures') || '[]')
    captures.unshift({
      filename,
      gps: result.gps,
      timestamp: result.timestamp,
      plotCount: activePlots,
      size: blob.size,
    })
    localStorage.setItem('sf_ar_captures', JSON.stringify(captures.slice(0, 100)))
    return result
  }, [capturePhoto])

  return { videoRef, startCamera, stopCamera, capturePhoto, downloadPhoto }
}


// ─── DEVICE ORIENTATION ───────────────────────────────────────────────────────
export function useDeviceOrientation() {
  const setDeviceOrientation = useFarmStore(s => s.setDeviceOrientation)
  useEffect(() => {
    let attached = false
    const handler = (e) => {
      if (e.alpha !== null) setDeviceOrientation({ alpha: e.alpha || 0, beta: e.beta || 0, gamma: e.gamma || 0 })
    }
    const attach = () => {
      if (!attached) { window.addEventListener('deviceorientation', handler, true); attached = true }
    }
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(p => { if (p === 'granted') attach() }).catch(() => attach())
    } else {
      attach()
    }
    return () => window.removeEventListener('deviceorientation', handler, true)
  }, [setDeviceOrientation])
}


// ─── GPS HOOK — continuous watchPosition with high accuracy ────────────────
export function useGPS() {
  const setGpsPosition = useFarmStore(s => s.setGpsPosition)
  const addAlert = useFarmStore(s => s.addAlert)
  const watchIdRef = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsPosition({ lat: 18.5204, lng: 73.8567, accuracy: 999, ok: false })
      return
    }
    let firstFix = true

    const onSuccess = (pos) => {
      const { latitude, longitude, accuracy, altitude, heading, speed } = pos.coords
      setGpsPosition({
        lat: latitude, lng: longitude, accuracy,
        altitude: altitude ?? null, heading: heading ?? null, speed: speed ?? null,
        ok: true, timestamp: pos.timestamp,
      })
      // Persist to DB (throttled to every 10 s inside logGPS)
      logGPS({ lat: latitude, lng: longitude, accuracy, altitude, speed, ok: true })
      if (firstFix) {
        firstFix = false
        const qual = accuracy < 10 ? 'Excellent' : accuracy < 25 ? 'Good' : accuracy < 50 ? 'Fair' : 'Weak'
        addAlert(`📍 GPS lock: ±${Math.round(accuracy)}m (${qual})`, accuracy < 50 ? 'success' : 'info')
      }
    }

    const onError = (err) => {
      const msgs = { 1: 'GPS permission denied.', 2: 'GPS unavailable. Move to open area.', 3: 'GPS timed out.' }
      setGpsPosition({ lat: 18.5204, lng: 73.8567, accuracy: 999, ok: false })
      if (firstFix) { firstFix = false; addAlert(msgs[err.code] || 'GPS error.', 'error') }
    }

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,   // GPS chip
      maximumAge: 1000,
      timeout: 10000,
    })

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [setGpsPosition, addAlert])
}
