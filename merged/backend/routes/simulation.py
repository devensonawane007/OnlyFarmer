from fastapi import APIRouter
from services.iot_simulator import generate_sensor_data

router = APIRouter(prefix="/simulate", tags=["IoT Simulation"])

@router.get("/farm/data")
def get_live_farm_data():
    return {
        "farm_id": "FARM_001",
        "status": "LIVE",
        "sensor_data": generate_sensor_data()
    }
