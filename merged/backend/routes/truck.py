from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.truck_service import add_truck, get_available_trucks, book_truck
from typing import List

router = APIRouter(prefix="/trucks", tags=["Truck Logistics"])

class TruckInput(BaseModel):
    truckId: str
    ownerName: str
    phone: str
    location: str
    capacityTons: float
    pricePerKm: float

class TruckBookingInput(BaseModel):
    truckId: str
    farmId: str
    zoneId: str
    crop: str
    expectedYieldTons: float

@router.post("/add")
def add_new_trucks(trucks: List[TruckInput]):
    added = []

    for truck in trucks:
        result = add_truck(truck.dict())
        added.append(result)

    return {
        "success": True,
        "total_added": len(added)
    }


@router.get("/available")
def list_available_trucks():
    return get_available_trucks()

@router.post("/book")
def book_truck_api(data: TruckBookingInput):
    try:
        return book_truck(data.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
