import smtplib
from email.message import EmailMessage
from typing import Optional
from app.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_USE_TLS


def _send(msg: EmailMessage) -> None:
    if not SMTP_PASS:
        raise RuntimeError("SMTP_PASS is not configured")
    if SMTP_USE_TLS:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
    else:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)


def send_email(to_email: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    _send(msg)


def send_email_with_attachment(
    to_email: str,
    subject: str,
    body: str,
    attachment_content: str,
    attachment_filename: str,
    attachment_mime_subtype: str = "csv",
) -> None:
    """Send an email with a single text attachment (e.g. a CSV file)."""
    msg = EmailMessage()
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    msg.add_attachment(
        attachment_content.encode("utf-8"),
        maintype="text",
        subtype=attachment_mime_subtype,
        filename=attachment_filename,
    )
    _send(msg)


def send_verification_code(to_email: str, code: str, purpose: str) -> None:
    if purpose == "email_verify":
        subject = "Verify your email address"
        intro = "Use the verification code below to confirm your email address."
    else:
        subject = "Password reset verification code"
        intro = "Use the verification code below to reset your password."

    body = (
        f"{intro}\n\n"
        f"Verification code: {code}\n\n"
        "This code expires in 15 minutes. If you did not request this, you can ignore this email.\n"
    )
    send_email(to_email, subject, body)
