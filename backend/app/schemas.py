from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class StudentBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    dob: date
    gender: str = Field(..., min_length=1, max_length=20)
    email: str = Field(..., max_length=150)
    phone: str = Field(..., min_length=10, max_length=15)
    address: str = Field(..., min_length=3)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=3, max_length=10)
    college: str = Field(..., min_length=2, max_length=200)
    course: str = Field(..., min_length=2, max_length=100)
    branch: str = Field(..., min_length=2, max_length=150)
    semester: int = Field(..., ge=1, le=12)
    admission_year: int = Field(..., ge=2000, le=2100)

class StudentCreate(StudentBase):
    password: str = Field(..., min_length=8, max_length=128)

class StudentResponse(StudentBase):
    id: int
    has_photo: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class HealthResponse(BaseModel):
    status: str
    database_connected: bool
    database_engine: str
    timestamp: datetime

