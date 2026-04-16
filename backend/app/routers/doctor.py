from __future__ import annotations

import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import User, EEGHistory
from routers.auth import get_current_user
from schemas import SubmissionOut

router = APIRouter(prefix="/api/doctor", tags=["doctor"])

@router.get("/patients", response_model=List[SubmissionOut])
def get_all_submissions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Fetch all patient submissions for the doctor dashboard.
    In a real app, we'd check if current_user.is_doctor.
    """
    records = db.query(EEGHistory).order_by(EEGHistory.upload_time.desc()).all()
    
    out = []
    for r in records:
        # Join with user to get username if needed, 
        # but we already have patient_name in the record now.
        out.append(SubmissionOut(
            id=r.id,
            created_at=r.upload_time,
            patient_id=r.user_id,
            patient_name=r.patient_name,
            patient_age=r.patient_age,
            patient_gender=r.patient_gender,
            patient_username=r.user.username if r.user else "unknown",
            eeg_uploaded=bool(r.raw_file_path),
            symptoms_text=r.symptoms_text,
            result_label=r.classification_result,
            confidence=r.confidence,
            risk_score_series=json.loads(r.risk_score_series_json),
            seizure_channels=json.loads(r.seizure_channels_json),
            reviewed=r.reviewed,
            reviewed_at=r.reviewed_at
        ))
    return out

@router.patch("/patients/{submission_id}/review", response_model=SubmissionOut)
def mark_as_reviewed(submission_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Mark a submission as reviewed by a doctor.
    """
    record = db.query(EEGHistory).filter(EEGHistory.id == submission_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    record.reviewed = True
    record.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    
    return SubmissionOut(
        id=record.id,
        created_at=record.upload_time,
        patient_id=record.user_id,
        patient_name=record.patient_name,
        patient_age=record.patient_age,
        patient_gender=record.patient_gender,
        patient_username=record.user.username if record.user else "unknown",
        eeg_uploaded=bool(record.raw_file_path),
        symptoms_text=record.symptoms_text,
        result_label=record.classification_result,
        confidence=record.confidence,
        risk_score_series=json.loads(record.risk_score_series_json),
        seizure_channels=json.loads(record.seizure_channels_json),
        reviewed=record.reviewed,
        reviewed_at=record.reviewed_at
    )
