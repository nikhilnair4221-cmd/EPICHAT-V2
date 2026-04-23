from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from jose import JWTError, jwt
import bcrypt

from sqlalchemy.orm import Session
from database import get_db
from models.db_models import User
from email_service import send_welcome_email

# Using direct bcrypt to avoid passlib/Python 3.13 compatibility issues

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "b39dc1e8c0500ddf83eb9db736ff1d56")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "user"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Check user exists
    username = req.username.strip()
    email = req.email.strip()
    pwd = req.password

    user = db.query(User).filter(User.username == username).first()

    if user:
        if not verify_password(pwd, user.password):
            raise HTTPException(status_code=401, detail="Incorrect password")
    else:
        # Create user if not exists (first-time registration)
        user = User(
            username=username,
            email=email,
            password=get_password_hash(pwd),
            role=req.role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        # Send welcome email — silently skips if SMTP not configured
        try:
            send_welcome_email(email, username)
        except Exception:
            pass

    # Issue token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "id": user.id, "role": user.role}, expires_delta=access_token_expires
    )

    return TokenResponse(access_token=access_token, username=user.username, role=user.role)
