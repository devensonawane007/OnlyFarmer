# 🌿 OnlyFarmer: The Next-Gen Agriculture Ecosystem

> **Bridging the gap between traditional farming and modern precision technology.**

OnlyFarmer is a comprehensive SaaS platform designed to empower farmers with AI-driven diagnostics, IoT real-time monitoring, and a direct-to-market exchange system. By integrating Augmented Reality (AR) with high-accuracy GPS and state-of-the-art computer vision, we provide farmers with the tools they need to increase yield, reduce waste, and connect directly with global exporters.

---

## 🚀 The Problem & The Solution

### The Problem
Traditional farming faces several critical bottlenecks:
- **Delayed Diagnosis**: Crop diseases often go unnoticed until it's too late, leading to significant yield loss.
- **Data Blindness**: Lack of real-time soil and environmental data makes crop selection a guessing game.
- **Fragmented Logistics**: Connecting with reliable transporters and exporters is manual and inefficient.
- **Field Management Challenges**: Tracking large plots accurately without professional surveying equipment is difficult.

### The Solution: OnlyFarmer
OnlyFarmer provides a unified "command center" for the modern farm:
- **Instant AI Vision**: Real-time plant disease detection via smartphone camera.
- **Precision IoT Data**: Live sensor data and ML-based crop prediction engines.
- **Geospatial AR**: GPS-tagged field management and coordinate-stamped photo logs.
- **Direct Exchange**: A map-based marketplace connecting Importers, Exporters, and Transporters directly.

---

## 🛠️ Core Features

### 1. 🧠 AI Plant Disease Detection
Upload or capture photos of your crops. Our backend AI analyzes the image to identify potential diseases and provides immediate recommendations.
- **Tech**: FastAPI + Pillow + scikit-learn.
- **Route**: `POST /problem/upload`

### 2. 🛰️ Geospatial AR Field (Tab 4)
Walk your field with a live AR overlay. Capture high-accuracy GPS-tagged photos with metadata burned into the image.
- **GPS Precision**: Uses `watchPosition` with high accuracy.
- **Logging**: Automatically saves filenames with coordinates and timestamps for audit trails.

### 3. 🗺️ Farm Direct Exchange (Tab 5)
A decentralized marketplace for the agricultural supply chain.
- **Exporter View**: Find nearby importer orders on a live Leaflet map.
- **Transporter Discovery**: Search across pre-seeded professional transporters in major regions.
- **Real-time Map**: Color-coded markers for dynamic supply-chain visibility.

### 4. 📈 Smart Logistics & IoT
- **Truck Booking**: Integrated logistics module for freight management.
- **IoT Simulation**: Real-time sensor dashboard for soil moisture, humidity, and temperature.
- **Crop Prediction**: ML model that suggests the most profitable crop based on your specific environmental data.

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, TailwindCSS, Framer Motion, Leaflet, Three.js |
| **Backend** | Python (FastAPI), Uvicorn, Node.js (Express) |
| **Database** | SQLite3, Firebase Admin SDK |
| **AI/ML** | Scikit-learn, Joblib, Pillow |
| **Integrations** | Gemini AI (Assistant), Twilio (IVR), Leaflet GPS |

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- A Google Gemini API Key (for the Assistant)

### 1. Backend Setup
```bash
cd merged/backend
# Install dependencies
pip install -r requirements.txt
# Start the server
uvicorn main:app --reload --port 8000
```
> [!NOTE]
> Ensure your `.env` file in the backend folder contains your Twilio and Google API credentials.

### 2. Frontend Setup
```bash
cd merged/frontend
# Install dependencies
npm install
# Launch development server
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## 📖 Module Guide

| Tab | Module | Purpose |
|---|---|---|
| **01** | **Overview** | Daily agricultural tips, IoT status, and quick AI disease detection. |
| **02** | **Smart Farming** | Crop prediction engines, expense tracking, and live market prices. |
| **03** | **Logistics** | Fertilizer inventory management and truck booking system. |
| **04** | **AR Field** | Professional field surveying with GPS photo capture and plot recording. |
| **05** | **Exchange** | Direct Export/Import marketplace with interactive map discovery. |

---

## 📋 Folder Structure
```text
merged/
├── backend/           # FastAPI/Python server & ML models
├── frontend/          # React/Vite/Tailwind source code
├── docs/              # Additional documentation
└── package.json       # Workspace dependencies
```

---

## 🤝 Contribution
Contributions are welcome! Please ensure you update tests and documentation before submitting a PR.

## 📄 License
This project is licensed under the ISC License.
