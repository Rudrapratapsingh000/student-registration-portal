import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

import uuid
from app.models import Student
from app.database import SessionLocal, Base, engine

client = TestClient(app)

@pytest.fixture(scope="function", autouse=True)
def clean_db():
    """Ensure clean database state before each test."""
    init_db()
    db = SessionLocal()
    try:
        db.query(Student).delete()
        db.commit()
    finally:
        db.close()
    yield

def create_test_image(width=400, height=520, format="JPEG", size_kb=None):
    """Generates an in-memory image for testing."""
    img = Image.new("RGB", (width, height), color=(59, 130, 246))
    buf = io.BytesIO()
    img.save(buf, format=format)
    data = buf.getvalue()
    if size_kb:
        # Pad data if required
        padding_needed = (size_kb * 1024) - len(data)
        if padding_needed > 0:
            data += b"\x00" * padding_needed
    return data

def test_health_endpoint():
    """Test 4: /api/health works."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "ok")
    assert data["database_connected"] is True

def test_valid_registration_with_photo():
    """Test 6, 14, 15, 16, 17: Valid registration with binary photo stored as MEDIUMBLOB."""
    photo_data = create_test_image(width=400, height=500, format="JPEG")

    payload = {
        "full_name": "Elena Rostova",
        "dob": "2004-05-15",
        "gender": "female",
        "email": "elena.rostova@dbsuniversity.edu",
        "phone": "+1-555-019-2834",
        "address": "452 Academic Boulevard, Suite 3B",
        "city": "San Francisco",
        "state": "california",
        "pincode": "94107",
        "college": "DBS Global University",
        "course": "btech",
        "branch": "cs",
        "semester": "3",
        "admission_year": "2024",
        "password": "SecurePassword123!",
    }

    files = {
        "profile_photo": ("elena.jpg", photo_data, "image/jpeg"),
    }

    response = client.post("/api/students/register", data=payload, files=files)
    assert response.status_code == 201, response.text
    result = response.json()
    assert "student" in result
    student = result["student"]
    assert student["email"] == "elena.rostova@dbsuniversity.edu"
    assert student["has_photo"] is True
    assert "password" not in student
    assert "password_hash" not in student

    student_id = student["id"]

    # Verify student photo retrieval from MySQL MEDIUMBLOB
    photo_response = client.get(f"/api/students/{student_id}/photo")
    assert photo_response.status_code == 200
    assert photo_response.headers["content-type"] in ("image/jpeg", "image/jpg")
    assert len(photo_response.content) == len(photo_data)
    assert photo_response.content == photo_data

def test_duplicate_email_rejected():
    """Test 7: Duplicate email is rejected with 409 Conflict."""
    payload = {
        "full_name": "First User",
        "dob": "2003-01-01",
        "gender": "male",
        "email": "unique.student@dbsuniversity.edu",
        "phone": "9876543210",
        "address": "123 Main St",
        "city": "San Francisco",
        "state": "california",
        "pincode": "94107",
        "college": "DBS Global University",
        "course": "btech",
        "branch": "cs",
        "semester": "1",
        "admission_year": "2025",
        "password": "Password123!",
    }
    # Initial registration succeeds
    resp1 = client.post("/api/students/register", data=payload)
    assert resp1.status_code == 201

    # Second registration with identical email must be rejected with 409
    resp2 = client.post("/api/students/register", data=payload)
    assert resp2.status_code == 409
    assert "already registered" in resp2.json()["detail"].lower()

def test_invalid_email_rejected():
    """Test 9: Invalid email format is rejected with 400 Bad Request."""
    payload = {
        "full_name": "Test User",
        "dob": "2003-01-01",
        "gender": "male",
        "email": "not-an-email",
        "phone": "9876543210",
        "address": "123 Main St",
        "city": "Boston",
        "state": "massachusetts",
        "pincode": "02108",
        "college": "DBS Global University",
        "course": "btech",
        "branch": "cs",
        "semester": "1",
        "admission_year": "2025",
        "password": "Password123!",
    }
    response = client.post("/api/students/register", data=payload)
    assert response.status_code == 400
    assert "email" in response.json()["detail"].lower()

def test_invalid_phone_rejected():
    """Test 10: Invalid phone is rejected with 400 Bad Request."""
    payload = {
        "full_name": "Test User",
        "dob": "2003-01-01",
        "gender": "male",
        "email": "valid.user@dbsuniversity.edu",
        "phone": "123",  # Too short (<10 digits)
        "address": "123 Main St",
        "city": "Boston",
        "state": "massachusetts",
        "pincode": "02108",
        "college": "DBS Global University",
        "course": "btech",
        "branch": "cs",
        "semester": "1",
        "admission_year": "2025",
        "password": "Password123!",
    }
    response = client.post("/api/students/register", data=payload)
    assert response.status_code == 400
    assert "phone" in response.json()["detail"].lower()

def test_oversized_photo_rejected():
    """Test 11: Oversized photo (>600 KB) is rejected with 413 Payload Too Large."""
    oversized_data = create_test_image(width=400, height=520, size_kb=650)
    assert len(oversized_data) > 600 * 1024

    payload = {
        "full_name": "Oversized Photo Test",
        "dob": "2003-01-01",
        "gender": "male",
        "email": "oversized@dbsuniversity.edu",
        "phone": "9876543210",
        "address": "123 Main St",
        "city": "Austin",
        "state": "texas",
        "pincode": "73301",
        "college": "DBS Global University",
        "course": "btech",
        "branch": "cs",
        "semester": "1",
        "admission_year": "2025",
        "password": "Password123!",
    }
    files = {
        "profile_photo": ("large.jpg", oversized_data, "image/jpeg"),
    }
    response = client.post("/api/students/register", data=payload, files=files)
    assert response.status_code == 413
    assert "600 kb" in response.json()["detail"].lower()

def test_invalid_photo_format_rejected():
    """Test 12: Invalid photo format is rejected with 415 Unsupported Media Type."""
    fake_photo_data = b"This is a text file posing as an image"

    payload = {
        "full_name": "Format Test",
        "dob": "2003-01-01",
        "gender": "female",
        "email": "format.test@dbsuniversity.edu",
        "phone": "9876543210",
        "address": "123 Main St",
        "city": "Austin",
        "state": "texas",
        "pincode": "73301",
        "college": "DBS Global University",
        "course": "btech",
        "branch": "cs",
        "semester": "1",
        "admission_year": "2025",
        "password": "Password123!",
    }
    files = {
        "profile_photo": ("bad_format.pdf", fake_photo_data, "application/pdf"),
    }
    response = client.post("/api/students/register", data=payload, files=files)
    assert response.status_code == 415

def test_invalid_dimensions_rejected():
    """Test 13: Invalid photo dimensions (<200x260 or >530x690) are rejected with 422."""
    # Too small: 150 x 200
    tiny_data = create_test_image(width=150, height=200, format="JPEG")

    payload = {
        "full_name": "Tiny Dimension Test",
        "dob": "2003-01-01",
        "gender": "female",
        "email": "tiny@dbsuniversity.edu",
        "phone": "9876543210",
        "address": "123 Main St",
        "city": "Seattle",
        "state": "washington",
        "pincode": "98101",
        "college": "DBS Global University",
        "course": "btech",
        "branch": "cs",
        "semester": "1",
        "admission_year": "2025",
        "password": "Password123!",
    }
    files = {
        "profile_photo": ("tiny.jpg", tiny_data, "image/jpeg"),
    }
    response = client.post("/api/students/register", data=payload, files=files)
    assert response.status_code == 422
    assert "too small" in response.json()["detail"].lower()

def test_landscape_orientation_rejected():
    """Test landscape orientation (width > height) rejected with 422."""
    # Landscape: 500 wide x 350 high
    landscape_data = create_test_image(width=500, height=350, format="JPEG")

    payload = {
        "full_name": "Landscape Test",
        "dob": "2003-01-01",
        "gender": "male",
        "email": "landscape@dbsuniversity.edu",
        "phone": "9876543210",
        "address": "123 Main St",
        "city": "Chicago",
        "state": "illinois",
        "pincode": "60601",
        "college": "DBS Global University",
        "course": "btech",
        "branch": "cs",
        "semester": "1",
        "admission_year": "2025",
        "password": "Password123!",
    }
    files = {
        "profile_photo": ("landscape.jpg", landscape_data, "image/jpeg"),
    }
    response = client.post("/api/students/register", data=payload, files=files)
    assert response.status_code == 422
    assert "portrait" in response.json()["detail"].lower()

def test_get_student_by_id():
    """Test retrieving student record by primary key."""
    payload = {
        "full_name": "Query Test Student",
        "dob": "2002-11-20",
        "gender": "other",
        "email": "query.student@dbsuniversity.edu",
        "phone": "9876543210",
        "address": "789 Campus Way",
        "city": "Chicago",
        "state": "illinois",
        "pincode": "60601",
        "college": "DBS Global University",
        "course": "mba",
        "branch": "ds",
        "semester": "1",
        "admission_year": "2025",
        "password": "Password123!",
    }
    reg_resp = client.post("/api/students/register", data=payload)
    assert reg_resp.status_code == 201
    created_id = reg_resp.json()["student"]["id"]

    single_resp = client.get(f"/api/students/{created_id}")
    assert single_resp.status_code == 200
    assert single_resp.json()["id"] == created_id
    assert single_resp.json()["email"] == "query.student@dbsuniversity.edu"
    assert "password" not in single_resp.json()
    assert "password_hash" not in single_resp.json()
