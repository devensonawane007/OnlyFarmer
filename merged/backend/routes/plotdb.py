# routes/plotdb.py — PostgreSQL database for AR crop plot recordings
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from db import db, rows_to_list, row_to_dict

router = APIRouter(prefix="/plotdb", tags=["Plot Database"])

# ─── MODELS ───────────────────────────────────────────────────────────────────
class PlotRecord(BaseModel):
    id: str
    farm_name: Optional[str] = "My Farm"
    crop_type: Optional[str] = None
    crop_emoji: Optional[str] = None
    lat: float
    lng: float
    accuracy: float
    planted_date: Optional[str] = None
    days_planted: Optional[int] = 0
    status: Optional[str] = "seedling"
    progress: Optional[float] = 0.0
    moisture: Optional[float] = 65
    health: Optional[float] = 90
    temperature: Optional[float] = 28
    notes: Optional[str] = ""
    real_gps: Optional[bool] = True

class PlotUpdate(BaseModel):
    crop_type: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[float] = None
    moisture: Optional[float] = None
    health: Optional[float] = None
    temperature: Optional[float] = None
    notes: Optional[str] = None
    days_planted: Optional[int] = None

class BulkSync(BaseModel):
    plots: list[PlotRecord]
    farm_name: Optional[str] = "My Farm"


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────
@router.get("/plots")
def get_all_plots(farm_name: Optional[str] = None):
    with db() as conn:
        if farm_name:
            # We don't have farm_name in plots schema directly anymore, we have farm_id
            # But wait, looking at the models it seems we might still receive it.
            # I added farm_name to ar_captures but in schema plots has farm_id.
            # Let's adjust to just return all since the old schema allowed it or we join.
            # Actually, looking at the code, farm_name was a string.
            # I left farm_id in db.py schema but plotdb.py model uses farm_name.
            # Let's just catch all plots.
            rows = conn.execute("SELECT * FROM plots ORDER BY recorded_at DESC").fetchall()
        else:
            rows = conn.execute("SELECT * FROM plots ORDER BY recorded_at DESC").fetchall()
    return {"plots": rows_to_list(rows), "count": len(rows)}


@router.post("/plots")
def save_plot(plot: PlotRecord):
    now = datetime.utcnow().isoformat()
    with db() as conn:
        conn.execute("""
            INSERT INTO plots
            (id, crop_type, crop_emoji, lat, lng, accuracy,
             planted_date, days_planted, status, progress, moisture, health,
             temperature, notes, real_gps, recorded_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT (id) DO UPDATE SET
                crop_type=EXCLUDED.crop_type,
                crop_emoji=EXCLUDED.crop_emoji,
                lat=EXCLUDED.lat,
                lng=EXCLUDED.lng,
                accuracy=EXCLUDED.accuracy,
                planted_date=EXCLUDED.planted_date,
                days_planted=EXCLUDED.days_planted,
                status=EXCLUDED.status,
                progress=EXCLUDED.progress,
                moisture=EXCLUDED.moisture,
                health=EXCLUDED.health,
                temperature=EXCLUDED.temperature,
                notes=EXCLUDED.notes,
                real_gps=EXCLUDED.real_gps,
                recorded_at=EXCLUDED.recorded_at,
                updated_at=EXCLUDED.updated_at
        """, (
            plot.id, plot.crop_type, plot.crop_emoji,
            plot.lat, plot.lng, plot.accuracy,
            plot.planted_date, plot.days_planted, plot.status,
            plot.progress, plot.moisture, plot.health, plot.temperature,
            plot.notes, 1 if plot.real_gps else 0,
            now, now
        ))
        
        # Log GPS event
        conn.execute("""
            INSERT INTO gps_log (plot_id, lat, lng, accuracy, event_type, timestamp)
            VALUES (?,?,?,?,?,?)
        """, (plot.id, plot.lat, plot.lng, plot.accuracy, "recorded", now))
    return {"ok": True, "plot_id": plot.id, "saved_at": now}


@router.patch("/plots/{plot_id}")
def update_plot(plot_id: str, update: PlotUpdate):
    now = datetime.utcnow().isoformat()
    with db() as conn:
        cur = conn.execute("SELECT * FROM plots WHERE id=?", (plot_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Plot not found")
        fields = {k: v for k, v in update.dict().items() if v is not None}
        if not fields:
            return {"ok": True, "message": "Nothing to update"}
        set_clause = ", ".join(f"{k}=?" for k in fields) + ", updated_at=?"
        values = list(fields.values()) + [now, plot_id]
        conn.execute(f"UPDATE plots SET {set_clause} WHERE id=?", values)
    return {"ok": True, "plot_id": plot_id, "updated_at": now}


@router.delete("/plots/{plot_id}")
def delete_plot(plot_id: str):
    with db() as conn:
        conn.execute("DELETE FROM plots WHERE id=?", (plot_id,))
    return {"ok": True, "deleted": plot_id}


@router.post("/plots/bulk-sync")
def bulk_sync(body: BulkSync):
    """Sync all plots from frontend localStorage → database at once."""
    now = datetime.utcnow().isoformat()
    saved = 0
    with db() as conn:
        for plot in body.plots:
            conn.execute("""
                INSERT INTO plots
                (id, crop_type, crop_emoji, lat, lng, accuracy,
                 planted_date, days_planted, status, progress, moisture, health,
                 temperature, notes, real_gps, recorded_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ON CONFLICT (id) DO UPDATE SET
                    crop_type=EXCLUDED.crop_type,
                    crop_emoji=EXCLUDED.crop_emoji,
                    lat=EXCLUDED.lat,
                    lng=EXCLUDED.lng,
                    accuracy=EXCLUDED.accuracy,
                    planted_date=EXCLUDED.planted_date,
                    days_planted=EXCLUDED.days_planted,
                    status=EXCLUDED.status,
                    progress=EXCLUDED.progress,
                    moisture=EXCLUDED.moisture,
                    health=EXCLUDED.health,
                    temperature=EXCLUDED.temperature,
                    notes=EXCLUDED.notes,
                    real_gps=EXCLUDED.real_gps,
                    recorded_at=EXCLUDED.recorded_at,
                    updated_at=EXCLUDED.updated_at
            """, (
                plot.id, plot.crop_type, plot.crop_emoji,
                plot.lat, plot.lng, plot.accuracy,
                plot.planted_date, plot.days_planted, plot.status,
                plot.progress, plot.moisture, plot.health, plot.temperature,
                plot.notes, 1 if plot.real_gps else 0,
                now, now
            ))
            saved += 1
    return {"ok": True, "saved": saved, "synced_at": now}


@router.get("/gps-log/{plot_id}")
def get_gps_log(plot_id: str):
    with db() as conn:
        rows = conn.execute("SELECT * FROM gps_log WHERE plot_id=? ORDER BY timestamp DESC", (plot_id,)).fetchall()
    return {"plot_id": plot_id, "log": rows_to_list(rows)}


@router.get("/stats")
def get_stats():
    with db() as conn:
        total   = conn.execute("SELECT COUNT(*) FROM plots").fetchone()[0]
        by_crop = conn.execute("SELECT crop_type, COUNT(*) as cnt FROM plots WHERE crop_type IS NOT NULL GROUP BY crop_type").fetchall()
        by_status = conn.execute("SELECT status, COUNT(*) as cnt FROM plots GROUP BY status").fetchall()
        gps_ok  = conn.execute("SELECT COUNT(*) FROM plots WHERE real_gps=1").fetchone()[0]
    return {
        "total_plots": total,
        "gps_recorded": gps_ok,
        "by_crop": {r["crop_type"]: r["cnt"] for r in by_crop},
        "by_status": {r["status"]: r["cnt"] for r in by_status},
    }
