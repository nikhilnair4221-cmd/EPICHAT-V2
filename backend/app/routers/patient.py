from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import User, EEGHistory
from routers.auth import get_current_user
from services.analysis import analyze_edf_to_summary, save_upload_file

router = APIRouter(prefix="/api/patient", tags=["patient"])


@router.post("/submit")
async def submit_patient(
    name: str = Form("Unknown"),
    age: int = Form(0),
    gender: str = Form("Other"),
    symptoms_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Persist submission and run inference if EDF provided.
    Assumes authenticated via token!
    """

    filename = "unknown"
    eeg_file_path = ""
    analysis = {
        "risk_score_series": [],
        "max_prob": 0.0,
        "result_label": "Normal",
        "confidence": 0.0,
        "seizure_channels": [],
    }

    if file is not None:
        filename = file.filename or "unknown.edf"
        ext = filename.split(".")[-1].lower()
        if ext != "edf":
            raise HTTPException(status_code=400, detail="Only .edf supported for EEG inference.")

        saved = save_upload_file(file.file, filename)
        eeg_file_path = str(saved)
        try:
            analysis = analyze_edf_to_summary(Path(saved))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    sub = EEGHistory(
        user_id=current_user.id,
        file_name=filename,
        patient_name=name,
        patient_age=age,
        patient_gender=gender,
        symptoms_text=symptoms_text,
        classification_result=analysis["result_label"],
        risk_level=float(analysis["max_prob"]),
        confidence=float(analysis["confidence"]),
        raw_file_path=eeg_file_path,
        risk_score_series_json=json.dumps(analysis["risk_score_series"]),
        seizure_channels_json=json.dumps(analysis["seizure_channels"]),
    )
    
    db.add(sub)
    db.commit()
    db.refresh(sub)

    return {
        "message": "Submission stored successfully.",
        "submission": {
            "id": sub.id,
            "upload_time": sub.upload_time,
            "file_name": sub.file_name,
            "patient_name": sub.patient_name,
            "patient_age": sub.patient_age,
            "patient_gender": sub.patient_gender,
            "result_label": sub.classification_result,
            "risk_level": sub.risk_level,
            "confidence": sub.confidence,
            "risk_score_series": analysis["risk_score_series"],
            "seizure_channels": analysis["seizure_channels"],
        }
    }

