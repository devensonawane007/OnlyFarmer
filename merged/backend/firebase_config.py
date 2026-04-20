import os
import firebase_admin
from firebase_admin import credentials, db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_PATH = os.path.join(BASE_DIR, "firebase_key.json")

# Initialize Firebase ONLY ONCE (important for uvicorn --reload)
if not firebase_admin._apps:
    cred = credentials.Certificate(KEY_PATH)
    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://smartfarm-1-46fec.firebaseio.com"
    })

def get_db():
    return db
