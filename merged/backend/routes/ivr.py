import os
from fastapi import APIRouter, Request, BackgroundTasks, Response, HTTPException
from pydantic import BaseModel
from fastapi.responses import HTMLResponse, FileResponse
from twilio.twiml.voice_response import VoiceResponse, Gather
import httpx
from datetime import datetime
from db import db, rows_to_list
from fpdf import FPDF
from .chatbot import ANTHROPIC_API_KEY

router = APIRouter(prefix="/ivr", tags=["IVR System"])

LANG_MAP = {
    "1": {"id": "en-IN", "name": "English", "prompt": "Please speak your query after the beep."},
    "2": {"id": "hi-IN", "name": "Hindi", "prompt": "Kripya beep ke baad apna prashn pooche."},
    "3": {"id": "mr-IN", "name": "Marathi", "prompt": "Kripaya beep nantar tumcha prashna vichara."}
}

IVR_SYSTEM_PROMPT = """You are Kisan AI, a phone assistant for Indian farmers. 
Keep answers EXTREMELY SHORT (1-2 sentences), conversational, and polite for a voice call.
- If asked about crop diseases, provide the exact organic or chemical treatment.
- If the farmer asks for a truck or transport, TELL THEM: "I can help you find nearby trucks. Please visit the Farm Direct Exchange section in our app to see available transporters."
- Respond entirely in the natural language based on the user's prompt (Hindi, Marathi, or English)."""

async def call_ai(message: str, history: list, lang_name: str) -> str:
    if not ANTHROPIC_API_KEY:
        if "disease" in message.lower() or "bimari" in message.lower() or "rog" in message.lower():
            return "For most fungal diseases, use Mancozeb 75 WP at 2.5 grams per liter. Do you have any other questions?"
        if "truck" in message.lower() or "transport" in message.lower():
            return "I can help you find nearby trucks. Please visit the Farm Direct Exchange section in our app to see available transporters. Is there anything else?"
        return f"I am Kisan AI. I hear you asking about {message}. How else can I help?"

    messages = [{"role": h["role"], "content": h["content"]} for h in history[-4:]]
    messages.append({"role": "user", "content": message})

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
                    "max_tokens": 150,
                    "system": f"{IVR_SYSTEM_PROMPT}\nThe user's preferred language is {lang_name}.",
                    "messages": messages,
                }
            )
            data = resp.json()
            return data["content"][0]["text"]
    except Exception as e:
        return "I am having trouble connecting right now. Please try again later."


from twilio.rest import Client

def log_chat(session_id: str, role: str, content: str, lang: str):
    with db() as conn:
        conn.execute(
            "INSERT INTO chat_history (session_id, role, content, lang) VALUES (%s, %s, %s, %s)",
            (session_id, role, content, lang)
        )

class CallRequest(BaseModel):
    to_number: str
    ngrok_url: str  # The public ngrok URL to reach this backend (e.g. https://xyz.ngrok-free.app)

@router.post("/call-me")
async def initiate_outbound_call(body: CallRequest):
    """Initiates an outbound call to the farmer's verified number"""
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_number = os.environ.get("TWILIO_PHONE_NUMBER")
    
    if not account_sid or not auth_token or not twilio_number:
        raise HTTPException(status_code=500, detail="Twilio credentials not configured in .env")

    client = Client(account_sid, auth_token)
    webhook_url = f"{body.ngrok_url.rstrip('/')}/ivr/incoming"
    
    try:
        call = client.calls.create(
            to=body.to_number,
            from_=twilio_number,
            url=webhook_url
        )
        return {"ok": True, "message": "Call initiated!", "call_sid": call.sid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/incoming")
async def ivr_incoming(request: Request):
    """Initial call - Greet and ask for language"""
    resp = VoiceResponse()
    gather = Gather(num_digits=1, action="/ivr/gather_lang", method="POST", timeout=5)
    gather.say("Welcome to SmartFarm Kisan A.I. For English, press 1. Hindi ke liye, do dabaye. Marathi sathi, teen daba.", language="hi-IN")
    resp.append(gather)
    resp.say("We didn't receive any input. Goodbye.", language="en-IN")
    return Response(content=str(resp), media_type="application/xml")

@router.post("/gather_lang")
async def ivr_gather_lang(request: Request):
    """Process language selection and ask for first question"""
    form_data = await request.form()
    digits = form_data.get("Digits", "1")
    lang_info = LANG_MAP.get(digits, LANG_MAP["1"])
    call_sid = form_data.get("CallSid", "unknown")

    resp = VoiceResponse()
    gather = Gather(input="speech", action=f"/ivr/respond?lang={digits}", method="POST", language=lang_info["id"], timeout=4, speechTimeout="auto")
    gather.say(lang_info["prompt"], language=lang_info["id"])
    resp.append(gather)
    
    # If no speech detected
    resp.say("I didn't hear anything. Goodbye.", language=lang_info["id"])
    return Response(content=str(resp), media_type="application/xml")

@router.post("/respond")
async def ivr_respond(request: Request, lang: str = "1"):
    """Handle speech input, get AI response, and continue conversation"""
    form_data = await request.form()
    speech_result = form_data.get("SpeechResult", "")
    call_sid = form_data.get("CallSid", "unknown")
    lang_info = LANG_MAP.get(lang, LANG_MAP["1"])

    resp = VoiceResponse()

    if not speech_result:
        resp.say("I didn't hear anything. Goodbye.", language=lang_info["id"])
        return Response(content=str(resp), media_type="application/xml")

    # Log user speech
    log_chat(call_sid, "user", speech_result, lang_info["name"])

    # Fetch recent history for context
    with db() as conn:
        history_raw = conn.execute(
            "SELECT role, content FROM chat_history WHERE session_id=%s ORDER BY sent_at ASC",
            (call_sid,)
        ).fetchall()
        history = rows_to_list(history_raw)

    # Get AI response
    ai_reply = await call_ai(speech_result, history, lang_info["name"])
    
    # Log AI reply
    log_chat(call_sid, "assistant", ai_reply, lang_info["name"])

    # Provide AI response and gather again
    gather = Gather(input="speech", action=f"/ivr/respond?lang={lang}", method="POST", language=lang_info["id"], timeout=4, speechTimeout="auto")
    gather.say(ai_reply, language=lang_info["id"])
    resp.append(gather)

    # If the user stops talking, we end the call cleanly
    resp.say("Thank you for calling Smart Farm. Goodbye.", language=lang_info["id"])
    
    return Response(content=str(resp), media_type="application/xml")

@router.get("/pdf/{session_id}")
def generate_call_pdf(session_id: str):
    """Generate a PDF transcript for the given Call SID (session_id)"""
    with db() as conn:
        rows = conn.execute(
            "SELECT role, content, sent_at FROM chat_history WHERE session_id=%s ORDER BY sent_at ASC",
            (session_id,)
        ).fetchall()
        history = rows_to_list(rows)

    if not history:
        return {"error": "No call history found for this session"}

    pdf = FPDF()
    pdf.add_page()

    # We need a unicode font for Hindi/Marathi, but fpdf's default fonts don't support it well out of the box.
    # To keep dependencies light, we'll use Arial/Helvetica and fallback cleanly.
    pdf.set_font('Helvetica', 'B', 16)
    pdf.cell(0, 10, 'SmartFarm IVR Call Transcript', ln=True, align='C')
    pdf.ln(5)
    
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 8, f'Call Session ID: {session_id}', ln=True)
    pdf.cell(0, 8, f'Date: {history[0]["sent_at"].strftime("%Y-%m-%d %H:%M:%S")}', ln=True)
    pdf.ln(5)
    
    pdf.set_font('Helvetica', '', 12)
    for msg in history:
        role = "Farmer" if msg["role"] == "user" else "Kisan AI"
        
        # Ensure encoding handles non-latin characters by substituting unknown ascii
        text = f"{role}: {msg['content']}"
        encoded_text = text.encode('latin-1', 'replace').decode('latin-1')
        
        pdf.multi_cell(0, 8, encoded_text)
        pdf.ln(2)

    os.makedirs("uploads/pdfs", exist_ok=True)
    file_path = f"uploads/pdfs/transcript_{session_id}.pdf"
    pdf.output(file_path)

    return FileResponse(file_path, filename=f"KisanAI_Transcript_{session_id}.pdf")
