from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, LargeBinary
from sqlalchemy.dialects.mysql import MEDIUMBLOB
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    dob = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)

    # Stored directly as binary MEDIUMBLOB in MySQL
    profile_photo = Column(LargeBinary().with_variant(MEDIUMBLOB, "mysql"), nullable=True)

    email = Column(String(150), nullable=False, unique=True, index=True)
    phone = Column(String(15), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)

    college = Column(String(200), nullable=False)
    course = Column(String(100), nullable=False)
    branch = Column(String(150), nullable=False)
    semester = Column(Integer, nullable=False)
    admission_year = Column(Integer, nullable=False)

    # Secure hashed password (never plain text)
    password_hash = Column(String(255), nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<Student(id={self.id}, name='{self.full_name}', email='{self.email}')>"
