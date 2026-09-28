import re
from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.crud import (
    get_student_by_email,
    get_student_by_id,
    get_students as list_students_crud,
    create_student,
    hash_password,
)
from app.schemas import StudentResponse
from app.routes.photos import validate_and_process_image_bytes

router = APIRouter(prefix="/api/students", tags=["students"])

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
PHONE_REGEX = re.compile(r"^\+?[0-9\s\-]{10,15}$")

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student with multipart/form-data text fields and binary profile photo",
)
async def register_student(
    full_name: str = Form(..., description="Student full name"),
    dob: str = Form(..., description="Date of birth in YYYY-MM-DD format"),
    gender: str = Form(..., description="Gender"),
    email: str = Form(..., description="Unique email address"),
    phone: str = Form(..., description="Contact phone number"),
    address: str = Form(..., description="Street address"),
    city: str = Form(..., description="City"),
    state: str = Form(..., description="State"),
    pincode: str = Form(..., description="Postal code"),
    college: str = Form(..., description="College or university name"),
    course: str = Form(..., description="Degree course"),
    branch: str = Form(..., description="Branch or specialization"),
    semester: int = Form(..., ge=1, le=12, description="Current semester"),
    admission_year: int = Form(..., ge=2000, le=2100, description="Admission year"),
    password: str = Form(..., min_length=8, description="Account password"),
    profile_photo: Optional[UploadFile] = File(None, description="Optional portrait profile photo"),
    db: Session = Depends(get_db),
):
    """
    Registers a student.
    - Validates all textual fields
    - Validates uniqueness of email (409 if duplicate)
    - Validates and processes the profile photo with Pillow (size, format, resolution, portrait orientation)
    - Hashes password with bcrypt (plain password and confirm password are never stored)
    - Stores the binary image directly in MySQL MEDIUMBLOB
    """
    # 1. Textual Field Validations
    clean_name = full_name.strip()
    if len(clean_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name must be at least 2 characters long."
        )

    clean_email = email.strip().lower()
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address format."
        )

    # Check for duplicate email (409 Conflict)
    existing_student = get_student_by_email(db, clean_email)
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{clean_email}' is already registered. Please sign in or use another email."
        )

    clean_phone = phone.strip()
    digits_only = re.sub(r"\D", "", clean_phone)
    if len(digits_only) < 10 or len(digits_only) > 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number must contain between 10 and 15 digits."
        )

    clean_pincode = pincode.strip()
    if len(clean_pincode) < 3 or len(clean_pincode) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid postal code / pincode."
        )

    # Parse date of birth (support ISO YYYY-MM-DD and locale formatted inputs)
    try:
        parsed_dob = date.fromisoformat(dob.strip())
    except ValueError:
        try:
            from dateutil.parser import parse as parse_date
            parsed_dob = parse_date(dob.strip()).date()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date of birth format. Expected YYYY-MM-DD."
            )

    # Password validation
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )

    # 2. Profile Photo Validation (Pillow)
    photo_bytes: Optional[bytes] = None
    if profile_photo and profile_photo.filename:
        raw_bytes = await profile_photo.read()
        if len(raw_bytes) > 0:
            validated_bytes, _ = validate_and_process_image_bytes(raw_bytes, profile_photo.filename)
            photo_bytes = validated_bytes

    # 3. Hash Password
    hashed = hash_password(password)

    # 4. Construct Data Dict and Insert into MySQL
    student_data = {
        "full_name": clean_name,
        "dob": parsed_dob,
        "gender": gender.strip(),
        "email": clean_email,
        "phone": clean_phone,
        "address": address.strip(),
        "city": city.strip(),
        "state": state.strip(),
        "pincode": clean_pincode,
        "college": college.strip(),
        "course": course.strip(),
        "branch": branch.strip(),
        "semester": semester,
        "admission_year": admission_year,
    }

    try:
        new_student = create_student(
            db=db,
            student_dict=student_data,
            password_hash=hashed,
            profile_photo_bytes=photo_bytes,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while creating student record: {str(e)}"
        )

    # Return sanitized student profile (NEVER include password or password_hash)
    response_dto = StudentResponse(
        id=new_student.id,
        full_name=new_student.full_name,
        dob=new_student.dob,
        gender=new_student.gender,
        email=new_student.email,
        phone=new_student.phone,
        address=new_student.address,
        city=new_student.city,
        state=new_student.state,
        pincode=new_student.pincode,
        college=new_student.college,
        course=new_student.course,
        branch=new_student.branch,
        semester=new_student.semester,
        admission_year=new_student.admission_year,
        has_photo=bool(new_student.profile_photo),
        created_at=new_student.created_at,
    )

    return {
        "message": "Student registration completed successfully.",
        "student": response_dto,
    }


@router.get("/{student_id}", response_model=StudentResponse, summary="Get student details by ID")
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Fetches student profile data (excluding password hash)."""
    student = get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    return StudentResponse(
        id=student.id,
        full_name=student.full_name,
        dob=student.dob,
        gender=student.gender,
        email=student.email,
        phone=student.phone,
        address=student.address,
        city=student.city,
        state=student.state,
        pincode=student.pincode,
        college=student.college,
        course=student.course,
        branch=student.branch,
        semester=student.semester,
        admission_year=student.admission_year,
        has_photo=bool(student.profile_photo),
        created_at=student.created_at,
    )


@router.get("", response_model=List[StudentResponse], summary="List all registered students")
def list_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieves paginated list of registered students."""
    students = list_students_crud(db, skip=skip, limit=limit)
    return [
        StudentResponse(
            id=s.id,
            full_name=s.full_name,
            dob=s.dob,
            gender=s.gender,
            email=s.email,
            phone=s.phone,
            address=s.address,
            city=s.city,
            state=s.state,
            pincode=s.pincode,
            college=s.college,
            course=s.course,
            branch=s.branch,
            semester=s.semester,
            admission_year=s.admission_year,
            has_photo=bool(s.profile_photo),
            created_at=s.created_at,
        )
        for s in students
    ]
