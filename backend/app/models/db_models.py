from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    eeg_records: Mapped[list["EEGHistory"]] = relationship(
        "EEGHistory", back_populates="user", cascade="all, delete-orphan"
    )


class EEGHistory(Base):
    __tablename__ = "eeg_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    file_name: Mapped[str] = mapped_column(String(255))
    upload_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    # Patient metadata from form
    patient_name: Mapped[str] = mapped_column(String(255), default="Unknown")
    patient_age: Mapped[int] = mapped_column(Integer, default=0)
    patient_gender: Mapped[str] = mapped_column(String(32), default="Other")
    symptoms_text: Mapped[str] = mapped_column(Text, nullable=True)

    classification_result: Mapped[str] = mapped_column(String(32))  # Normal / Pre-ictal / Ictal
    risk_level: Mapped[float] = mapped_column(Float)  # Similar to max_prob or risk score avg
    confidence: Mapped[float] = mapped_column(Float)  # 0-100
    
    raw_file_path: Mapped[str] = mapped_column(String(1024))
    
    risk_score_series_json: Mapped[str] = mapped_column(Text, default="[]")
    seizure_channels_json: Mapped[str] = mapped_column(Text, default="[]")

    # Doctor review fields
    reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="eeg_records")

