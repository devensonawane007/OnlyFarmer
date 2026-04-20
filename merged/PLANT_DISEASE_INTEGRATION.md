# 🌿 Plant Disease Detection — Integration Notes

## What was merged

The plant disease detection feature from `plant-disease-detection` has been integrated directly into the Smart Farm backend and frontend.

## How it works

### Backend (`backend/routes/disease.py`)
- New FastAPI route: `POST /problem/upload`
- Accepts a `cropImage` file (multipart/form-data)