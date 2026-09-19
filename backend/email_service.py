import os
import re
import ssl
import smtplib
import httpx
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ---------------------------------------------------------
# Environment Loader (Reads backend/.env and root .env)
# ---------------------------------------------------------
def _load_env_file(filepath: str):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception as e:
            print(f"[email_service] Warning loading env {filepath}: {e}")

_current_dir = os.path.dirname(os.path.abspath(__file__))
_load_env_file(os.path.join(_current_dir, ".env"))
_load_env_file(os.path.join(os.path.dirname(_current_dir), ".env"))

# ---------------------------------------------------------
# Email Service Configuration
# ---------------------------------------------------------
FEEDBACK_DESTINATION_EMAIL = os.getenv("FEEDBACK_EMAIL", "npb.sahej@gmail.com").strip()
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "").strip().lower()
EMAIL_API_KEY = os.getenv("EMAIL_API_KEY", "").strip() or os.getenv("RESEND_API_KEY", "").strip()
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "").strip()
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "").strip()

# Optional SMTP Settings
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()

EMAIL_FROM = os.getenv("EMAIL_FROM", "SETU Feedback <onboarding@resend.dev>").strip()

class EmailDeliveryError(Exception):
    """Raised when email delivery fails via the configured provider."""
    pass

class EmailConfigurationError(Exception):
    """Raised when no email credentials or provider is configured."""
    pass

def _get_active_provider() -> str:
    """Determines the active email provider based on configuration and available keys."""
    if EMAIL_PROVIDER:
        return EMAIL_PROVIDER
    if EMAIL_API_KEY:
        return "resend"
    if BREVO_API_KEY:
        return "brevo"
    if SENDGRID_API_KEY:
        return "sendgrid"
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        return "smtp"
    return "unconfigured"

def _format_star_rating(rating: int) -> str:
    r = max(1, min(5, rating))
    return "★" * r + "☆" * (5 - r)

def _get_ist_timestamp() -> str:
    """Returns current timestamp formatted in Indian Standard Time (IST)."""
    ist = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(ist)
    return now_ist.strftime("%d %B %Y, %I:%M %p IST")

def _build_email_subject(data: Dict[str, Any]) -> str:
    rating = data.get("rating", 5)
    train_no = str(data.get("train_number") or "").strip()
    category = str(data.get("feedback_type") or "General Feedback").strip()
    
    if train_no:
        return f"SETU Feedback — {rating}/5 — Train {train_no}"
    return f"SETU Feedback — {rating}/5 — {category}"

def _build_plain_text_body(data: Dict[str, Any]) -> str:
    name = str(data.get("name") or "Not provided").strip()
    email = str(data.get("email") or "Not provided").strip()
    feedback_type = str(data.get("feedback_type") or "General Feedback").strip()
    rating = int(data.get("rating", 5))
    stars = _format_star_rating(rating)
    message = str(data.get("message") or "").strip()
    train_no = str(data.get("train_number") or "Not provided").strip()
    journey_date = str(data.get("journey_date") or "Not provided").strip()
    boarding_station = str(data.get("boarding_station") or "Not provided").strip()
    submitted_at = _get_ist_timestamp()

    return f"""SETU FEEDBACK

Name:
{name}

Email:
{email}

Feedback Type:
{feedback_type}

Rating:
{stars} ({rating}/5)

Message:
{message}

Train Number:
{train_no}

Journey Date:
{journey_date}

Boarding Station:
{boarding_station}

Submitted At:
{submitted_at}
"""

def _build_html_body(data: Dict[str, Any]) -> str:
    name = str(data.get("name") or "Not provided").strip()
    email = str(data.get("email") or "Not provided").strip()
    feedback_type = str(data.get("feedback_type") or "General Feedback").strip()
    rating = int(data.get("rating", 5))
    stars = _format_star_rating(rating)
    message = str(data.get("message") or "").strip().replace("\n", "<br/>")
    train_no = str(data.get("train_number") or "Not provided").strip()
    journey_date = str(data.get("journey_date") or "Not provided").strip()
    boarding_station = str(data.get("boarding_station") or "Not provided").strip()
    submitted_at = _get_ist_timestamp()

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SETU Feedback</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080d15; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #0d1628; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f1f3d 0%, #1e293b 100%); padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.08);">
      <div style="display: inline-block; padding: 4px 12px; background: rgba(223, 155, 62, 0.15); border: 1px solid rgba(223, 155, 62, 0.3); border-radius: 9999px; color: #df9b3e; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 10px;">
        SETU Passenger Feedback
      </div>
      <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 700; color: #ffffff;">New Passenger Feedback Received</h1>
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">Delivered directly to {FEEDBACK_DESTINATION_EMAIL}</p>
    </div>

    <!-- Rating Summary Banner -->
    <div style="padding: 20px 24px; background: rgba(223, 155, 62, 0.08); border-bottom: 1px solid rgba(223, 155, 62, 0.2); display: flex; align-items: center;">
      <div style="font-size: 28px; color: #df9b3e; letter-spacing: 2px;">{stars}</div>
      <div style="margin-left: 16px; font-size: 16px; font-weight: 600; color: #f8fafc;">{rating} out of 5 Stars</div>
    </div>

    <!-- Message Body -->
    <div style="padding: 24px;">
      <h3 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #38bdf8;">Passenger Message</h3>
      <div style="background: #09101d; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 16px; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">{message}</div>

      <!-- Details Table -->
      <h3 style="margin: 24px 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;">Submission Context</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; width: 140px; border-bottom: 1px solid rgba(255,255,255,0.06);">Feedback Type</td>
          <td style="padding: 8px 0; color: #f8fafc; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.06);">{feedback_type}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">Passenger Name</td>
          <td style="padding: 8px 0; color: #f8fafc; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.06);">{name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">Passenger Email</td>
          <td style="padding: 8px 0; color: #38bdf8; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.06);">{email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">Train Number</td>
          <td style="padding: 8px 0; color: #f8fafc; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.06);">{train_no}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">Journey Date</td>
          <td style="padding: 8px 0; color: #f8fafc; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.06);">{journey_date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">Boarding Station</td>
          <td style="padding: 8px 0; color: #f8fafc; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.06);">{boarding_station}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Submitted At</td>
          <td style="padding: 8px 0; color: #94a3b8;">{submitted_at}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background: #09101d; padding: 16px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748b;">
      SETU — Bridging Every Journey Together • High-Performance Railway Telemetry
    </div>

  </div>
</body>
</html>
"""

async def _send_via_resend(subject: str, text: str, html: str, reply_to: Optional[str]) -> Dict[str, Any]:
    api_key = EMAIL_API_KEY
    if not api_key:
        raise EmailConfigurationError("RESEND_API_KEY or EMAIL_API_KEY is not set.")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "from": EMAIL_FROM,
        "to": [FEEDBACK_DESTINATION_EMAIL],
        "subject": subject,
        "text": text,
        "html": html,
    }
    if reply_to and "@" in reply_to:
        payload["reply_to"] = reply_to

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post("https://api.resend.com/emails", headers=headers, json=payload)
        if res.status_code in [200, 201]:
            resp_data = res.json()
            return {"provider": "resend", "delivery_id": resp_data.get("id")}
        
        error_detail = res.text
        try:
            error_detail = res.json().get("message", res.text)
        except Exception:
            pass
        raise EmailDeliveryError(f"Resend API error (HTTP {res.status_code}): {error_detail}")

async def _send_via_brevo(subject: str, text: str, html: str, reply_to: Optional[str]) -> Dict[str, Any]:
    api_key = BREVO_API_KEY or EMAIL_API_KEY
    if not api_key:
        raise EmailConfigurationError("BREVO_API_KEY is not set.")
    
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    payload = {
        "sender": {"name": "SETU Railways", "email": "notifications@seturailways.in"},
        "to": [{"email": FEEDBACK_DESTINATION_EMAIL, "name": "SETU Admin"}],
        "subject": subject,
        "textContent": text,
        "htmlContent": html,
    }
    if reply_to and "@" in reply_to:
        payload["replyTo"] = {"email": reply_to}

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post("https://api.brevo.com/v3/smtp/email", headers=headers, json=payload)
        if res.status_code in [200, 201, 202]:
            resp_data = res.json()
            return {"provider": "brevo", "delivery_id": resp_data.get("messageId")}
        
        raise EmailDeliveryError(f"Brevo API error (HTTP {res.status_code}): {res.text}")

async def _send_via_sendgrid(subject: str, text: str, html: str, reply_to: Optional[str]) -> Dict[str, Any]:
    api_key = SENDGRID_API_KEY or EMAIL_API_KEY
    if not api_key:
        raise EmailConfigurationError("SENDGRID_API_KEY is not set.")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "personalizations": [{
            "to": [{"email": FEEDBACK_DESTINATION_EMAIL}],
            "subject": subject
        }],
        "from": {"email": "feedback@seturailways.in", "name": "SETU Feedback"},
        "content": [
            {"type": "text/plain", "value": text},
            {"type": "text/html", "value": html}
        ]
    }
    if reply_to and "@" in reply_to:
        payload["reply_to"] = {"email": reply_to}

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post("https://api.sendgrid.com/v3/mail/send", headers=headers, json=payload)
        if res.status_code in [200, 202]:
            return {"provider": "sendgrid", "delivery_id": res.headers.get("X-Message-Id")}
        
        raise EmailDeliveryError(f"SendGrid API error (HTTP {res.status_code}): {res.text}")

def _send_via_smtp_sync(subject: str, text: str, html: str, reply_to: Optional[str]) -> Dict[str, Any]:
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        raise EmailConfigurationError("SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be set for SMTP delivery.")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"SETU Feedback <{SMTP_USER}>"
    msg["To"] = FEEDBACK_DESTINATION_EMAIL
    if reply_to and "@" in reply_to:
        msg["Reply-To"] = reply_to

    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    context = ssl.create_default_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        server.ehlo()
        if SMTP_PORT != 465:
            server.starttls(context=context)
            server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, [FEEDBACK_DESTINATION_EMAIL], msg.as_string())

    return {"provider": "smtp", "delivery_id": f"smtp-{int(datetime.now().timestamp())}"}

async def dispatch_feedback_email(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main dispatch entrypoint for sending feedback emails to FEEDBACK_DESTINATION_EMAIL.
    Automatically detects active provider and executes delivery.
    """
    # Reload env files in case backend/.env was recently updated
    _load_env_file(os.path.join(_current_dir, ".env"))
    _load_env_file(os.path.join(os.path.dirname(_current_dir), ".env"))

    active_provider = _get_active_provider()
    subject = _build_email_subject(data)
    plain_text = _build_plain_text_body(data)
    html_content = _build_html_body(data)
    user_email = data.get("email")

    print(f"[email_service] Initiating feedback email dispatch via '{active_provider}' to '{FEEDBACK_DESTINATION_EMAIL}'...")

    if active_provider == "resend":
        return await _send_via_resend(subject, plain_text, html_content, user_email)
    elif active_provider == "brevo":
        return await _send_via_brevo(subject, plain_text, html_content, user_email)
    elif active_provider == "sendgrid":
        return await _send_via_sendgrid(subject, plain_text, html_content, user_email)
    elif active_provider == "smtp":
        import asyncio
        return await asyncio.to_thread(_send_via_smtp_sync, subject, plain_text, html_content, user_email)
    else:
        raise EmailConfigurationError(
            "No email provider or credentials configured in backend/.env. "
            "Please set FEEDBACK_EMAIL and EMAIL_API_KEY (for Resend, Brevo, SendGrid) or SMTP credentials."
        )
