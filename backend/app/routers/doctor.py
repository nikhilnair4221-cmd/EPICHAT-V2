from __future__ import annotations

import json
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from db import get_db
from models.db_models import Submission
from schemas import DoctorStatsOut, SubmissionOut


router = APIRouter(prefix="/api/doctor", tags=["doctor"])


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


@router.get("/patients", response_model=list[SubmissionOut])
def list_patient_submissions(db: Session = Depends(get_db)):
    subs = (
        db.query(Submission)
        .order_by(desc(Submission.created_at))
        .all()
    )
    return [_submission_to_out(s) for s in subs]


@router.patch("/patients/{submission_id}/review", response_model=SubmissionOut)
def mark_reviewed(submission_id: int, db: Session = Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == submission_id).one_or_none()
    if sub is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub.reviewed = True
    sub.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(sub)
    return _submission_to_out(sub)


@router.get("/stats", response_model=DoctorStatsOut)
def doctor_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Submission.id)).scalar() or 0
    unreviewed = db.query(func.count(Submission.id)).filter(Submission.reviewed == False).scalar() or 0  # noqa: E712

    today = date.today()
    ictal_today = (
        db.query(func.count(Submission.id))
        .filter(Submission.result_label == "Ictal")
        .filter(func.date(Submission.created_at) == today.isoformat())
        .scalar()
        or 0
    )
    return DoctorStatsOut(
        total_submissions=int(total),
        unreviewed_submissions=int(unreviewed),
        ictal_today=int(ictal_today),
    )

