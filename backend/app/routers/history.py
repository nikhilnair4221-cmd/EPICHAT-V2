from __future__ import annotations

import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import User, EEGHistory
from routers.auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("")
def get_user_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.query(EEGHistory).filter(EEGHistory.user_id == current_user.id).all()
    out_records = []
    
    for r in records:
        out_records.append({
            "id": r.id,
            "file_name": r.file_name,
            "upload_time": r.upload_time,
            "classification_result": r.classification_result,
            "risk_level": r.risk_level,
            "confidence": r.confidence,
            "risk_score_series": json.loads(r.risk_score_series_json),
            "seizure_channels": json.loads(r.seizure_channels_json)
        })
        
    return {"history": out_records}
