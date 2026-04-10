from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
from pathlib import Path

# Load .env file from backend root (one level up from app/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())

# Fix python parsing path
sys.path.append(str(Path(__file__).parent))

from routers import upload
from routers import patient, doctor, chat
from db import init_db

app = FastAPI(title="EpiChat Inference API", version="2.0")

# Setup CORS for the React Frontend on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core routers
app.include_router(upload.router)
app.include_router(patient.router)
app.include_router(doctor.router)
app.include_router(chat.router)


@app.on_event("startup")
def _startup():
    init_db()

@app.get("/")
def health_check():
    return {"status": "EpiChat Backend Online", "version": "2.0"}
