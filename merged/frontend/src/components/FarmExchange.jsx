/**
 * FarmExchange.jsx — Farm Direct Exchange
 * Merged from auto_suggestion project into Smart Farms Dashboard.
 * Keeps the original Farm Direct Exchange UI intact.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function Stat({ label, value }) {
  return (
    <div className="fde-stat">
      <div className="fde-stat-label">{label}</div>
      <div className="fde-stat-value">{value}</div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="fde-section-card">
      <header>
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Empty({ text }) {
  return <div className="fde-empty">{text}</div>;
}

function dotIcon(color) {
  return L.divIcon({
    className: "dot-icon",
    html: `<span style="display:block;width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px #222"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

export default function FarmExchange() {
  const [tab, setTab] = useState("exporter");
  const [status, setStatus] = useState("Choose Exporter or Shop Importer.");
  const [loading, setLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const [exporter, setExporter] = useState({
    crop: "",
    radius_km: 5000,
    lat: null,
    lon: null,
    nearby_transporters: [],
    importer_order_requests: [],
  });

  const [importer, setImporter] = useState({
    importer_name: "",
    importer_phone: "",
    address: "",
    crop: "onion",
    qty_kg: 500,
  });

  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const stats = useMemo(() => ({
    orders: exporter.importer_order_requests.length,
    transporters: exporter.nearby_transporters.length,
    topCrop:
      exporter.importer_order_requests[0]?.crop?.toUpperCase() ||
      (exporter.crop.trim() ? exporter.crop.toUpperCase() : "ALL"),
  }), [exporter]);

  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;
    const map = L.map(mapElementRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    map.on("click", (e) => {
      setSelectedPoint({ lat: e.latlng.lat, lon: e.latlng.lng });
      setStatus(`Selected map point: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}.`);
    });
    return () => { map.remove(); mapInstanceRef.current = null; markersLayerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (exporter.lat != null && exporter.lon != null) {
      L.marker([exporter.lat, exporter.lon], { icon: dotIcon("#1f7a4f") })
        .bindPopup("Exporter location").addTo(layer);
      map.setView([exporter.lat, exporter.lon], 10);
    }
    exporter.nearby_transporters.forEach((t) => {
      if (t.lat == null || t.lon == null) return;
      L.marker([t.lat, t.lon], { icon: dotIcon("#1769aa") })
        .bindPopup(`${t.name} | ${t.vehicle_type} | ${t.phone}`).addTo(layer);
    });
    exporter.importer_order_requests.forEach((r) => {
      L.marker([r.lat, r.lon], { icon: dotIcon("#ef6c00") })
        .bindPopup(`${r.importer_name} needs ${r.qty_kg}kg ${r.crop}`).addTo(layer);
    });
    if (selectedPoint) {
      L.marker([selectedPoint.lat, selectedPoint.lon], { icon: dotIcon("#7b1fa2") })
        .bindPopup("Selected map point").addTo(layer);
    }
  }, [exporter, selectedPoint]);

  async function withLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error("Geolocation not supported")); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  async function loadExporterView(lat, lon) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(lat), lon: String(lon),
        radius_km: String(exporter.radius_km),
        all_orders: "true",
      });
      if (exporter.crop.trim()) params.set("crop", exporter.crop.trim());
      const data = await api(`/exchange/exporter/nearby-view?${params.toString()}`);
      setExporter((prev) => ({
        ...prev, lat, lon,
        nearby_transporters: data.nearby_transporters || [],
        importer_order_requests: data.importer_order_requests || [],
      }));
      setStatus(`Loaded exporter view for (${lat.toFixed(4)}, ${lon.toFixed(4)}).`);
    } catch (err) {
      setStatus(`Exporter view failed: ${err.message}`);
    } finally { setLoading(false); }
  }

  async function handleExporterCurrentLocation() {
    setLoading(true);
    try {
      const loc = await withLocation();
      await loadExporterView(loc.lat, loc.lon);
    } catch {
      setStatus("Location permission denied or unavailable.");
      setLoading(false);
    }
  }

  async function geocodeAddress(address) {
    return api("/exchange/geo/geocode", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  }

  async function submitImporterOrder({ lat, lon }) {
    const payload = { ...importer, qty_kg: Number(importer.qty_kg), lat, lon };
    if (!payload.importer_name || !payload.importer_phone || !payload.address || !payload.crop || !payload.qty_kg) {
      setStatus("Importer form incomplete: name, phone, address, crop, quantity required.");
      return;
    }
    setLoading(true);
    try {
      const row = await api("/exchange/importer/order-request", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStatus(`Order submitted: ${row.qty_kg} kg ${row.crop}. Switching to Exporter.`);
      setTab("exporter");
      await loadExporterView(lat, lon);
    } catch (err) {
      setStatus(`Submission failed: ${err.message}`);
    } finally { setLoading(false); }
  }

  async function handleImporterByAddress() {
    if (!importer.address.trim()) { setStatus("Address is required."); return; }
    setLoading(true);
    try {
      const geo = await geocodeAddress(importer.address);
      await submitImporterOrder({ lat: Number(geo.lat), lon: Number(geo.lon) });
    } catch (err) { setLoading(false); setStatus(`Address lookup failed: ${err.message}`); }
  }

  async function handleImporterByCurrentLocation() {
    if (!importer.address.trim()) { setStatus("Address is required."); return; }
    setLoading(true);
    try {
      const loc = await withLocation();
      await submitImporterOrder({ lat: loc.lat, lon: loc.lon });
    } catch { setLoading(false); setStatus("Location permission denied or unavailable."); }
  }

  return (
    <div className="fde-shell">
      <style>{`
        .fde-shell { font-family: 'Outfit', system-ui, sans-serif; }
        .fde-hero {
          background: linear-gradient(130deg, #1f7a4f, #2d9965 55%, #43b07b);
          color: #f2fff7; border-radius: 16px; padding: 20px;
          box-shadow: 0 14px 38px rgba(24,55,38,0.2); margin-bottom: 16px;
        }
        .fde-hero h2 { font-family: 'Sora', sans-serif; margin: 0 0 6px; font-size: 22px; }
        .fde-hero p { margin: 0 0 12px; color: rgba(242,255,247,0.85); font-size: 13px; }
        .fde-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .fde-stat { border: 1px solid rgba(255,255,255,0.22); border-radius: 12px; padding: 10px; background: rgba(255,255,255,0.08); }
        .fde-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(232,255,242,0.8); }
        .fde-stat-value { margin-top: 4px; font-size: 20px; font-weight: 700; }
        .fde-workspace { display: grid; grid-template-columns: minmax(280px, 0.9fr) minmax(340px, 1.2fr); gap: 14px; }
        @media (max-width: 900px) { .fde-workspace { grid-template-columns: 1fr; } }
        .fde-left-pane, .fde-right-pane { display: flex; flex-direction: column; gap: 12px; }
        .fde-tabs { display: flex; gap: 8px; }
        .fde-tab { border: 1px solid #ddd8c9; background: #fff; border-radius: 999px; color: #2d3e33; font-size: 12px; font-weight: 700; padding: 8px 14px; cursor: pointer; }
        .fde-tab.active { background: #1f7a4f; color: #fff; border-color: #1f7a4f; }
        .fde-section-card { background: #fffdf8; border: 1px solid #ddd8c9; border-radius: 14px; padding: 14px; box-shadow: 0 8px 20px rgba(34,31,23,0.06); }
        .fde-section-card h3 { margin: 0; font-family: 'Sora', sans-serif; font-size: 15px; color: #18231c; }
        .fde-section-card p { margin: 5px 0 0; color: #586459; font-size: 12px; }
        .fde-form-grid { margin-top: 10px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .fde-span-2 { grid-column: span 2; }
        .fde-form-grid input, .fde-form-grid select { border: 1px solid #ddd8c9; background: #fff; border-radius: 9px; padding: 9px 10px; font: inherit; width: 100%; }
        .fde-form-grid button { border: none; color: #fff; font-weight: 700; background: linear-gradient(120deg, #e06b27, #f08e57); cursor: pointer; border-radius: 9px; padding: 9px 10px; font: inherit; }
        .fde-form-grid button:disabled { opacity: 0.6; cursor: not-allowed; }
        .fde-coords, .fde-status { margin-top: 10px; border: 1px dashed #cfdbcf; border-radius: 9px; padding: 9px; color: #34503c; background: #fbfff9; font-size: 12px; }
        .fde-map-canvas { width: 100%; height: 300px; border-radius: 11px; overflow: hidden; border: 1px solid #d8d3c2; }
        .fde-cards { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .fde-card { border: 1px solid #ece4d3; border-radius: 11px; padding: 10px; background: linear-gradient(180deg,#fffefb,#fff8ee); }
        .fde-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .fde-pill { border-radius: 999px; padding: 3px 8px; font-size: 11px; background: #e4f4e8; color: #2b5a3d; }
        .fde-meta { margin-top: 3px; color: #586459; font-size: 12px; }
        .fde-empty { margin-top: 8px; color: #748073; font-size: 13px; }
      `}</style>

      {/* Hero */}
      <div className="fde-hero">
        <h2>🌾 Farm Direct Exchange</h2>
        <p>Modern exporter/importer board for crop requests and transporter discovery.</p>
        <div className="fde-stats-grid">
          <Stat label="Open Orders" value={stats.orders} />
          <Stat label="Transporters" value={stats.transporters} />
          <Stat label="Active Crop" value={stats.topCrop} />
        </div>
      </div>

      <div className="fde-workspace">
        <div className="fde-left-pane">
          <div className="fde-tabs">
            <button className={tab === "exporter" ? "fde-tab active" : "fde-tab"} onClick={() => setTab("exporter")}>
              Exporter View
            </button>
            <button className={tab === "importer" ? "fde-tab active" : "fde-tab"} onClick={() => setTab("importer")}>
              Shop Importer
            </button>
          </div>

          {tab === "exporter" ? (
            <SectionCard title="Exporter Control" subtitle="See importer orders + transport options across India.">
              <div className="fde-form-grid">
                <input
                  value={exporter.crop}
                  onChange={(e) => setExporter((p) => ({ ...p, crop: e.target.value }))}
                  placeholder="Filter crop (optional)"
                />
                <button onClick={handleExporterCurrentLocation} disabled={loading}>
                  {loading ? "Loading..." : "📍 Use My Location"}
                </button>
                <button
                  onClick={() => {
                    if (!selectedPoint) { setStatus("Click on the map first to choose a location."); return; }
                    loadExporterView(selectedPoint.lat, selectedPoint.lon);
                  }}
                  disabled={loading}
                >
                  Use Map Point
                </button>
                <button
                  onClick={() => {
                    if (exporter.lat == null) { setStatus("No active location yet. Use My Location first."); return; }
                    loadExporterView(exporter.lat, exporter.lon);
                  }}
                  disabled={loading}
                >
                  Refresh View
                </button>
              </div>
              <div className="fde-coords">
                Active Coords: {exporter.lat != null ? `${exporter.lat.toFixed(5)}, ${exporter.lon.toFixed(5)}` : "not set"}
              </div>
              <div className="fde-coords">
                Map Point: {selectedPoint ? `${selectedPoint.lat.toFixed(5)}, ${selectedPoint.lon.toFixed(5)}` : "none"}
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="Importer Order Request" subtitle="Create a request that exporters can see immediately.">
              <div className="fde-form-grid">
                <input value={importer.importer_name} onChange={(e) => setImporter((p) => ({ ...p, importer_name: e.target.value }))} placeholder="Shop owner name" />
                <input value={importer.importer_phone} onChange={(e) => setImporter((p) => ({ ...p, importer_phone: e.target.value }))} placeholder="Phone number" />
                <input value={importer.crop} onChange={(e) => setImporter((p) => ({ ...p, crop: e.target.value }))} placeholder="Crop needed" />
                <input type="number" min={1} value={importer.qty_kg} onChange={(e) => setImporter((p) => ({ ...p, qty_kg: Number(e.target.value) }))} placeholder="Required kg" />
                <input className="fde-span-2" value={importer.address} onChange={(e) => setImporter((p) => ({ ...p, address: e.target.value }))} placeholder="Shop address (required)" />
                <button onClick={handleImporterByAddress} disabled={loading}>{loading ? "Submitting..." : "Submit Using Address"}</button>
                <button onClick={handleImporterByCurrentLocation} disabled={loading}>{loading ? "Submitting..." : "📍 Use My Location"}</button>
              </div>
            </SectionCard>
          )}

          <div className="fde-status">{status}</div>
        </div>

        <div className="fde-right-pane">
          <SectionCard title="Live Map" subtitle="Green: exporter · Orange: orders · Blue: transporters · Purple: selected">
            <div ref={mapElementRef} className="fde-map-canvas" />
          </SectionCard>

          <SectionCard title="Importer Order Requests">
            {exporter.importer_order_requests.length === 0 ? (
              <Empty text="No importer requests loaded yet." />
            ) : (
              <div className="fde-cards">
                {exporter.importer_order_requests.map((req) => (
                  <article className="fde-card" key={req.id}>
                    <div className="fde-row">
                      <strong>{req.importer_name}</strong>
                      <span className="fde-pill">{req.qty_kg} kg {req.crop}</span>
                    </div>
                    <div className="fde-meta">{req.importer_phone}</div>
                    <div className="fde-meta">{req.address}</div>
                    <div className="fde-meta">{req.distance_km ?? "-"} km from exporter</div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Transport Services (All India)">
            {exporter.nearby_transporters.length === 0 ? (
              <Empty text="No transporter records available." />
            ) : (
              <div className="fde-cards">
                {exporter.nearby_transporters.map((t) => (
                  <article className="fde-card" key={t.id}>
                    <div className="fde-row">
                      <strong>{t.name}</strong>
                      <span className="fde-pill">{t.distance_km ?? "-"} km</span>
                    </div>
                    <div className="fde-meta">{t.vehicle_type} | Capacity {t.capacity_kg} kg</div>
                    <div className="fde-meta">{t.phone}</div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
