"""
Farm Direct Exchange — uses unified smartfarm.db via db.py
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import math
from db import db, rows_to_list

router = APIRouter(prefix="/exchange", tags=["Farm Direct Exchange"])

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2-lat1); dlon = math.radians(lon2-lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return R*2*math.asin(math.sqrt(a))

class ImporterOrderCreate(BaseModel):
    importer_name: str; importer_phone: str; address: str
    crop: str; qty_kg: float; lat: float; lon: float

class GeocoderRequest(BaseModel):
    address: str

CITY_COORDS = {
    "mumbai":(19.0760,72.8777),"delhi":(28.6139,77.2090),"pune":(18.5204,73.8567),
    "bangalore":(12.9716,77.5946),"hyderabad":(17.3850,78.4867),"chennai":(13.0827,80.2707),
    "kolkata":(22.5726,88.3639),"ahmedabad":(23.0225,72.5714),"jaipur":(26.9124,75.7873),
    "nashik":(19.9975,73.7898),"nagpur":(21.1458,79.0882),"surat":(21.1702,72.8311),
    "lucknow":(26.8467,80.9462),"kanpur":(26.4499,80.3319),"patna":(25.5941,85.1376),
}

@router.post("/importer/order-request")
def create_order(order: ImporterOrderCreate):
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO exchange_orders (importer_name,importer_phone,address,crop,qty_kg,lat,lon) VALUES (?,?,?,?,?,?,?) RETURNING id",
            (order.importer_name,order.importer_phone,order.address,order.crop,order.qty_kg,order.lat,order.lon)
        )
        row_id = cur.fetchone()[0]
        row = conn.execute("SELECT * FROM exchange_orders WHERE id=?", (row_id,)).fetchone()
    return dict(row)

@router.get("/exporter/nearby-view")
def nearby_view(lat:float, lon:float, radius_km:float=5000, crop:Optional[str]=None):
    with db() as conn:
        transporters_raw = conn.execute("SELECT * FROM exchange_transporters").fetchall()
        q = "SELECT * FROM exchange_orders WHERE status='open'"
        params = []
        if crop:
            q += " AND lower(crop)=lower(?)"; params.append(crop)
        orders_raw = conn.execute(q, params).fetchall()
    transporters = []
    for t in transporters_raw:
        t = dict(t)
        if t["lat"] and t["lon"]:
            t["distance_km"] = round(haversine_km(lat,lon,t["lat"],t["lon"]),1)
        transporters.append(t)
    transporters.sort(key=lambda x: x.get("distance_km") or 99999)
    orders = []
    for o in orders_raw:
        o = dict(o)
        o["distance_km"] = round(haversine_km(lat,lon,o["lat"],o["lon"]),1)
        orders.append(o)
    orders.sort(key=lambda x: x["distance_km"])
    return {"location":{"lat":lat,"lon":lon},"nearby_transporters":transporters,"importer_order_requests":orders}

@router.post("/geo/geocode")
def geocode(req: GeocoderRequest):
    lower = req.address.lower()
    for city,(clat,clon) in CITY_COORDS.items():
        if city in lower:
            return {"lat":clat,"lon":clon,"city":city.title()}
    return {"lat":20.5937,"lon":78.9629,"city":"India"}

@router.get("/transporters")
def list_transporters():
    with db() as conn:
        rows = conn.execute("SELECT * FROM exchange_transporters ORDER BY name").fetchall()
    return rows_to_list(rows)

@router.get("/importer/orders")
def list_orders(crop:Optional[str]=None, status:str="open"):
    with db() as conn:
        q = "SELECT * FROM exchange_orders WHERE status=?"; params=[status]
        if crop:
            q += " AND lower(crop)=lower(?)"; params.append(crop)
        rows = conn.execute(q, params).fetchall()
    return rows_to_list(rows)
