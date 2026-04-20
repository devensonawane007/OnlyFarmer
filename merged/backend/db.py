"""
db.py — Unified PostgreSQL database for SmartFarm AR.

Tables:
  farms               — farm configuration
  plots               — field plots (GPS + crop)
  sensor_readings     — soil/health/temp time-series
  disease_scans       — plant disease detection history
  ar_captures         — GPS-tagged seeding photos
  crop_identifications— AI vision crop ID results
  gps_log             — position history
  chat_history        — Kisan AI conversation log
  exchange_transporters
  exchange_orders
"""

import psycopg2
import psycopg2.extras
import os, json
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

class DBWrapper:
    def __init__(self, conn):
        self.conn = conn

    def execute(self, query, params=None):
        cur = self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = query.replace("?", "%s")
        if params:
            cur.execute(query, params)
        else:
            cur.execute(query)
        return cur
    
    def executemany(self, query, params=None):
        cur = self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = query.replace("?", "%s")
        cur.executemany(query, params)
        return cur

    def executescript(self, script):
        cur = self.conn.cursor()
        cur.execute(script)
        return cur

    def commit(self):
        self.conn.commit()
        
    def rollback(self):
        self.conn.rollback()
        
    def close(self):
        self.conn.close()

def get_conn():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL not set in .env")
    return psycopg2.connect(url)

@contextmanager
def db():
    conn = get_conn()
    wrapper = DBWrapper(conn)
    try:
        yield wrapper
        wrapper.commit()
    except Exception:
        wrapper.rollback()
        raise
    finally:
        wrapper.close()

SCHEMA = """
CREATE TABLE IF NOT EXISTS farms (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR    NOT NULL DEFAULT 'My Farm',
    rows       INTEGER NOT NULL DEFAULT 8,
    cols       INTEGER NOT NULL DEFAULT 10,
    owner_name VARCHAR,
    location   VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plots (
    id           VARCHAR PRIMARY KEY,
    farm_id      INTEGER REFERENCES farms(id),
    crop_type    VARCHAR,
    crop_emoji   VARCHAR,
    planted_date VARCHAR,
    days_planted INTEGER DEFAULT 0,
    progress     REAL    DEFAULT 0,
    status       VARCHAR    DEFAULT 'empty',
    notes        TEXT    DEFAULT '',
    lat          REAL,
    lng          REAL,
    accuracy     REAL,
    accuracy_m   REAL,
    real_gps     INTEGER DEFAULT 0,
    moisture     REAL DEFAULT 65,
    health       REAL DEFAULT 90,
    temperature  REAL DEFAULT 28,
    recorded_at  TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    id          SERIAL PRIMARY KEY,
    plot_id     VARCHAR NOT NULL,
    moisture    REAL,
    health      REAL,
    temperature REAL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sensor_plot ON sensor_readings(plot_id);

CREATE TABLE IF NOT EXISTS disease_scans (
    id               VARCHAR PRIMARY KEY,
    plot_id          VARCHAR,
    crop_hint        VARCHAR,
    image_path       VARCHAR,
    disease_raw      VARCHAR,
    disease_display  VARCHAR,
    is_healthy       INTEGER DEFAULT 0,
    crop             VARCHAR,
    confidence       REAL,
    severity         VARCHAR,
    treatment        TEXT,
    prevention       TEXT,
    detection_source VARCHAR,
    top3_json        TEXT,
    status_label     VARCHAR,
    scanned_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ar_captures (
    id                 SERIAL PRIMARY KEY,
    filename           VARCHAR NOT NULL,
    farm_name          VARCHAR,
    gps_lat            REAL,
    gps_lng            REAL,
    gps_accuracy       REAL,
    gps_ok             INTEGER DEFAULT 0,
    plots_snapshot     TEXT,
    active_plot_count  INTEGER DEFAULT 0,
    seeding_plot_count INTEGER DEFAULT 0,
    file_size_bytes    INTEGER,
    captured_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crop_identifications (
    id                SERIAL PRIMARY KEY,
    identified_crop   VARCHAR,
    raw_name          VARCHAR,
    confidence        INTEGER,
    stage_name        VARCHAR,
    stage_description TEXT,
    care_tips_json    TEXT,
    names_json        TEXT,
    what_i_see        TEXT,
    not_a_crop        INTEGER DEFAULT 0,
    assigned_to_plot  VARCHAR,
    gps_lat           REAL,
    gps_lng           REAL,
    identified_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gps_log (
    id          SERIAL PRIMARY KEY,
    plot_id     VARCHAR,
    lat         REAL NOT NULL,
    lng         REAL NOT NULL,
    accuracy    REAL,
    accuracy_m  REAL,
    altitude_m  REAL,
    speed_ms    REAL,
    event_type  VARCHAR,
    timestamp   TIMESTAMP,
    ok          INTEGER DEFAULT 1,
    source      VARCHAR DEFAULT 'watchPosition',
    logged_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_history (
    id         SERIAL PRIMARY KEY,
    session_id VARCHAR,
    role       VARCHAR NOT NULL CHECK(role IN ('user','assistant')),
    content    TEXT NOT NULL,
    lang       VARCHAR DEFAULT 'en',
    sent_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_history(session_id);

CREATE TABLE IF NOT EXISTS exchange_transporters (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR NOT NULL,
    phone            VARCHAR NOT NULL,
    vehicle_type     VARCHAR NOT NULL,
    capacity_kg      REAL NOT NULL,
    lat              REAL,
    lon              REAL,
    service_radius_km REAL DEFAULT 200,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exchange_orders (
    id             SERIAL PRIMARY KEY,
    importer_name  VARCHAR NOT NULL,
    importer_phone VARCHAR NOT NULL,
    address        TEXT NOT NULL,
    crop           VARCHAR NOT NULL,
    qty_kg         REAL NOT NULL,
    lat            REAL NOT NULL,
    lon            REAL NOT NULL,
    status         VARCHAR DEFAULT 'open',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""

SEED_TRANSPORTERS = [
    ("Sai Logistics",       "+91-9001001001", "Mini Truck",  3000,  19.2000, 72.9700, 200),
    ("GreenMove Transport", "+91-9001001002", "Pickup",      1200,  20.0000, 73.7000,  80),
    ("Bharat Carriers",     "+91-9001001003", "Large Truck", 8000,  18.5200, 73.8500, 500),
    ("KisanMove",           "+91-9001001004", "Tempo",        700,  17.3850, 78.4867, 120),
    ("AgroExpress",         "+91-9001001005", "Mini Truck",  2500,  22.5726, 88.3639, 300),
    ("Rajputana Freight",   "+91-9001001006", "Large Truck",10000,  26.9124, 75.7873, 600),
    ("Deccan Cargo",        "+91-9001001007", "Pickup",      1500,  15.3173, 75.7139, 150),
    ("Punjab Transport Co", "+91-9001001008", "Large Truck",12000,  30.7333, 76.7794, 800),
    ("Kerala Haul",         "+91-9001001009", "Mini Truck",  2000,  10.8505, 76.2711, 200),
    ("TN Freight",          "+91-9001001010", "Tempo",        800,  13.0827, 80.2707, 100),
]

def init_db():
    with db() as conn:
        conn.executescript(SCHEMA)
        # Seed default farm if empty
        row = conn.execute("SELECT id FROM farms LIMIT 1").fetchone()
        if not row:
            conn.execute("INSERT INTO farms (name) VALUES ('My Farm')")
        # Seed transporters if empty
        row = conn.execute("SELECT id FROM exchange_transporters LIMIT 1").fetchone()
        if not row:
            conn.executemany(
                "INSERT INTO exchange_transporters (name,phone,vehicle_type,capacity_kg,lat,lon,service_radius_km) VALUES (?,?,?,?,?,?,?)",
                SEED_TRANSPORTERS
            )
    print("✅ SmartFarm PostgreSQL DB ready.")

def row_to_dict(row):
    if row is None:
        return None
    return dict(row)

def rows_to_list(rows):
    return [dict(r) for r in rows]

