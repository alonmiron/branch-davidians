import secrets
from datetime import datetime, timedelta
import bcrypt
from sqlalchemy.orm import Session
from app.models.password_reset_code import PasswordResetCode
from app.models.user import User

OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 15
MAX_ATTEMPTS = 5


def _generate_code() -> str:
    return f"{secrets.randbelow(10 ** OTP_LENGTH):0{OTP_LENGTH}d}"


def _hash_code(code: str) -> str:
    return bcrypt.hashpw(code.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_hash(code: str, code_hash: str) -> bool:
    try:
        return bcrypt.checkpw(code.encode("utf-8"), code_hash.encode("utf-8"))
    except (ValueError, TypeError, Exception):
        return False


def create_reset_code(db: Session, user: User, purpose: str) -> str:
    """Create a new OTP code for user and purpose; returns plain code."""
    now = datetime.utcnow()
    db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id,
        PasswordResetCode.purpose == purpose,
        PasswordResetCode.used_at.is_(None),
    ).update({"used_at": now})

    code = _generate_code()
    code_hash = _hash_code(code)
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    record = PasswordResetCode(
        user_id=user.id,
        purpose=purpose,
        code_hash=code_hash,
        expires_at=expires_at,
        used_at=None,
        attempts=0,
    )
    db.add(record)
    db.commit()
    return code


def verify_reset_code(
    db: Session,
    user: User,
    code: str,
    purpose: str,
    consume: bool,
) -> bool:
    now = datetime.utcnow()
    record = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.purpose == purpose,
            PasswordResetCode.used_at.is_(None),
        )
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )
    if not record:
        return False
    if record.expires_at <= now:
        record.used_at = now
        db.commit()
        return False
    if record.attempts >= MAX_ATTEMPTS:
        record.used_at = now
        db.commit()
        return False

    if not _verify_hash(code, record.code_hash):
        record.attempts += 1
        db.commit()
        return False

    if consume:
        record.used_at = now
        db.commit()
    return True
