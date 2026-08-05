from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logger = logging.getLogger("uvicorn.error")

mail_from = os.getenv("MAIL_FROM") or os.getenv("MAIL_USERNAME")
if mail_from == "yourgmail@gmail.com":
    mail_from = os.getenv("MAIL_USERNAME")

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=mail_from,
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Legal-Tech"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

async def send_email(
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None
):
    try:
        attachments = []
        if attachment_path and os.path.exists(attachment_path):
            attachments.append(attachment_path)

        message = MessageSchema(
            subject=subject,
            recipients=[to_email],
            body=body,
            subtype="html",
            attachments=attachments
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"[EMAIL SUCCESS] Sent email to '{to_email}' with subject '{subject}'")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to '{to_email}': {str(e)}")
        logger.error(f"Email delivery error to {to_email}: {str(e)}")

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

def send_email_sync(
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None
):
    try:
        msg = MIMEMultipart()
        sender_name = os.getenv("MAIL_FROM_NAME", "Legal-Tech")
        sender_addr = os.getenv("MAIL_USERNAME")
        msg['From'] = f"{sender_name} <{sender_addr}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, "rb") as f:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(f.read())
                encoders.encode_base64(part)
                filename = os.path.basename(attachment_path)
                part.add_header('Content-Disposition', f'attachment; filename="{filename}"')
                msg.attach(part)

        server = smtplib.SMTP(os.getenv("MAIL_SERVER", "smtp.gmail.com"), int(os.getenv("MAIL_PORT", 587)))
        server.starttls()
        server.login(os.getenv("MAIL_USERNAME"), os.getenv("MAIL_PASSWORD"))
        server.send_message(msg)
        server.quit()
        print(f"[EMAIL SYNC SUCCESS] Sent email to '{to_email}' with subject '{subject}'")
        return True
    except Exception as e:
        print(f"[EMAIL SYNC ERROR] Failed to send email to '{to_email}': {str(e)}")
        logger.error(f"Email delivery error to {to_email}: {str(e)}")
        return False