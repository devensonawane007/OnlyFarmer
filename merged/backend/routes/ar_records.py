"""
routes/ar_records.py — Persist AR captures, crop identifications,
GPS positions, and plot data to the unified SQLite DB.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import json
from db import db, rows_to_list, row_to_dict

router = APIRouter(prefix="/ar", tags=["AR Records"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ARCaptureIn(BaseModel):
    filename: str
    farm_name: Optional[str] = "My Farm"
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    gps_accuracy: Optional[float] = None
    gps_ok: bool = False
    plots_snapshot: Optional[dict] = None   # full plots object from frontend
    active_plot_count: int = 0
    seeding_plot_count: int = 0
    file_size_bytes: Optional[int] = None

class CropIDIn(BaseModel):
    identified_crop: Optional[str] = None
    raw_name: Optional[str] = None
    confidence: Optional[int] = None
    stage_name: Optional[str] = None
    stage_description: Optional[str] = None
    care_tips: Optional[List[str]] = []
    names: Optional[dict] = {}
    what_i_see: Optional[str] = None
    not_a_crop: bool = False
    assigned_to_plot: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None

class GPSLogIn(BaseModel):
    lat: float
    lng: float
    accuracy_m: Optional[float] = None
    altitude_m: Optional[float] = None
    speed_ms: Optional[float] = None
    ok: bool = True

class PlotSyncIn(BaseModel):
    id: str
    crop_type: Optional[str] = None
    planted_date: Optional[str] = None
    days_planted: int = 0
    progress: float = 0
    status: str = "empty"
    notes: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    accuracy_m: Optional[float] = None
    real_gps: bool = False
    moisture: float = 65
    health: float = 90
    temperature: float = 28
    recorded_at: Optional[str] = None

class ChatMsgIn(BaseModel):
    session_id: Optional[str] = "default"
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str
    lang: str = "en"


# ── AR Captures ───────────────────────────────────────────────────────────────

@router.post("/capture", summary="Save an AR seeding-record photo event")
def save_ar_capture(body: ARCaptureIn):
    with db() as conn:
        cur = conn.execute(
            """INSERT INTO ar_captures
               (filename,farm_name,gps_lat,gps_lng,gps_accuracy,gps_ok,
                plots_snapshot,active_plot_count,seeding_plot_count,file_size_bytes)
               VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING id""",
            (body.filename, body.farm_name,
             body.gps_lat, body.gps_lng, body.gps_accuracy, int(body.gps_ok),
             json.dumps(body.plots_snapshot) if body.plots_snapshot else None,
             body.active_plot_count, body.seeding_plot_count, body.file_size_bytes)
        )
        row_id = cur.fetchone()[0]
        row = conn.execute("SELECT * FROM ar_captures WHERE id=?", (row_id,)).fetchone()
    return {"ok": True, "capture": row_to_dict(row)}


@router.get("/captures", summary="List all AR photo events")
def list_ar_captures(limit: int = 50):
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM ar_captures ORDER BY captured_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return rows_to_list(rows)


# ── Crop Identifications ──────────────────────────────────────────────────────

@router.post("/identify", summary="Save an AI crop identification result")
def save_crop_id(body: CropIDIn):
    with db() as conn:
        cur = conn.execute(
            """INSERT INTO crop_identifications
               (identified_crop,raw_name,confidence,stage_name,stage_description,
                care_tips_json,names_json,what_i_see,not_a_crop,assigned_to_plot,
                gps_lat,gps_lng)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id""",
            (body.identified_crop, body.raw_name, body.confidence,
             body.stage_name, body.stage_description,
             json.dumps(body.care_tips), json.dumps(body.names),
             body.what_i_see, int(body.not_a_crop), body.assigned_to_plot,
             body.gps_lat, body.gps_lng)
        )
        row_id = cur.fetchone()[0]
        row = conn.execute("SELECT * FROM crop_identifications WHERE id=?", (row_id,)).fetchone()
    return {"ok": True, "identification": row_to_dict(row)}


@router.get("/identifications", summary="List AI crop ID history")
def list_crop_ids(limit: int = 50):
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM crop_identifications ORDER BY identified_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return rows_to_list(rows)


# ── GPS Log ───────────────────────────────────────────────────────────────────

@router.post("/gps", summary="Log a GPS position")
def log_gps(body: GPSLogIn):
    with db() as conn:
        conn.execute(
            "INSERT INTO gps_log (lat,lng,accuracy_m,altitude_m,speed_ms,ok) VALUES (?,?,?,?,?,?)",
            (body.lat, body.lng, body.accuracy_m, body.altitude_m, body.speed_ms, int(body.ok))
        )
    return {"ok": True}


@router.get("/gps/history", summary="Get recent GPS log")
def gps_history(limit: int = 200):
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM gps_log ORDER BY logged_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return rows_to_list(rows)


# ── Plot Sync ─────────────────────────────────────────────────────────────────

@router.post("/plots/sync", summary="Sync all plots from frontend to DB")
def sync_plots(plots: List[PlotSyncIn]):
    with db() as conn:
        for p in plots:
            exists = conn.execute("SELECT id FROM plots WHERE id=?", (p.id,)).fetchone()
            if exists:
                conn.execute(
                    """UPDATE plots SET crop_type=?,planted_date=?,days_planted=?,progress=?,
                       status=?,notes=?,lat=?,lng=?,accuracy_m=?,real_gps=?,
                       moisture=?,health=?,temperature=?,recorded_at=?,
                       updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now')
                       WHERE id=?""",
                    (p.crop_type, p.planted_date, p.days_planted, p.progress,
                     p.status, p.notes, p.lat, p.lng, p.accuracy_m, int(p.real_gps),
                     p.moisture, p.health, p.temperature, p.recorded_at, p.id)
                )
            else:
                conn.execute(
                    """INSERT INTO plots (id,crop_type,planted_date,days_planted,progress,
                       status,notes,lat,lng,accuracy_m,real_gps,moisture,health,temperature,recorded_at)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (p.id, p.crop_type, p.planted_date, p.days_planted, p.progress,
                     p.status, p.notes, p.lat, p.lng, p.accuracy_m, int(p.real_gps),
                     p.moisture, p.health, p.temperature, p.recorded_at)
                )
    return {"ok": True, "synced": len(plots)}


@router.get("/plots", summary="Get all plots from DB")
def get_plots():
    with db() as conn:
        rows = conn.execute("SELECT * FROM plots ORDER BY id").fetchall()
    return rows_to_list(rows)


# ── Chat History ──────────────────────────────────────────────────────────────

@router.post("/chat/save", summary="Persist a chat message")
def save_chat_msg(body: ChatMsgIn):
    with db() as conn:
        conn.execute(
            "INSERT INTO chat_history (session_id,role,content,lang) VALUES (?,?,?,?)",
            (body.session_id, body.role, body.content, body.lang)
        )
    return {"ok": True}


@router.get("/chat/history", summary="Get chat history for a session")
def get_chat_history(session_id: str = "default", limit: int = 100):
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM chat_history WHERE session_id=? ORDER BY sent_at ASC LIMIT ?",
            (session_id, limit)
        ).fetchall()
    return rows_to_list(rows)


# ── Stats dashboard ───────────────────────────────────────────────────────────

@router.get("/stats", summary="High-level DB statistics")
def get_stats():
    with db() as conn:
        def cnt(table, where="1=1"):
            return conn.execute(f"SELECT COUNT(*) FROM {table} WHERE {where}").fetchone()[0]
        return {
            "plots":               cnt("plots"),
            "plots_with_crop":     cnt("plots", "crop_type IS NOT NULL"),
            "ar_captures":         cnt("ar_captures"),
            "crop_identifications":cnt("crop_identifications"),
            "disease_scans":       cnt("disease_scans"),
            "gps_log_entries":     cnt("gps_log"),
            "chat_messages":       cnt("chat_history"),
            "exchange_orders":     cnt("exchange_orders"),
            "exchange_transporters":cnt("exchange_transporters"),
        }
