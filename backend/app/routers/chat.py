"""
/api/chat  —  OpenAI proxy endpoint
Keeps the API key on the server; the frontend never sees it.
"""
from __future__ import annotations

import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/chat", tags=["chat"])

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
MODEL           = "gpt-4o-mini"

SYSTEM_PROMPT = (
    "You are EpiChat AI, a helpful assistant that explains EEG results, "
    "epileptic seizure risk, precautions, and general medical information. "
    "You help patients understand their EEG reports, explain what seizure "
    "classifications mean, give first-aid steps for seizures, and provide "
    "general epilepsy lifestyle guidance. "
    "Always be clear, compassionate, and easy to understand. Keep responses "
    "concise and well-structured. Use bullet points where helpful. "
    "⚠️ Medical Disclaimer: You are not a doctor. All information is "
    "educational only. Always advise the user to consult a qualified "
    "neurologist for diagnosis and treatment."
)


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    api_key = os.getenv("OPENAI_API_KEY", "")

    if not api_key or api_key == "YOUR_KEY_HERE":
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured. Set OPENAI_API_KEY in backend environment."
        )

    # Build messages with system prompt prepended
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in req.messages:
        messages.append({"role": m.role, "content": m.content})

    payload = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": 500,
        "temperature": 0.7,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(OPENAI_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
            return ChatResponse(reply=reply)

    except httpx.HTTPStatusError as e:
        body = e.response.json() if e.response.content else {}
        msg  = body.get("error", {}).get("message", str(e))
        raise HTTPException(status_code=e.response.status_code, detail=f"OpenAI error: {msg}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Network error reaching OpenAI: {e}")
