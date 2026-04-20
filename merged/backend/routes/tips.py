from fastapi import APIRouter
from datetime import date
from data.farming_tips import FARMING_TIPS

router = APIRouter()

@router.get("/tips/today")
def tips_of_the_day():
    today = date.today()
    index = today.toordinal() % len(FARMING_TIPS)

    return {
        "date": today.isoformat(),
        "tip": FARMING_TIPS[index]
    }
