import { useState, useEffect, useRef } from "react";
import { RouterProvider } from 'react-router-dom';
import axios from "axios";
import API, {
  getAvailableTrucks,
  bookTruck,
  getAllCropPrices,
  getTipOfTheDay
} from "./api";
import "./App.css";

// Import existing components from src/components/
import ARView from "./components/ARView";
import AlertsToast from "./components/AlertsToast";
import FieldMap from "./components/FieldMap";
import ARDashboard from "./components/ARDashboard";
import SetupView from "./components/SetupView";
import FarmExchange from "./components/FarmExchange";
import DBDashboard from "./components/DBDashboard";

import { useFarmStore } from "./store/farmStore";
import { createRouter } from './router';



const FARM_CARDS = [
  { id: 1, title: "Soil Health", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop", content: "Monitor NPK levels, pH balance, and moisture content in real time. Healthy soil is the foundation of every great harvest. Our AI detects deficiencies before they affect your yield.", author: { name: "Dr. Ravi Kumar", role: "Soil Scientist", image: "https://i.pravatar.cc/48?img=12" } },
  { id: 2, title: "Crop Disease", image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop", content: "Upload a photo of your crop and our AI instantly identifies diseases, pests, and nutrient deficiencies. Get treatment recommendations within seconds before the problem spreads.", author: { name: "Priya Desai", role: "Agronomist", image: "https://i.pravatar.cc/48?img=5" } },
  { id: 3, title: "Weather Watch", image: "https://images.unsplash.com/photo-1504608524841-42584120d693?w=400&h=300&fit=crop", content: "Hyperlocal weather forecasts tailored to your exact farm location. Get rainfall predictions, frost alerts, and optimal sowing windows 7 days in advance.", author: { name: "Arjun Patil", role: "Meteorologist", image: "https://i.pravatar.cc/48?img=8" } },
  { id: 4, title: "Market Prices", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop", content: "Live MSP and mandi prices for 50+ crops updated daily. Compare local vs. national rates and decide the best time to sell for maximum profit.", author: { name: "Sunita Sharma", role: "Market Analyst", image: "https://i.pravatar.cc/48?img=9" } },
  { id: 5, title: "Smart Irrigation", image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop", content: "Automated irrigation scheduling based on soil moisture sensors and evapotranspiration data. Save up to 40% water while boosting crop yield by optimizing every drop.", author: { name: "Mohan Rao", role: "Irrigation Engineer", image: "https://i.pravatar.cc/48?img=11" } },
];

function ExpandableCards({ cards }) {
  const [selectedId, setSelectedId] = useState(null);
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollWidth, clientWidth } = scrollRef.current;
      scrollRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
    }
  }, []);
  const handleClick = (id) => {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    if (next !== null) {
      setTimeout(() => {
        const el = document.querySelector(`[data-card-id="${next}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }, 50);
    }
  };
  return (
    <div className="ec-wrapper" ref={scrollRef}>
      {cards.map((card) => {
        const isOpen = selectedId === card.id;
        return (
          <div key={card.id} data-card-id={card.id} className={`ec-card ${isOpen ? "ec-card--open" : ""}`} onClick={() => handleClick(card.id)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick(card.id)} aria-expanded={isOpen}>
            <div className="ec-image-panel">
              <img src={card.image} alt={card.title} className="ec-img" />
              <div className="ec-img-overlay" />
              <div className="ec-img-content">
                <h3 className="ec-title">{card.title}</h3>
                <div className="ec-play-row">
                  <button className="ec-play-btn" onClick={(e) => e.stopPropagation()} aria-label={`Play ${card.title}`}>▶</button>
                  <span className="ec-play-label">Learn more</span>
                </div>
              </div>
            </div>
            <div className={`ec-content-panel ${isOpen ? "ec-content-panel--visible" : ""}`}>
              <div className="ec-content-inner">
                <p className="ec-body">{card.content}</p>
                {card.author && (
                  <div className="ec-author">
                    <img src={card.author.image} alt={card.author.name} className="ec-author-img" />
                    <div>
                      <div className="ec-author-name">{card.author.name}</div>
                      <div className="ec-author-role">{card.author.role}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SensorBox({ label, value, unit = "", color = "#4ade80" }) {
  return (
    <div className="sensor-box" style={{ "--accent": color }}>
      <div className="sensor-label">{label}</div>
      <div className="sensor-value" style={{ color }}>{value ?? "--"}<span className="sensor-unit">{unit}</span></div>
      <div className="sensor-bar" style={{ background: color + "33" }}>
        <div className="sensor-bar-fill" style={{ background: color, width: `${Math.min(100, (value / 300) * 100)}%` }}></div>
      </div>
    </div>
  );
}

export default function App() {
  const [translations, setTranslations] = useState({
    en: {
      title: "Onlyfarmer Dashboard",
      subtitle: "IoT • Prediction • Logistics • AR",
      hero_title: "Future of Farming",
      hero_subtitle: "AI-Powered Smart Agriculture Platform",
      hero_cta: "Start Smart Farming",
      btn_iot: "📡 Fetch Live IoT",
      btn_upload: "Upload Photo",
      btn_predict: "Predict Crop",
      btn_save: "Save",
      btn_book: "Book",
      btn_ar: "🥽 Farm AR View",
      btn_demands: "📊 Demands Nearby",
      tab_1: "Dashboard",
      tab_2: "Farming",
      tab_3: "Logistics",
      tab_4: "AR Field",
      tab_5: "Exchange",
      card_tip: "🌱 Tip of the Day",
      card_problem: "📸 Report Problem",
      card_iot: "📡 IoT Sensor Readings",
      card_predict: "🌱 Crop Prediction",
      card_expenses: "📉 Expenses",
      card_prices: "💰 Crop Prices",
      card_fert: "🧪 Fertilizer Tracking",
      card_truck: "🚛 Truck Booking",
      label_seeds: "Seeds",
      label_fert: "Fertilizer",
      label_labor: "Labor",
      label_farm: "Farm ID",
      label_zone: "Zone ID",
      label_qty: "Qty (kg)",
      status_loading: "Loading...",
      status_no_data: "No Data",
      status_no_trucks: "No Trucks Available",
      alert_predict_first: "Please predict a crop before booking!",
      upload_success: "✅ Upload Successful!",
      upload_fail: "❌ Upload Failed",
    },
    hi: {
      title: "Onlyfarmer डैशबोर्ड",
      subtitle: "IoT • फसल सुझाव • परिवहन • AR",
      hero_title: "खेती का भविष्य",
      hero_subtitle: "AI-संचालित स्मार्ट कृषि मंच",
      hero_cta: "स्मार्ट खेती शुरू करें",
      btn_iot: "📡 लाइव डेटा लाएं",
      btn_upload: "फोटो अपलोड करें",
      btn_predict: "फसल सुझाव लें",
      btn_save: "सहेजें",
      btn_book: "बुक करें",
      btn_ar: "🥽 खेत AR दृश्य",
      btn_demands: "📊 नज़दीकी माँग",
      tab_1: "डैशबोर्ड",
      tab_2: "खेती",
      tab_3: "परिवहन",
      tab_4: "AR खेत",
      tab_5: "एक्सचेंज",
      card_tip: "🌱 आज का सुझाव",
      card_problem: "📸 समस्या रिपोर्ट करें",
      card_iot: "📡 सेंसर रीडिंग",
      card_predict: "🌱 फसल भविष्यवाणी",
      card_expenses: "📉 खर्चा ट्रैकर",
      card_prices: "💰 फसल के भाव",
      card_fert: "🧪 खाद ट्रैकिंग",
      card_truck: "🚛 ट्रक बुकिंग",
      label_seeds: "बीज",
      label_fert: "खाद",
      label_labor: "मजदूरी",
      label_farm: "खेत ID",
      label_zone: "क्षेत्र ID",
      label_qty: "मात्रा (kg)",
      status_loading: "लोड हो रहा है...",
      status_no_data: "कोई डेटा नहीं",
      status_no_trucks: "कोई ट्रक उपलब्ध नहीं",
      alert_predict_first: "कृपया बुकिंग से पहले फसल का चयन करें!",
      upload_success: "✅ अपलोड सफल!",
      upload_fail: "❌ अपलोड विफल",
    },
    mr: {
      title: "Onlyfarmer डॅशबोर्ड",
      subtitle: "IoT • पीक सल्ला • वाहतूक • AR",
      hero_title: "शेतीचे भविष्य",
      hero_subtitle: "AI-चालित स्मार्ट शेती व्यासपीठ",
      hero_cta: "स्मार्ट शेती सुरू करा",
      btn_iot: "📡 माहिती मिळवा",
      btn_upload: "फोटो जोडा",
      btn_predict: "पीक अंदाज घ्या",
      btn_save: "जतन करा",
      btn_book: "बुक करा",
      btn_ar: "🥽 शेत AR दृश्य",
      btn_demands: "📊 जवळील मागणी",
      tab_1: "डॅशबोर्ड",
      tab_2: "शेती",
      tab_3: "वाहतूक",
      tab_4: "AR शेत",
      tab_5: "एक्सचेंज",
      card_tip: "🌱 आजचा सल्ला",
      card_problem: "📸 पिकाची समस्या",
      card_iot: "📡 सेन्सर रीडिंग",
      card_predict: "🌱 पीक शिफारस",
      card_expenses: "📉 खर्च व्यवस्थापन",
      card_prices: "💰 बाजारभाव",
      card_fert: "🧪 खत व्यवस्थापन",
      card_truck: "🚛 ट्रक बुकिंग",
      label_seeds: "बियाणे",
      label_fert: "खात",
      label_labor: "मजुरी",
      label_farm: "शेत ID",
      label_zone: "विभाग ID",
      label_qty: "मात्रा (kg)",
      status_loading: "लोड होत आहे...",
      status_no_data: "माहिती उपलब्ध नाही",
      status_no_trucks: "ट्रक उपलब्ध नाहीत",
      alert_predict_first: "कृपया बुकिंग करण्यापूर्वी पिकाची निवड करा!",
      upload_success: "✅ अपलोड यशस्वी!",
      upload_fail: "❌ अपलोड अयशस्वी",
    }
  });
  const [lang, setLang] = useState("en");
  const t = translations[lang] || translations.en;

  // AR store integration
  const arView = useFarmStore(s => s.view);
  const setArView = useFarmStore(s => s.setView);
  const setArLang = useFarmStore(s => s.setLang);

  const cycleLanguage = () => {
    const next = lang === "en" ? "hi" : lang === "hi" ? "mr" : "en";
    setLang(next);
    setArLang(next); // keep AR store in sync
  };

  const getLangLabel = () => {
    if (lang === "en") return "🇮🇳 हिन्दी";
    if (lang === "hi") return "🚩 मराठी";
    return "🇺🇸 English";
  };

  const handleArClick = () => {
    setArView('ar');
  };

  // State
  const [iotData, setIotData] = useState(null);
  const [loadingIot, setLoadingIot] = useState(false);
  const [cropInput, setCropInput] = useState({ N: 90, P: 42, K: 43, temperature: 20, humidity: 80, ph: 6.5, rainfall: 200 });
  const [cropResult, setCropResult] = useState(null);
  const [loadingCrop, setLoadingCrop] = useState(false);
  const [fertInput, setFertInput] = useState({ farmId: "Farm-1", zoneId: "Zone-1", fertilizerName: "Urea", quantityKg: 50 });
  const [fertResult, setFertResult] = useState(null);
  const [loadingFert, setLoadingFert] = useState(false);
  const [trucks, setTrucks] = useState([]);
  const [loadingTrucks, setLoadingTrucks] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [cropPrices, setCropPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [seedsCost, setSeedsCost] = useState(0);
  const [fertilizerCost, setFertilizerCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [tip, setTip] = useState("");
  const [tipDate, setTipDate] = useState("");
  const [loadingTip, setLoadingTip] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadedProblems, setUploadedProblems] = useState([]);
  const [diseaseResult, setDiseaseResult] = useState(null);

  const getIotData = async () => {
    try {
      setLoadingIot(true);
      const res = await API.get("/simulate/farm/data");
      setIotData(res.data);
      if (res.data?.sensor_data) {
        const s = res.data.sensor_data;
        setCropInput({ N: s.N, P: s.P, K: s.K, temperature: s.temperature, humidity: s.humidity, ph: s.ph, rainfall: s.rainfall });
      }
      if (res.data?.crop_recommendation) {
        setCropResult({ input_source: "IoT Sensor Data", ...res.data.crop_recommendation });
      }
    } catch { alert("IoT Fetch Error"); } finally { setLoadingIot(false); }
  };

  const predictCrop = async () => {
    try {
      setLoadingCrop(true);
      const res = await API.post("/crop/predict", cropInput);
      setCropResult(res.data);
    } catch { alert("Crop Prediction Error"); } finally { setLoadingCrop(false); }
  };

  const saveFertilizer = async () => {
    try {
      setLoadingFert(true);
      const res = await API.post("/fertilizer/check-save", fertInput);
      setFertResult(res.data);
    } catch { alert("Fertilizer Save Error"); } finally { setLoadingFert(false); }
  };

  const loadTrucks = async () => {
    try {
      setLoadingTrucks(true);
      const res = await getAvailableTrucks();
      setTrucks(res.data);
    } catch { alert("Failed to load trucks"); } finally { setLoadingTrucks(false); }
  };

  const bookSelectedTruck = async (truckId) => {
    try {
      const cropToBook = cropResult?.recommended_crop;
      if (!cropToBook) { alert(t.alert_predict_first); return; }
      const res = await bookTruck({ truckId, farmId: "Farm-1", zoneId: "Zone-1", crop: cropToBook, expectedYieldTons: 8 });
      setBookingResult(res.data);
      loadTrucks();
    } catch { alert("Truck booking failed"); }
  };

  const loadCropPrices = async () => {
    try {
      setLoadingPrices(true);
      const res = await getAllCropPrices();
      setCropPrices(res.data);
    } catch { alert("Failed to load prices"); } finally { setLoadingPrices(false); }
  };

  const loadTip = async () => {
    try {
      const res = await getTipOfTheDay();
      setTip(res.data.tip);
      setTipDate(res.data.date);
    } catch { setTip("Unable to load tip"); } finally { setLoadingTip(false); }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setDiseaseResult(null);
    setUploadStatus("");
  };

  const handleUpload = async () => {
    if (!selectedFile) { alert("Please select a file first!"); return; }
    const formData = new FormData();
    formData.append("cropImage", selectedFile);
    try {
      setUploadStatus(t.status_loading);
      setDiseaseResult(null);
      const res = await axios.post("http://localhost:8000/problem/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStatus(t.upload_success);
      const problem = res.data.problem;
      setDiseaseResult(problem);
      setUploadedProblems(prev => [problem, ...prev]);
      setSelectedFile(null);
    } catch (err) {
      setUploadStatus(t.upload_fail);
      console.error(err);
    }
  };

  useEffect(() => { loadTrucks(); loadCropPrices(); loadTip(); }, []);

  const totalExpenses = seedsCost + fertilizerCost + laborCost;
  const sensor = iotData?.sensor_data;
  const top3 = cropResult?.top_3_recommendations || [];

  // Pass all state and handlers to the router
  const routerProps = {
    lang, t, cycleLanguage, getLangLabel, getIotData, loadingIot,
    iotData, sensor, cropInput, setCropInput, cropResult, loadingCrop, top3, predictCrop,
    fertInput, setFertInput, fertResult, loadingFert, saveFertilizer,
    trucks, loadingTrucks, bookSelectedTruck, bookingResult,
    cropPrices, loadingPrices, loadCropPrices,
    seedsCost, setSeedsCost, fertilizerCost, setFertilizerCost, laborCost, setLaborCost, totalExpenses,
    tip, tipDate, loadingTip,
    selectedFile, handleFileChange, handleUpload, uploadStatus, diseaseResult, uploadedProblems,
    ExpandableCards, SensorBox, FARM_CARDS,
    handleArClick, ARDashboard, FieldMap, SetupView, FarmExchange, AlertsToast
  };

  const router = createRouter(routerProps);

  // AR View full-screen handling
  if (arView === 'ar') {
    return (
      <div className="relative">
        <ARView />
        <AlertsToast />
        <button
          onClick={() => setArView('home')}
          className="fixed top-8 right-8 z-[100] bg-black/50 backdrop-blur-md text-white p-4 rounded-full border border-white/20 hover:bg-black/80 transition-all font-black"
        >
          ✖ CLOSE AR
        </button>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
