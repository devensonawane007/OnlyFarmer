import { create } from 'zustand'
import { syncPlots } from '../services/api'

// Debounced plot sync — waits 1.5s after last change before syncing to DB
let _syncTimer = null
function debouncedSync(plots) {
  clearTimeout(_syncTimer)
  _syncTimer = setTimeout(() => syncPlots(plots), 1500)
}

// ── TRANSLATIONS ──────────────────────────────────────────────
export const TRANSLATIONS = {
  en: {
    appTitle: 'SmartFarm AR', appSub: 'Augmented Reality Field Management',
    nav_home: 'Home', nav_map: 'Field Map', nav_setup: 'Setup', nav_ar: 'AR View',
    ar_launch_title: 'Open AR Camera', ar_launch_sub: 'Walk your field — see live crop data on every plot',
    alerts_title: '⚡ Alerts', crop_breakdown: '🌾 Crops',
    your_location: 'Your Location', accuracy: 'Accuracy',
    record_plots: '📍 Record Real Plot Locations',
    record_plots_desc: 'Walk to each plot in your field, tap the button, and your real GPS will be saved.',
    walk_record: '🚶 Walk & Record Plots', clear_all: '🗑 Clear All',
    saved_plots: '📋 Saved Plots', no_plots: 'No plots recorded yet. Use Walk & Record above.',
    field_config: '⚙️ Field Configuration', rows: 'Rows', cols: 'Columns', farm_name: 'Farm Name',
    data_mgmt: '💾 Data Management', exportData: '📤 Export Data', importData: '📥 Import Data',
    data_note: 'All data is saved locally on your device.',
    map_hint: 'Tap any plot to view or add a crop',
    status_ready: 'Ready', status_maturing: 'Maturing', status_growing: 'Growing', status_seedling: 'Seedling',
    plant_crop: '🌱 Plant a Crop', select_crop: 'Select Crop', date_planted: 'Date Planted',
    notes: 'Notes', plant: 'Plant', cancel: 'Cancel', done: 'Done',
    update_sensors: '📊 Update Sensor Data', moisture: 'Soil Moisture (%)',
    health: 'Plant Health (%)', temperature: 'Temperature (°C)', save: 'Save',
    walk_title: '🚶 Walk & Record Mode',
    walk_desc: 'Walk to a plot in your field, then tap the button below to record its GPS.',
    current_gps: 'Current GPS', plot_id: 'Plot ID / Name', crop: 'Crop',
    total_plots: 'Total Plots', harvest_ready: 'Harvest Ready', active_crops: 'Active Crops', empty_plots: 'Empty Plots',
    days_left: 'Days Left', remove_crop: '🗑 Remove Crop', edit_sensors: '📊 Edit Sensors',
    harvest_date: 'Est. Harvest', alert_ready: 'Ready to Harvest', alert_moisture: 'Low Moisture',
    no_alerts: 'All crops healthy! ✨', no_crops: 'No crops yet',
    ar_no_plots: '⚠️ No plots recorded! Go to Setup first.', ar_plots_count: 'plots recorded with GPS',
    recorded: 'Plot recorded!', cleared: 'All data cleared.', exported: 'Data exported!',
    imported: 'Data imported!', planted: 'Crop planted!', removed: 'Crop removed.', sensors_saved: 'Sensor data saved!',
    walk_count: 'plots recorded so far', gps_good: 'GPS Good', gps_mid: 'GPS Weak', gps_bad: 'No GPS',
    real_gps_badge: 'Real GPS', simulated_badge: 'Simulated',
    enter_plot_id: 'Enter a plot ID first!', gps_not_ready: 'GPS not ready. Move to open area.',
    notes_placeholder: 'Field notes...', farm_name_placeholder: 'My Farm', plot_id_placeholder: 'e.g. A1 or Row1-Col1',
    confirm_clear: 'Clear ALL plots and crops? This cannot be undone.',
    demo_mode: 'Demo Mode', ar_live: 'AR LIVE', exit_ar: '← Exit AR', back: '← Back',
    no_crops_ar: 'No crops planted yet — Go to Field Map to add crops',
  },
  hi: {
    appTitle: 'स्मार्ट फार्म AR', appSub: 'संवर्धित वास्तविकता खेत प्रबंधन',
    nav_home: 'होम', nav_map: 'खेत नक्शा', nav_setup: 'सेटअप', nav_ar: 'AR व्यू',
    ar_launch_title: 'AR कैमरा खोलें', ar_launch_sub: 'खेत में चलें — हर प्लॉट पर फसल डेटा देखें',
    alerts_title: '⚡ सूचनाएं', crop_breakdown: '🌾 फसलें',
    your_location: 'आपका स्थान', accuracy: 'सटीकता',
    record_plots: '📍 असली प्लॉट स्थान दर्ज करें',
    record_plots_desc: 'खेत में हर प्लॉट पर जाएं, बटन दबाएं और GPS स्थान सेव होगा।',
    walk_record: '🚶 चलकर प्लॉट दर्ज करें', clear_all: '🗑 सब हटाएं',
    saved_plots: '📋 सेव प्लॉट', no_plots: 'अभी कोई प्लॉट नहीं। ऊपर Walk & Record उपयोग करें।',
    field_config: '⚙️ खेत कॉन्फ़िगरेशन', rows: 'पंक्तियां', cols: 'स्तंभ', farm_name: 'खेत का नाम',
    data_mgmt: '💾 डेटा प्रबंधन', exportData: '📤 डेटा निर्यात', importData: '📥 डेटा आयात',
    data_note: 'सभी डेटा आपके डिवाइस पर स्थानीय रूप से सेव है।',
    map_hint: 'फसल देखने या जोड़ने के लिए प्लॉट पर टैप करें',
    status_ready: 'तैयार', status_maturing: 'पक रही है', status_growing: 'बढ़ रही है', status_seedling: 'अंकुर',
    plant_crop: '🌱 फसल लगाएं', select_crop: 'फसल चुनें', date_planted: 'बुआई तिथि',
    notes: 'नोट्स', plant: 'लगाएं', cancel: 'रद्द करें', done: 'हो गया',
    update_sensors: '📊 सेंसर डेटा अपडेट', moisture: 'मिट्टी की नमी (%)',
    health: 'पौधे का स्वास्थ्य (%)', temperature: 'तापमान (°C)', save: 'सेव करें',
    walk_title: '🚶 चलकर दर्ज करें', walk_desc: 'खेत में प्लॉट पर जाएं, फिर GPS दर्ज करने के लिए बटन दबाएं।',
    current_gps: 'वर्तमान GPS', plot_id: 'प्लॉट ID / नाम', crop: 'फसल',
    total_plots: 'कुल प्लॉट', harvest_ready: 'कटाई योग्य', active_crops: 'सक्रिय फसलें', empty_plots: 'खाली प्लॉट',
    days_left: 'दिन बचे', remove_crop: '🗑 फसल हटाएं', edit_sensors: '📊 सेंसर बदलें',
    harvest_date: 'अनुमानित कटाई', alert_ready: 'कटाई के लिए तैयार', alert_moisture: 'कम नमी',
    no_alerts: 'सभी फसलें स्वस्थ! ✨', no_crops: 'अभी कोई फसल नहीं',
    ar_no_plots: '⚠️ कोई प्लॉट दर्ज नहीं! पहले सेटअप करें।', ar_plots_count: 'प्लॉट GPS के साथ दर्ज हैं',
    recorded: 'प्लॉट दर्ज!', cleared: 'सभी डेटा हटाया।', exported: 'डेटा निर्यात!',
    imported: 'डेटा आयात!', planted: 'फसल लगाई!', removed: 'फसल हटाई।', sensors_saved: 'सेंसर डेटा सेव!',
    walk_count: 'प्लॉट अब तक दर्ज', gps_good: 'GPS अच्छा', gps_mid: 'GPS कमजोर', gps_bad: 'GPS नहीं',
    real_gps_badge: 'असली GPS', simulated_badge: 'अनुमानित',
    enter_plot_id: 'पहले प्लॉट ID डालें!', gps_not_ready: 'GPS तैयार नहीं। खुले में जाएं।',
    notes_placeholder: 'खेत नोट्स...', farm_name_placeholder: 'मेरा खेत', plot_id_placeholder: 'जैसे A1',
    confirm_clear: 'सभी प्लॉट और फसलें हटाएं?',
    demo_mode: 'डेमो मोड', ar_live: 'AR लाइव', exit_ar: '← AR छोड़ें', back: '← वापस',
    no_crops_ar: 'अभी कोई फसल नहीं — फील्ड मैप में जाएं',
  },
  mr: {
    appTitle: 'स्मार्ट शेत AR', appSub: 'संवर्धित वास्तव शेत व्यवस्थापन',
    nav_home: 'मुख्यपृष्ठ', nav_map: 'शेत नकाशा', nav_setup: 'सेटअप', nav_ar: 'AR दृश्य',
    ar_launch_title: 'AR कॅमेरा उघडा', ar_launch_sub: 'शेतात चाला — प्रत्येक प्लॉटवर पिकाचा डेटा पाहा',
    alerts_title: '⚡ सूचना', crop_breakdown: '🌾 पिके',
    your_location: 'तुमचे स्थान', accuracy: 'अचूकता',
    record_plots: '📍 खरे प्लॉट स्थान नोंदवा',
    record_plots_desc: 'शेतातील प्रत्येक प्लॉटवर जा, बटण दाबा आणि GPS स्थान सेव होईल.',
    walk_record: '🚶 चालत प्लॉट नोंदवा', clear_all: '🗑 सर्व साफ करा',
    saved_plots: '📋 सेव केलेले प्लॉट', no_plots: 'अजून कोणताही प्लॉट नाही.',
    field_config: '⚙️ शेत कॉन्फिगरेशन', rows: 'ओळी', cols: 'स्तंभ', farm_name: 'शेताचे नाव',
    data_mgmt: '💾 डेटा व्यवस्थापन', exportData: '📤 डेटा एक्सपोर्ट', importData: '📥 डेटा इम्पोर्ट',
    data_note: 'सर्व डेटा तुमच्या डिव्हाइसवर स्थानिकरित्या सेव आहे.',
    map_hint: 'पीक पाहण्यासाठी किंवा जोडण्यासाठी प्लॉटवर टॅप करा',
    status_ready: 'तयार', status_maturing: 'पिकत आहे', status_growing: 'वाढत आहे', status_seedling: 'रोप',
    plant_crop: '🌱 पीक लावा', select_crop: 'पीक निवडा', date_planted: 'पेरणी तारीख',
    notes: 'नोंदी', plant: 'लावा', cancel: 'रद्द करा', done: 'झाले',
    update_sensors: '📊 सेन्सर डेटा अपडेट', moisture: 'माती ओलावा (%)',
    health: 'वनस्पती आरोग्य (%)', temperature: 'तापमान (°C)', save: 'सेव करा',
    walk_title: '🚶 चालत नोंदवण्याची पद्धत', walk_desc: 'शेतातील प्लॉटवर जा, नंतर GPS नोंदवण्यासाठी बटण दाबा.',
    current_gps: 'सध्याचे GPS', plot_id: 'प्लॉट ID / नाव', crop: 'पीक',
    total_plots: 'एकूण प्लॉट', harvest_ready: 'कापणीसाठी तयार', active_crops: 'सक्रिय पिके', empty_plots: 'रिकामे प्लॉट',
    days_left: 'दिवस शिल्लक', remove_crop: '🗑 पीक काढा', edit_sensors: '📊 सेन्सर बदला',
    harvest_date: 'अंदाजे कापणी', alert_ready: 'कापणीसाठी तयार', alert_moisture: 'कमी ओलावा',
    no_alerts: 'सर्व पिके निरोगी! ✨', no_crops: 'अजून कोणतेही पीक नाही',
    ar_no_plots: '⚠️ कोणताही प्लॉट नाही! आधी सेटअप करा.', ar_plots_count: 'प्लॉट GPS सह नोंदवले',
    recorded: 'प्लॉट नोंदवला!', cleared: 'सर्व डेटा साफ.', exported: 'डेटा एक्सपोर्ट!',
    imported: 'डेटा इम्पोर्ट!', planted: 'पीक लावले!', removed: 'पीक काढले.', sensors_saved: 'सेन्सर डेटा सेव!',
    walk_count: 'प्लॉट आतापर्यंत नोंदवले', gps_good: 'GPS चांगला', gps_mid: 'GPS कमकुवत', gps_bad: 'GPS नाही',
    real_gps_badge: 'खरे GPS', simulated_badge: 'अनुमानित',
    enter_plot_id: 'आधी प्लॉट ID टाका!', gps_not_ready: 'GPS तयार नाही. मोकळ्या जागी जा.',
    notes_placeholder: 'शेत नोंदी...', farm_name_placeholder: 'माझे शेत', plot_id_placeholder: 'उदा. A1',
    confirm_clear: 'सर्व प्लॉट आणि पिके काढायची?',
    demo_mode: 'डेमो मोड', ar_live: 'AR लाइव्ह', exit_ar: '← AR सोडा', back: '← मागे',
    no_crops_ar: 'अजून पीक नाही — शेत नकाशात जा',
  },
}

export const CROP_TYPES = {
  wheat:   { name: { en: 'Wheat',   hi: 'गेहूं',    mr: 'गहू'     }, emoji: '🌾', color: '#F5C842', days: 120 },
  rice:    { name: { en: 'Rice',    hi: 'चावल',    mr: 'तांदूळ'  }, emoji: '🌿', color: '#7EC850', days: 90  },
  corn:    { name: { en: 'Corn',    hi: 'मक्का',    mr: 'मका'     }, emoji: '🌽', color: '#FF9F1C', days: 75  },
  tomato:  { name: { en: 'Tomato',  hi: 'टमाटर',   mr: 'टोमॅटो'  }, emoji: '🍅', color: '#E63946', days: 60  },
  potato:  { name: { en: 'Potato',  hi: 'आलू',     mr: 'बटाटा'   }, emoji: '🥔', color: '#A8906A', days: 80  },
  cotton:  { name: { en: 'Cotton',  hi: 'कपास',    mr: 'कापूस'   }, emoji: '☁️', color: '#F1FAEE', days: 150 },
  soybean: { name: { en: 'Soybean', hi: 'सोयाबीन', mr: 'सोयाबीन' }, emoji: '🫘', color: '#8BC34A', days: 100 },
  onion:   { name: { en: 'Onion',   hi: 'प्याज',   mr: 'कांदा'   }, emoji: '🧅', color: '#C77DFF', days: 110 },
}

export const cropName = (key, lang) => CROP_TYPES[key]?.name[lang] || CROP_TYPES[key]?.name.en || key
export const calcStatus = (p) => p < 0.3 ? 'seedling' : p < 0.7 ? 'growing' : p < 0.9 ? 'maturing' : 'ready'

const loadPlots  = () => { try { return JSON.parse(localStorage.getItem('sf_plots')  || '{}') } catch { return {} } }
const loadConfig = () => { try { return JSON.parse(localStorage.getItem('sf_config') || '{"rows":8,"cols":10,"name":"My Farm"}') } catch { return { rows:8, cols:10, name:'My Farm' } } }
const loadLang   = () => localStorage.getItem('sf_lang') || 'en'

export const useFarmStore = create((set, get) => ({
  plots:             loadPlots(),
  config:            loadConfig(),
  lang:              loadLang(),
  selectedPlot:      null,
  view:              'dashboard',
  filterCrop:        'all',
  walkMode:          false,
  gpsPosition:       { lat: 0, lng: 0, accuracy: 999, ok: false },
  deviceOrientation: { alpha: 0, beta: 0, gamma: 0 },
  cameraStream:      null,
  demoMode:          false,
  alerts:            [],

  t: (key) => { const l = get().lang; return TRANSLATIONS[l]?.[key] || TRANSLATIONS.en[key] || key },

  setLang: (lang) => { localStorage.setItem('sf_lang', lang); set({ lang }) },
  setView: (v) => set({ view: v }),
  setSelectedPlot: (id) => set({ selectedPlot: id }),
  setFilterCrop: (f) => set({ filterCrop: f }),
  setWalkMode: (v) => set({ walkMode: v }),
  setGpsPosition: (pos) => set({ gpsPosition: pos }),
  setDeviceOrientation: (o) => set({ deviceOrientation: o }),
  setCameraStream: (s) => set({ cameraStream: s }),
  setDemoMode: (v) => set({ demoMode: v }),

  recordPlot: (id, cropType, gpsPos) => {
    const now = new Date()
    const timestamp = now.toISOString()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    const gpsTag = gpsPos.ok ? `${gpsPos.lat.toFixed(5)}_${gpsPos.lng.toFixed(5)}` : 'no-gps'
    const plots = { ...get().plots, [id]: {
      id,
      cropType,
      realGPS: gpsPos.ok,
      lat: gpsPos.lat,
      lng: gpsPos.lng,
      accuracy: gpsPos.accuracy,
      plantedDate: dateStr,
      daysPlanted: 0,
      progress: 0,
      status: 'seedling',
      moisture: 65,
      health: 90,
      temperature: 28,
      notes: '',
      recordedAt: timestamp,
      // Proper GPS-enabled naming for saved data
      dataFileName: `plot_${id}_${cropType}_${dateStr}_${timeStr}_gps-${gpsTag}.json`,
      gpsLabel: gpsPos.ok ? `GPS ±${Math.round(gpsPos.accuracy)}m` : 'Simulated',
    } }
    set({ plots }); localStorage.setItem('sf_plots', JSON.stringify(plots)); debouncedSync(plots)
    // Also save full GPS record in a separate key for audit trail
    const gpsLog = JSON.parse(localStorage.getItem('sf_gps_log') || '[]')
    gpsLog.push({
      plotId: id, cropType, lat: gpsPos.lat, lng: gpsPos.lng,
      accuracy: gpsPos.accuracy, ok: gpsPos.ok,
      recordedAt: timestamp,
      fileName: `plot_${id}_${cropType}_${dateStr}_${timeStr}_gps-${gpsTag}.json`,
    })
    localStorage.setItem('sf_gps_log', JSON.stringify(gpsLog))
  },

  addCropToPlot: (id, cropType, plantedDate, notes) => {
    const existing = get().plots[id] || {}
    const crop = CROP_TYPES[cropType]
    const daysPlanted = Math.max(0, Math.floor((Date.now() - new Date(plantedDate).getTime()) / 86400000))
    const progress = Math.min(1, daysPlanted / crop.days)
    const plots = { ...get().plots, [id]: { ...existing, id, cropType, plantedDate, daysPlanted, progress, status:calcStatus(progress), notes:notes||'', moisture:existing.moisture||65, health:existing.health||90, temperature:existing.temperature||28, realGPS:existing.realGPS||false, lat:existing.lat||(18.5204+parseInt(id.split('-')[0]||0)*0.00009), lng:existing.lng||(73.8567+parseInt(id.split('-')[1]||0)*0.00009) } }
    set({ plots }); localStorage.setItem('sf_plots', JSON.stringify(plots)); debouncedSync(plots)
    get().addAlert(get().t('planted'), 'success')
  },

  updateSensors: (id, moisture, health, temperature) => {
    const plots = { ...get().plots, [id]: { ...get().plots[id], moisture, health, temperature } }
    set({ plots }); localStorage.setItem('sf_plots', JSON.stringify(plots)); debouncedSync(plots)
    get().addAlert(get().t('sensors_saved'), 'success')
  },

  removeCrop: (id) => {
    const p = get().plots[id]
    const plots = { ...get().plots, [id]: { id, lat:p?.lat, lng:p?.lng, realGPS:p?.realGPS, accuracy:p?.accuracy } }
    set({ plots, selectedPlot:null }); localStorage.setItem('sf_plots', JSON.stringify(plots)); debouncedSync(plots)
    get().addAlert(get().t('removed'), 'info')
  },

  deletePlot: (id) => {
    const plots = { ...get().plots }; delete plots[id]
    set({ plots }); localStorage.setItem('sf_plots', JSON.stringify(plots)); debouncedSync(plots)
  },

  clearAllPlots: () => {
    set({ plots:{}, selectedPlot:null }); localStorage.setItem('sf_plots', '{}')
    get().addAlert(get().t('cleared'), 'info')
  },

  updateConfig: (cfg) => {
    const config = { ...get().config, ...cfg }
    set({ config }); localStorage.setItem('sf_config', JSON.stringify(config))
  },

  exportData: () => {
    const { plots, config } = get()
    const blob = new Blob([JSON.stringify({ plots, config, exportedAt:new Date().toISOString(), version:'2.0' }, null, 2)], { type:'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `smartfarm-${config.name||'data'}-${new Date().toISOString().split('T')[0]}.json`; a.click()
    get().addAlert(get().t('exported'), 'success')
  },

  importData: (file) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.plots) { set({ plots:data.plots }); localStorage.setItem('sf_plots', JSON.stringify(data.plots)) }
        if (data.config) { set({ config:data.config }); localStorage.setItem('sf_config', JSON.stringify(data.config)) }
        get().addAlert(get().t('imported'), 'success')
      } catch { get().addAlert('Invalid file!', 'error') }
    }
    reader.readAsText(file)
  },

  // Generic partial update for a plot — used by AI crop identifier to assign identified crop
  updatePlot: (id, changes) => {
    const existing = get().plots[id]
    if (!existing) return
    const crop = changes.cropType ? CROP_TYPES[changes.cropType] : null
    const plantedDate = changes.plantedDate || existing.plantedDate || new Date().toISOString().split('T')[0]
    const daysPlanted = Math.max(0, Math.floor((Date.now() - new Date(plantedDate).getTime()) / 86400000))
    const progress = crop ? Math.min(1, daysPlanted / crop.days) : existing.progress
    const updated = {
      ...existing,
      ...changes,
      daysPlanted,
      progress: changes.progress !== undefined ? changes.progress : progress,
      status: changes.status || calcStatus(progress),
    }
    const plots = { ...get().plots, [id]: updated }
    set({ plots }); localStorage.setItem('sf_plots', JSON.stringify(plots)); debouncedSync(plots)
  },

  addAlert: (msg, type='info') => {
    const id = Date.now()
    set(s => ({ alerts: [...s.alerts, { id, msg, type }] }))
    setTimeout(() => set(s => ({ alerts: s.alerts.filter(a => a.id !== id) })), 3500)
  },
}))
