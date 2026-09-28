import bcrypt
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models import Student

def hash_password(password: str) -> str:
    """Securely hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_student_by_email(db: Session, email: str) -> Optional[Student]:
    """Retrieve a student by email address."""
    return db.query(Student).filter(Student.email == email.lower().strip()).first()

def get_student_by_id(db: Session, student_id: int) -> Optional[Student]:
    """Retrieve a student by primary key ID."""
    return db.query(Student).filter(Student.id == student_id).first()

def get_students(db: Session, skip: int = 0, limit: int = 100) -> List[Student]:
    """Retrieve a paginated list of students."""
    return db.query(Student).offset(skip).limit(limit).all()

def create_student(
    db: Session,
    student_dict: dict,
    password_hash: str,
    profile_photo_bytes: Optional[bytes] = None,
) -> Student:
    """
    Creates a new student record in MySQL.
    The profile photo is stored directly as binary data in the MEDIUMBLOB column.
    """
    # Remove password if present in dict
    student_dict.pop("password", None)
    student_dict.pop("confirm_password", None)
    student_dict.pop("profile_photo", None)

    student = Student(
        **student_dict,
        password_hash=password_hash,
        profile_photo=profile_photo_bytes,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

def get_student_photo_bytes(db: Session, student_id: int) -> Optional[bytes]:
    """
    Fetches the raw binary image data (MEDIUMBLOB) for a student.
    """
    result = db.query(Student.profile_photo).filter(Student.id == student_id).first()
    if result and result[0]:
        return result[0]
    return None
