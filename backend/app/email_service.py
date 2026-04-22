"""
email_service.py — Welcome email helper for EpiChat.

Uses Python's built-in smtplib (Gmail SMTP).
Add these to backend/.env to enable:
    SMTP_EMAIL=your@gmail.com
    SMTP_PASSWORD=your_app_password

If not configured, the function silently does nothing (login still works).
"""

from __future__ import annotations

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def send_welcome_email(to_email: str, username: str) -> None:
    """
    Send a welcome email to a newly registered user.
    Silently skips if SMTP credentials are not configured.
    """
    smtp_email = os.getenv("SMTP_EMAIL", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()

    if not smtp_email or not smtp_password:
        # Not configured — skip silently
        print(f"[EpiChat] Email not configured — skipping welcome email for {username}")
        return

    subject = "Welcome to EpiChat 🧠"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Arial', sans-serif; background: #070912; color: #f8fafc; margin: 0; padding: 0; }}
        .container {{ max-width: 560px; margin: 40px auto; background: linear-gradient(135deg, #0f172a, #1e1b4b); border-radius: 16px; overflow: hidden; border: 1px solid rgba(129,140,248,0.2); }}
        .header {{ background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 36px 32px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 2rem; font-weight: 800; color: white; letter-spacing: -1px; }}
        .header p {{ margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 0.95rem; }}
        .body {{ padding: 32px; }}
        .greeting {{ font-size: 1.1rem; font-weight: 600; color: #a5b4fc; margin-bottom: 8px; }}
        .message {{ color: #cbd5e1; line-height: 1.7; font-size: 0.95rem; }}
        .features {{ margin: 24px 0; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; padding: 20px 24px; }}
        .features h3 {{ margin: 0 0 12px; color: #818cf8; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.08em; }}
        .feature-item {{ display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: #e2e8f0; font-size: 0.92rem; }}
        .feature-item span {{ font-size: 1.1rem; }}
        .cta {{ text-align: center; margin: 28px 0 8px; }}
        .cta a {{ background: linear-gradient(135deg, #6366f1, #c084fc); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 0.95rem; display: inline-block; }}
        .footer {{ padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; }}
        .footer p {{ color: #475569; font-size: 0.78rem; margin: 0; line-height: 1.6; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 EpiChat</h1>
          <p>AI-Powered Epilepsy Detection & Guidance Platform</p>
        </div>
        <div class="body">
          <div class="greeting">Hello, {username}! 👋</div>
          <p class="message">
            Welcome to <strong>EpiChat</strong> — your account has been created successfully.
            You now have full access to our AI-powered epilepsy management platform.
          </p>
          <div class="features">
            <h3>What you can do</h3>
            <div class="feature-item"><span>🧠</span> Upload EEG files and get instant AI analysis</div>
            <div class="feature-item"><span>📋</span> View your full EEG history and reports</div>
            <div class="feature-item"><span>🤖</span> Chat with EpiChat AI for epilepsy guidance</div>
            <div class="feature-item"><span>📍</span> Find neurologists and hospitals near you</div>
            <div class="feature-item"><span>💊</span> Access seizure precautions & medication info</div>
          </div>
          <div class="cta">
            <a href="http://localhost:5173/dashboard">Open EpiChat Portal →</a>
          </div>
        </div>
        <div class="footer">
          <p>
            ⚠️ EpiChat is an AI-assisted informational tool and does not replace professional medical advice.<br>
            Always consult a qualified neurologist for clinical decisions.
          </p>
          <p style="margin-top: 8px; color: #334155;">© 2026 EpiChat · AI-Powered Epilepsy Platform</p>
        </div>
      </div>
    </body>
    </html>
    """

    plain_body = f"""
Hello {username},

Welcome to EpiChat! Your account has been created successfully.

You can now:
- Upload EEG files for AI seizure detection
- View your EEG history and reports
- Chat with the EpiChat AI assistant
- Find nearby neurologists and hospitals
- Access seizure precautions and medication information

Open your portal: http://localhost:5173/dashboard

---
⚠️ EpiChat is an AI-assisted informational tool and does not replace professional medical advice.
Always consult a qualified neurologist for clinical decisions.

Regards,
The EpiChat Team
    """.strip()

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"EpiChat <{smtp_email}>"
        msg["To"]      = to_email

        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body,  "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, msg.as_string())

        print(f"[EpiChat] ✅ Welcome email sent to {to_email}")

    except Exception as e:
        # Never crash login due to email failure
        print(f"[EpiChat] ⚠️ Failed to send welcome email: {e}")
