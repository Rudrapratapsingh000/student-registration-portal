import io
from typing import Tuple
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from PIL import Image

from app.database import get_db
from app.crud import get_student_photo_bytes, get_student_by_id
from app.config import (
    MAX_IMAGE_SIZE_BYTES,
    MIN_IMAGE_WIDTH,
    MIN_IMAGE_HEIGHT,
    MAX_IMAGE_WIDTH,
    MAX_IMAGE_HEIGHT,
)

router = APIRouter(prefix="/api/students", tags=["photos"])

def validate_and_process_image_bytes(image_bytes: bytes, filename: str = "photo.jpg") -> Tuple[bytes, str]:
    """
    Validates and inspects an image according to institutional portal standards using Pillow.
    Returns: (image_bytes, media_type)
    """
    # 1. File Size check (<= 600 KB)
    size_bytes = len(image_bytes)
    if size_bytes > MAX_IMAGE_SIZE_BYTES:
        size_kb = round(size_bytes / 1024, 1)
        raise HTTPException(
            status_code=413,
            detail=f"File size is too large ({size_kb} KB). Maximum allowed size is 600 KB."
        )

    # 2. Inspect with Pillow
    try:
        image_stream = io.BytesIO(image_bytes)
        img = Image.open(image_stream)
        img.verify()  # Verify image integrity
    except Exception:
        raise HTTPException(
            status_code=415,
            detail="Unsupported or corrupt image format. Please upload a valid JPG, JPEG, or PNG file."
        )

    # Re-open after verify() which closes/consumes stream
    image_stream.seek(0)
    img = Image.open(image_stream)

    # Check format
    img_format = (img.format or "").upper()
    if img_format not in ("JPEG", "JPG", "PNG"):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image format: {img_format}. Allowed formats are JPG, JPEG, and PNG."
        )

    width, height = img.size

    # 3. Minimum resolution check (200 x 260)
    if width < MIN_IMAGE_WIDTH or height < MIN_IMAGE_HEIGHT:
        raise HTTPException(
            status_code=422,
            detail=f"Image resolution ({width}×{height} px) is too small. Minimum allowed is {MIN_IMAGE_WIDTH}×{MIN_IMAGE_HEIGHT} px."
        )

    # 4. Maximum resolution check (530 x 690)
    if width > MAX_IMAGE_WIDTH or height > MAX_IMAGE_HEIGHT:
        raise HTTPException(
            status_code=422,
            detail=f"Image resolution ({width}×{height} px) is too large. Maximum allowed is {MAX_IMAGE_WIDTH}×{MAX_IMAGE_HEIGHT} px."
        )

    # 5. Orientation check (Portrait: height >= width)
    if height < width:
        raise HTTPException(
            status_code=422,
            detail="Please upload a portrait-oriented photograph (height must be greater than or equal to width)."
        )

    media_type = "image/png" if img_format == "PNG" else "image/jpeg"
    return image_bytes, media_type


@router.get("/{student_id}/photo", summary="Retrieve student profile photograph from MySQL MEDIUMBLOB")
def get_photo(student_id: int, db: Session = Depends(get_db)):
    """
    Retrieves the raw MEDIUMBLOB from MySQL and streams it with the appropriate media type.
    Flow: MySQL MEDIUMBLOB -> SQLAlchemy -> FastAPI -> Browser -> Student photograph
    """
    student = get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    photo_bytes = get_student_photo_bytes(db, student_id)
    if not photo_bytes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student has no profile photograph")

    # Detect media type from magic bytes
    if photo_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        media_type = "image/png"
    elif photo_bytes.startswith(b"\xff\xd8"):
        media_type = "image/jpeg"
    else:
        media_type = "image/jpeg"

    return Response(
        content=photo_bytes,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": f'inline; filename="student_{student_id}_photo.jpg"',
        },
    )
