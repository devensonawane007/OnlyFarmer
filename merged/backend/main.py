from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.openapi.docs import get_swagger_ui_html
from pydantic import BaseModel
from datetime import datetime
import os, json
import numpy as np

# ── DB init (must happen before routers) ────────────────────────────────────
from db import init_db
init_db()

# ── Routers ──────────────────────────────────────────────────────────────────
from routes.price    import router as price_router
from routes.truck    import router as truck_router
from routes          import tips
from routes.disease  import router as disease_router
from routes.exchange import router as exchange_router
from routes.plotdb import router as plotdb_router
from routes.chatbot import router as chatbot_router
from routes.ar_records import router as ar_router
from routes.ivr import router as ivr_router

# Optional heavy deps — skip gracefully if missing
try:
    from firebase import rtdb
    _firebase_ok = True
except Exception:
    _firebase_ok = False
    rtdb = None

try:
    import joblib
    model = joblib.load("models/crop_model.pkl")
    le    = joblib.load("models/label_encoder.pkl")
    _model_ok = True
except Exception:
    _model_ok = False
    model = le = None

try:
    from services.fertilizer_db import FERTILIZER_DB
    from services.iot_simulator  import generate_sensor_data
    _services_ok = True
except Exception:
    _services_ok = False
    FERTILIZER_DB = {}
    generate_sensor_data = lambda: {}

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Onlyfarmer Core API", version="3.0", docs_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Include routers ───────────────────────────────────────────────────────────
app.include_router(price_router)
app.include_router(truck_router)
app.include_router(tips.router)
app.include_router(disease_router)
app.include_router(exchange_router)
app.include_router(plotdb_router)
app.include_router(chatbot_router)
app.include_router(ar_router)          # ← NEW: AR + DB records
app.include_router(ivr_router)

# ── Custom Swagger UI ─────────────────────────────────────────────────────────
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html(req: Request):
    html = get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )
    custom_css = """
    <style>
      /* Dark Cyan Theme */
      body { background-color: #111827; color: #f3f4f6; font-family: 'Inter', sans-serif; }
      .swagger-ui { filter: invert(88%) hue-rotate(180deg) brightness(1.2); }
      .swagger-ui .info .title { color: #2CB1E6 !important; }
      .swagger-ui .topbar { background-color: #002B5E !important; border-bottom: 2px solid #2CB1E6; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .topbar .wrapper .link {
         content: "Onlyfarmer API";
         color: #2CB1E6;
         font-weight: bold;
         font-size: 1.5em;
      }
      .swagger-ui .topbar .wrapper .link img { display: none; } /* Hide default logo */
    </style>
    """
    html.body = html.body.replace(b"</head>", custom_css.encode("utf-8") + b"</head>")
    return html

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health():
    return {
        "status": "ok",
        "version": "3.0",
        "db": "smartfarm.db",
        "ml_model": _model_ok,
        "firebase": _firebase_ok,
    }

# ── Crop Prediction (ML) ──────────────────────────────────────────────────────
class CropInput(BaseModel):
    N: float; P: float; K: float
    temperature: float; humidity: float; ph: float; rainfall: float

@app.post("/crop/predict", tags=["Crop ML"])
def predict_crop(data: CropInput):
    if not _model_ok:
        return {"error": "ML model not loaded"}
    X = np.array([[data.N, data.P, data.K, data.temperature,
                   data.humidity, data.ph, data.rainfall]], dtype=float)
    proba   = model.predict_proba(X)[0]
    top3idx = np.argsort(proba)[::-1][:3]
    top3    = [{"crop": le.inverse_transform([i])[0], "confidence": round(float(proba[i])*100, 2)} for i in top3idx]
    return {"input_source": "Manual", "recommended_crop": top3[0]["crop"], "top_3_recommendations": top3}

# ── IoT simulation ────────────────────────────────────────────────────────────
@app.get("/simulate/farm/data", tags=["IoT"])
def simulated_data():
    if not _services_ok:
        return {"error": "IoT simulator not available"}
    sensor = generate_sensor_data()
    return {"farmId": "FARM_001", "mode": "SIMULATION", "sensor_data": sensor}

# ── Fertilizer ────────────────────────────────────────────────────────────────
@app.get("/fertilizers", tags=["Fertilizer"])
def get_fertilizers():
    return FERTILIZER_DB

class FertilizerInput(BaseModel):
    farmId: str; zoneId: str; fertilizerName: str; quantityKg: float

@app.post("/fertilizer/check-save", tags=["Fertilizer"])
def fertilizer_check(data: FertilizerInput):
    if data.fertilizerName not in FERTILIZER_DB:
        return {"ok": False, "error": "Unknown fertilizer"}
    npk = FERTILIZER_DB[data.fertilizerName]
    entry = {
        "farmId": data.farmId, "zoneId": data.zoneId,
        "fertilizerName": data.fertilizerName, "quantityKg": float(data.quantityKg),
        "addedN": round(data.quantityKg*(npk["N"]/100),2),
        "addedP": round(data.quantityKg*(npk["P"]/100),2),
        "addedK": round(data.quantityKg*(npk["K"]/100),2),
        "timestamp": datetime.utcnow().isoformat()
    }
    if _firebase_ok and rtdb:
        try:
            rtdb.reference(f"fertilizer_logs/{data.farmId}/{data.zoneId}").push(entry)
        except Exception:
            pass
    return {"ok": True, "entry": entry}
