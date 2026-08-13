import smtplib
import os
import logging
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from email.utils import formatdate, make_msgid
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn.error")


import asyncio

def _send_email_blocking(
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None
):
    sender_name = os.getenv("MAIL_FROM_NAME", "Legal-Tech")
    sender_addr = os.getenv("MAIL_USERNAME")
    password    = os.getenv("MAIL_PASSWORD")
    smtp_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    smtp_port   = int(os.getenv("MAIL_PORT", 587))

    msg = MIMEMultipart("alternative")

    # ── Core headers ─────────────────────────────────────────
    msg["From"]       = f"{sender_name} <{sender_addr}>"
    msg["To"]         = to_email
    msg["Subject"]    = subject
    msg["Date"]       = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain=sender_addr.split("@")[-1])

    # ── Anti-spam / deliverability headers ───────────────────
    msg["Reply-To"]         = f"{sender_name} <{sender_addr}>"
    msg["X-Mailer"]         = "Legal-Tech Platform v2.0"
    msg["Precedence"]       = "transactional"
    msg["X-Priority"]       = "1"
    msg["Importance"]       = "High"
    msg["X-Entity-Ref-ID"]  = str(uuid.uuid4())   # unique per email
    msg["MIME-Version"]     = "1.0"

    # ── Plain-text fallback ──────────────────────────────────
    plain_text = (
        f"Legal-Tech Security Notification\n\n"
        f"You have received an automated notification from Legal-Tech.\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"Sent by Legal-Tech Platform — {sender_addr}"
    )
    msg.attach(MIMEText(plain_text, "plain", "utf-8"))

    # ── HTML body ─────────────────────────────────────────────
    msg.attach(MIMEText(body, "html", "utf-8"))

    # ── Optional attachment ───────────────────────────────────
    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
        encoders.encode_base64(part)
        filename = os.path.basename(attachment_path)
        part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
        msg.attach(part)

    # ── Send via STARTTLS ─────────────────────────────────────
    with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender_addr, password)
        server.sendmail(sender_addr, [to_email], msg.as_bytes())

    print(f"[EMAIL SUCCESS] Sent to '{to_email}' | Subject: '{subject}'")


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None
):
    """
    Send an HTML email using smtplib with proper RFC headers,
    run in a separate thread so it doesn't block the async loop.
    """
    try:
        await asyncio.to_thread(_send_email_blocking, to_email, subject, body, attachment_path)
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to '{to_email}': {type(e).__name__}: {e}")
        logger.error(f"Email delivery error to {to_email}: {e}")
        raise   # re-raise so caller can handle / log the OTP fallback


def send_email_sync(
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None
):
    """Synchronous version with the same anti-spam headers."""
    try:
        sender_name = os.getenv("MAIL_FROM_NAME", "Legal-Tech")
        sender_addr = os.getenv("MAIL_USERNAME")
        password    = os.getenv("MAIL_PASSWORD")
        smtp_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
        smtp_port   = int(os.getenv("MAIL_PORT", 587))

        msg = MIMEMultipart("alternative")
        msg["From"]       = f"{sender_name} <{sender_addr}>"
        msg["To"]         = to_email
        msg["Subject"]    = subject
        msg["Date"]       = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain=sender_addr.split("@")[-1])
        msg["Reply-To"]   = f"{sender_name} <{sender_addr}>"
        msg["X-Mailer"]   = "Legal-Tech Platform v2.0"
        msg["Precedence"] = "transactional"
        msg["X-Priority"] = "1"
        msg["Importance"] = "High"
        msg["X-Entity-Ref-ID"] = str(uuid.uuid4())

        plain_text = (
            "Legal-Tech Security Notification\n\n"
            "You have received an automated notification from Legal-Tech.\n"
            "If you did not request this, please ignore this email.\n\n"
            f"Sent by Legal-Tech Platform — {sender_addr}"
        )
        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(body, "html", "utf-8"))

        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, "rb") as f:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(f.read())
            encoders.encode_base64(part)
            filename = os.path.basename(attachment_path)
            part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
            msg.attach(part)

        with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(sender_addr, password)
            server.sendmail(sender_addr, [to_email], msg.as_bytes())

        print(f"[EMAIL SYNC SUCCESS] Sent to '{to_email}' | Subject: '{subject}'")
        return True
    except Exception as e:
        print(f"[EMAIL SYNC ERROR] Failed to send to '{to_email}': {type(e).__name__}: {e}")
        logger.error(f"Email delivery error to {to_email}: {e}")
        return False