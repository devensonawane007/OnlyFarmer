import requests
from bs4 import BeautifulSoup


def get_agmarknet_price(crop: str, state="Maharashtra"):
    """
    Fetch mandi prices from AGMARKNET (best-effort).
    Returns dict: min, modal, max (₹/quintal)
    """

    try:
        url = "https://agmarknet.gov.in/SearchCmmMkt.aspx"
        params = {
            "Tx_Commodity": crop.capitalize(),
            "Tx_State": state,
            "Tx_District": "--Select--",
            "Tx_Market": "--Select--",
            "DateFrom": "",
            "DateTo": "",
            "Fr_Date": "",
            "To_Date": "",
            "Tx_Trend": "0",
            "Tx_CommodityHead": crop.capitalize(),
            "Tx_StateHead": state,
            "Tx_DistrictHead": "",
            "Tx_MarketHead": ""
        }

        response = requests.get(url, timeout=5)
        soup = BeautifulSoup(response.text, "html.parser")

        table = soup.find("table", {"id": "cphBody_GridView1"})
        if not table:
            raise Exception("Price table not found")

        rows = table.find_all("tr")
        prices = rows[1].find_all("td")

        return {
            "min": int(prices[2].text),
            "modal": int(prices[3].text),
            "max": int(prices[4].text)
        }

    except Exception:
        return None
