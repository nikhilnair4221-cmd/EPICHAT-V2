from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field


class PatientUpsert(BaseModel):
    username: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    age: int = Field(..., ge=0, le=130)
    gender: str = Field(..., min_length=1)


class SubmissionOut(BaseModel):
    id: int
    created_at: datetime

    patient_id: int
    patient_name: str
    patient_age: int
    patient_gender: str
    patient_username: str

    eeg_uploaded: bool
    symptoms_text: Optional[str] = None

    result_label: str
    confidence: float

    risk_score_series: List[float]
    seizure_channels: List[int]

    reviewed: bool
    reviewed_at: Optional[datetime] = None


class DoctorStatsOut(BaseModel):
    total_submissions: int
    unreviewed_submissions: int
    ictal_today: int


class PatientSubmitResponse(BaseModel):
    message: str
    submission: SubmissionOut

