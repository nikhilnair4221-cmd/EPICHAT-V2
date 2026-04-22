from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env file from backend root (one level up from app/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

# Fix python parsing path
sys.path.append(str(Path(__file__).parent))

from routers import upload
from routers import patient, chat, auth, history, doctor
from database import init_db

app = FastAPI(title="EpiChat Inference API", version="2.0")

# Setup CORS — allow all common Vite / CRA dev-server ports so requests
# are never blocked when Vite shifts ports (5173, 5174, 5175, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev since Vite ports may shift
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core routers
app.include_router(upload.router)
app.include_router(patient.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(doctor.router)


@app.on_event("startup")
def _startup():
    init_db()

@app.get("/")
def health_check():
    return {"status": "EpiChat Backend Online", "version": "2.0"}
