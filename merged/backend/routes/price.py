from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.price_service import predict_price
from services.price_service import predict_price, get_all_crop_prices


router = APIRouter(prefix="/price", tags=["Crop Pricing"])


class PriceInput(BaseModel):
    crop: str
    state: str = "Maharashtra"


@router.post("/predict")
def get_crop_price(data: PriceInput):
    try:
        return predict_price(data.crop, data.state)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
@router.get("/all")
def get_all_prices(state: str = "Maharashtra"):
    return get_all_crop_prices(state)

