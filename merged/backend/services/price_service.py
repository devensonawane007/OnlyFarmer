from services.agmarknet_service import get_agmarknet_price

MSP_DATA = {
    "wheat": 2275,
    "rice": 2300,
    "maize": 2090,
    "cotton": 7121,
    "soybean": 4600
}

FALLBACK_MARKET = {
    "wheat": {"avg": 2450, "max": 2700},
    "rice": {"avg": 2600, "max": 2900}
}


def predict_price(crop: str, state="Maharashtra"):
    crop = crop.lower()

    if crop not in MSP_DATA:
        raise ValueError("Crop not supported")

    msp = MSP_DATA[crop]

    live_price = get_agmarknet_price(crop, state)

    if live_price:
        market_avg = live_price["modal"]
        market_max = live_price["max"]
        source = "AGMARKNET (Live)"
    else:
        market_avg = FALLBACK_MARKET.get(crop, {}).get("avg", int(msp * 1.15))
        market_max = FALLBACK_MARKET.get(crop, {}).get("max", int(msp * 1.25))
        source = "Govt MSP + Market Estimate"

    return {
        "crop": crop,
        "msp": msp,
        "min_price": int(msp * 1.05),
        "ideal_price": market_avg,
        "max_price": market_max,
        "unit": "₹ per quintal",
        "price_source": source
    }
def get_all_crop_prices(state="Maharashtra"):
    results = []

    for crop in MSP_DATA.keys():
        try:
            price = predict_price(crop, state)
            results.append(price)
        except:
            continue

    return results
