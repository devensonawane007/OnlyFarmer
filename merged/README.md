# Smart Farms + Farm Direct Exchange — Merged Project

## What's in here

This is a merge of two projects:

1. **Smart Farms with Disease Detection** — IoT monitoring, crop prediction, AR field view, plant disease detection (original smart-farms project, **unchanged frontend**)
2. **Farm Direct Exchange** — Exporter/Importer board with real GPS map and transporter discovery (merged from auto_suggestion, added as **Tab 5**)

---

## Improvements in this merge

### AR (Tab 4)
- **Real GPS**: Uses `watchPosition` with `enableHighAccuracy: true` for continuous, live GPS from the device's GPS chip
- **Photo capture**: 📸 button in AR view — saves a full-resolution photo from the rear camera
- **GPS-tagged filenames**: Photos are saved with GPS coordinates and timestamp in the filename, e.g. `smartfarm_2025-01-15_14-32-10_lat19.076012_lng72.877655_acc8m.jpg`
- **GPS overlay on photos**: Coordinates, accuracy, and timestamp are burned into the saved image
- **Capture log**: All AR photo captures are logged to localStorage (`sf_ar_captures`) with GPS, timestamp, and file size
- **Plot recording with GPS naming**: Plot data files now include GPS coordinates and timestamp in their identifiers (`dataFileName` field), so every plot record is traceable

### Farm Direct Exchange (Tab 5 — New)
- Exporter view: see all importer requests on a map, find nearby transporters
- Importer form: submit a crop order by address or live GPS location
- Live Leaflet map with color-coded markers (green=exporter, orange=orders, blue=transporters)
- All data stored in SQLite (`exchange.db`) on the backend
- 10 pre-seeded Indian transporters across major cities
- Backend routes at `/exchange/...`

---

## Setup

### Backend (Python)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and connects to the backend at `http://localhost:8000`.

---

## Tab Structure

| Tab | Name | Contents |
|-----|------|----------|
| 1 | Overview | Tip of day, IoT sensors, Disease detection |
| 2 | Smart Farming | Crop prediction, expenses, crop prices |
| 3 | Logistics | Fertilizer tracking, truck booking |
| 4 | AR Field | Live AR camera with GPS, field map, setup |
| 5 | Exchange | Farm Direct Exchange (exporter/importer board) |

---

## AR Photo Naming Convention

```
smartfarm_{date}_{time}_lat{latitude}_lng{longitude}_{accuracy}.jpg

Example:
smartfarm_2025-01-15_14-32-10_lat19.076012_lng72.877655_acc8m.jpg
```

When GPS is unavailable:
```
smartfarm_2025-01-15_14-32-10_lat_no-gps_lng_no-gps_simulated.jpg
```
