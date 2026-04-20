# routes/chatbot.py — Kisan AI Farming Chatbot using Claude API
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import os, httpx

router = APIRouter(prefix="/chat", tags=["Kisan AI Chatbot"])

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

SYSTEM_PROMPT = """You are Kisan AI — a friendly, expert farming assistant for Indian farmers.
You speak warmly and simply, like talking to a fellow farmer.
You know everything about:
- Indian crops: wheat, rice, cotton, soybean, onion, tomato, potato, maize, sugarcane, pulses
- Seeding seasons, irrigation schedules, fertilizer doses (NPK), pest control
- MSP (Minimum Support Price), mandi rates, government schemes (PM-KISAN, PMFBY)
- Soil health, weather impact on crops, organic farming
- Maharashtra, Punjab, UP, Rajasthan, Karnataka farming practices

Keep answers SHORT (2-4 sentences). Use simple words. When relevant, mention:
- Exact quantities (kg/acre, liters/acre)
- Best timing (days after sowing, season months)
- Local crop names in Hindi/Marathi when helpful

Always be encouraging and practical. End with one actionable tip if relevant."""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    reply: str
    ok: bool


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not ANTHROPIC_API_KEY:
        # Fallback smart responses when no API key
        msg = req.message.lower()
        if any(w in msg for w in ["wheat", "गेहूं", "गहू"]):
            return {"ok": True, "reply": "Wheat (गेहूं) needs 4-6 irrigations. First irrigation at 21 days after sowing (crown root stage) is most critical. Apply 50kg urea/acre at sowing + 50kg at first irrigation. 💡 Sow between Nov 1-15 for best yield."}
        if any(w in msg for w in ["rice", "paddy", "चावल", "धान"]):
            return {"ok": True, "reply": "Paddy needs standing water (5cm) during tillering stage. Transplant 25-30 day old seedlings, 2-3 per hill, 20x15cm spacing. Apply 120kg urea/acre split in 3 doses. 💡 Keep field dry 2 weeks before harvest."}
        if any(w in msg for w in ["pest", "kida", "कीड़ा", "disease", "blight"]):
            return {"ok": True, "reply": "For most pest attacks, spray neem oil (5ml/liter water) as first organic defense. For fungal diseases, use Mancozeb 75WP at 2.5g/liter. 💡 Early morning spraying (before 9am) is most effective."}
        if any(w in msg for w in ["fertilizer", "khad", "urea", "dap", "खाद"]):
            return {"ok": True, "reply": "General formula: DAP 50kg/acre at sowing (gives P+N), then urea 50kg/acre after 3 weeks. For potash, use MOP 25kg/acre. 💡 Always apply fertilizer when soil has moisture for best absorption."}
        if any(w in msg for w in ["msp", "price", "rate", "daam", "दाम"]):
            return {"ok": True, "reply": "Check current MSP at agmarknet.gov.in or your state's agriculture department website. PM-KISAN gives ₹6000/year — register at pmkisan.gov.in if not already. 💡 Sell at APMC mandi for transparent pricing."}
        return {"ok": True, "reply": "Namaste! I'm Kisan AI — your farming assistant. Ask me about crops, fertilizers, pest control, irrigation, or government schemes. I'm here to help! 🌾"}

    # Build message history for context
    messages = []
    for h in (req.history or [])[-6:]:  # last 6 messages for context
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": req.message})

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 300,
                    "system": SYSTEM_PROMPT,
                    "messages": messages,
                }
            )
            data = resp.json()
            reply = data["content"][0]["text"]
            return {"ok": True, "reply": reply}
    except Exception as e:
        return {"ok": False, "reply": f"Sorry, I'm having trouble connecting. Please try again. ({str(e)[:60]})"}
