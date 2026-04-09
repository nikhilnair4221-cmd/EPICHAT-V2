from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from db import get_db
from models.db_models import Patient, Submission
from schemas import PatientSubmitResponse, SubmissionOut
from services.analysis import analyze_edf_to_summary, save_upload_file


router = APIRouter(prefix="/api/patient", tags=["patient"])


def _submission_to_out(sub: Submission) -> SubmissionOut:
    return SubmissionOut(
        id=sub.id,
        created_at=sub.created_at,
        patient_id=sub.patient.id,
        patient_name=sub.patient.name,
        patient_age=sub.patient.age,
        patient_gender=sub.patient.gender,
        patient_username=sub.patient.username,
        eeg_uploaded=bool(sub.eeg_file_path),
        symptoms_text=sub.symptoms_text,
        result_label=sub.result_label,
        confidence=float(sub.confidence),
        risk_score_series=json.loads(sub.risk_score_series_json or "[]"),
        seizure_channels=json.loads(sub.seizure_channels_json or "[]"),
        reviewed=bool(sub.reviewed),
        reviewed_at=sub.reviewed_at,
    )


@router.post("/submit", response_model=PatientSubmitResponse)
async def submit_patient(
    username: str = Form(...),
    name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    symptoms_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Persist patient + submission, run inference if EDF provided.
    Note: This is a lightweight 'authenticated' stub using username as identity.
    """
    username = (username or "").strip().lower()
    if not username:
        raise HTTPException(status_code=400, detail="username is required")

    patient = db.query(Patient).filter(Patient.username == username).one_or_none()
    if patient is None:
        patient = Patient(username=username, name=name, age=age, gender=gender)
        db.add(patient)
        db.commit()
        db.refresh(patient)
    else:
        # Keep profile up to date from latest submission
        patient.name = name
        patient.age = age
        patient.gender = gender
        db.commit()
        db.refresh(patient)

    eeg_file_path = None
    analysis = {
        "risk_score_series": [],
        "result_label": "Normal",
        "confidence": 0.0,
        "seizure_channels": [],
    }

    if file is not None:
        ext = (file.filename or "").split(".")[-1].lower()
        if ext != "edf":
            raise HTTPException(status_code=400, detail="Only .edf supported for EEG inference.")

        saved = save_upload_file(file.file, file.filename)
        eeg_file_path = str(saved)
        try:
            analysis = analyze_edf_to_summary(Path(saved))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    sub = Submission(
        patient_id=patient.id,
        eeg_file_path=eeg_file_path,
        symptoms_text=symptoms_text,
        result_label=analysis["result_label"],
        confidence=float(analysis["confidence"]),
        risk_score_series_json=json.dumps(analysis["risk_score_series"]),
        seizure_channels_json=json.dumps(analysis["seizure_channels"]),
        reviewed=False,
        reviewed_at=None,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    db.refresh(patient)

    return PatientSubmitResponse(
        message="Submission stored.",
        submission=_submission_to_out(sub),
    )

