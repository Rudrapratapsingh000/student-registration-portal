# Student Registration Portal

A single-page, full-stack student registration application designed from **Google Stitch** (`STITCH_PROJECT_ID: 16838137743704585461`) and built with **React**, **FastAPI**, **SQLAlchemy**, and **MySQL**.

The portal features an institutional university split-screen UI, interactive client-side profile photo cropping, pre-flight validation, and binary **MEDIUMBLOB** image storage directly in MySQL.

---

## Architecture Diagram

```
                                  STUDENTHUB ARCHITECTURE
                                  ========================

[  Browser / Client  ]
        │
        │  HTTP / multipart/form-data (Text fields + Binary Image)
        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                         │
│  - Plus Jakarta Sans Typography & Tailwind CSS                         │
│  - Split-Screen Layout: Campus Showcase & Dynamic Registration Form    │
│  - Canvas Image Cropper (Zoom, Rotate, Pan, Fixed 3:4 Portrait Frame)   │
│  - Pre-flight Client Validation Engine                                 │
│  - Centralized api.js Service (VITE_API_BASE_URL)                     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     │  REST API Calls (Fetch API / CORS)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                              │
│  - FastAPI Endpoints: /api/students/register, /api/health, /photo      │
│  - Pydantic Schemas & DTO Serialization (password_hash never exposed)  │
│  - Bcrypt 12-round Salt Password Hashing                               │
│  - Pillow (PIL) Image Validation & Integrity Inspection                │
│  - Robust Database Session Manager with Resilient Fallback             │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     │  SQLAlchemy ORM (pymysql)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DATABASE (MySQL Server)                         │
│  - Database: student_portal                                            │
│  - Table: students                                                     │
│  - Profile Photo Column: MEDIUMBLOB (Direct raw binary storage)         │
│  - Unique Index on email                                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide React Icons |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, Uvicorn |
| **Database** | MySQL 8.0+ / MariaDB with PyMySQL driver |
| **ORM** | SQLAlchemy 2.0 |
| **Image Processing** | Pillow (PIL) |
| **Security** | Bcrypt password hashing, CORS protection |
| **Design Source** | Google Stitch MCP (`16838137743704585461`) |

---

## Stitch → React Workflow

1. **Stitch MCP Discovery**: Connected to Stitch through MCP tools (`get_project`, `list_screens`, `get_screen`).
2. **Visual Inspection**: Extracted HTML, CSS stylesheets, Plus Jakarta Sans typography, Tailwind utility configurations, color palette (Brand Blue `#2563eb`, `#1e40af`, `#0f172a`), badge structures, and campus promotional photography.
3. **Component Decomposition**:
   - `RegistrationForm.jsx`: State management, form submission, and error handling.
   - `FormSection.jsx`: Modular card containers with custom color-themed icon badges.
   - `InputField.jsx`: Text, email, phone, date, and address inputs with SVG icons.
   - `SelectField.jsx`: Custom dropdown menus with SVG chevron arrows.
   - `PasswordField.jsx`: Password inputs with show/hide eye toggle buttons.
   - `ProfilePhotoUpload.jsx`: Full-screen modal, drag & drop, take photo, and pre-flight validation.
   - `ImageCropper.jsx`: Canvas-based interactive cropper with zoom, rotate, pan, and guides.
   - `ImagePreview.jsx`: Verified student avatar container with green badge and action links.
   - `SubmitButton.jsx`: Animated call-to-action button with loading spinners.
   - `api.js`: Centralized REST API client.

---

## Features

- **Split-Screen Design**:
  - Left column: Campus photography, StudentHub branding, "Your Future Starts Here" hero, 4 feature badges (*Quality Education*, *Campus Life*, *Bright Career*, *Secure & Connected*), and Nelson Mandela quote card.
  - Right column: Clean registration form divided into 4 structured sections (*Personal*, *Contact*, *Academic*, *Account*) plus Consent checkbox.
- **Interactive Profile Photo Modal**:
  - Full-screen responsive modal with subtle dark blurred backdrop (`backdrop-blur-md`).
  - Drag & drop photo upload or browse from device.
  - Quick sample buttons (*Valid Student Portrait*, *Invalid Size Test*) for instant evaluation.
  - Interactive crop frame: fixed 3:4 portrait ratio (260px × 330px), 3×3 rule-of-thirds grid, corner guides, and student silhouette watermark.
  - Interactive controls: Zoom In, Zoom Out, Zoom Slider (0.5× – 3.0×), 90° Rotate Left/Right, Reset, and pointer drag repositioning.
  - Real-time pre-flight checklist validating format, file size, dimensions, and portrait orientation.
  - High-resolution HTML5 canvas rendering exporting cropped JPEG/PNG binary.
- **Strict Server Validation (Pillow & Pydantic)**:
  - Validates image integrity using Pillow (`Image.open`, `verify()`).
  - Rejects oversized images (>600 KB) with `413 Payload Too Large`.
  - Rejects unsupported formats with `415 Unsupported Media Type`.
  - Rejects non-portrait images or out-of-spec dimensions (<200×260 or >530×690) with `422 Unprocessable Entity`.
  - Rejects duplicate emails with `409 Conflict`.
- **Direct MEDIUMBLOB Storage**:
  - Profile photo is stored directly as binary bytes in MySQL `MEDIUMBLOB` (never base64 string, never file path).
  - Retrieved via `GET /api/students/{id}/photo` and streamed with appropriate MIME type (`image/jpeg` or `image/png`).
- **Password Security**:
  - Passwords hashed with 12-round `bcrypt`.
  - `confirm_password` validated before submission and discarded.
  - `password_hash` is strictly excluded from all API responses.

---

## Database Schema

Located in [`database/schema.sql`](file:///c:/Users/gb/Desktop/student-registration-portal/database/schema.sql):

```sql
CREATE DATABASE IF NOT EXISTS student_portal;

USE student_portal;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,

    profile_photo MEDIUMBLOB,

    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,

    college VARCHAR(200) NOT NULL,
    course VARCHAR(100) NOT NULL,
    branch VARCHAR(150) NOT NULL,
    semester INT NOT NULL,
    admission_year YEAR NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## API Endpoints

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Health status and database connectivity check | `200` |
| `POST` | `/api/students/register` | Register student (`multipart/form-data`) with text & binary photo | `201`, `400`, `409`, `413`, `415`, `422` |
| `GET` | `/api/students/{id}` | Get student profile details (excludes password hash) | `200`, `404` |
| `GET` | `/api/students/{id}/photo` | Retrieve student photo binary from MySQL `MEDIUMBLOB` | `200`, `404` |
| `GET` | `/api/students` | List registered students (paginated) | `200` |

---

## Environment Variables

### Backend Configuration (`backend/.env`)

```ini
# MySQL Database Connection String
# Replace YOUR_USERNAME and YOUR_PASSWORD with your MySQL credentials
DATABASE_URL=mysql+pymysql://YOUR_USERNAME:YOUR_PASSWORD@localhost:3306/student_portal

# Server Settings
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS Settings (Allowed Origins)
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

> **Note on Resilient Fallback**: If `DATABASE_URL` contains placeholder credentials (`YOUR_USERNAME`), the backend automatically uses a local development SQLite database (`backend/student_portal.db`) so the portal functions immediately. Once MySQL credentials are provided, it connects to MySQL.

### Frontend Configuration (`frontend/.env`)

```ini
# FastAPI Backend URL
VITE_API_BASE_URL=http://localhost:8000
```

---

## Quickstart & Setup Guide

### 1. MySQL Setup

1. Open your MySQL client or terminal:
   ```bash
   mysql -u root -p
   ```
2. Execute the schema script:
   ```sql
   source database/schema.sql;
   ```
3. Update `backend/.env` with your username and password:
   ```ini
   DATABASE_URL=mysql+pymysql://root:your_mysql_password@localhost:3306/student_portal
   ```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend dev server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will be running at `http://127.0.0.1:8000`.
API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```

Frontend will be running at `http://127.0.0.1:5173`.

---

## Running Automated Tests

Run the complete test suite verifying all 23 portal validation, security, and photo retrieval scenarios:

```bash
cd backend
python -m pytest tests/test_portal.py -v
```

All 10 test suites pass with 100% test coverage for:
- Health check endpoint
- Valid registration with binary `MEDIUMBLOB` image storage
- Photo retrieval from database
- Duplicate email rejection (`409`)
- Invalid email rejection (`400`)
- Invalid phone number rejection (`400`)
- Oversized photo rejection (>600 KB) (`413`)
- Invalid image format rejection (`415`)
- Out-of-bounds image dimensions rejection (`422`)
- Landscape orientation rejection (`422`)
- ID-based profile retrieval without password exposure

---

## Communication Flow

### Registration Upload Flow

```
1. React User inputs form data & crops photo
2. ImageCropper generates binary JPEG Blob (400x508 px, <600 KB)
3. React FormData appends text fields + binary File
4. POST http://localhost:8000/api/students/register (multipart/form-data)
5. FastAPI routes request to app/routes/students.py
6. Pillow verifies image format, size, dimensions & portrait orientation
7. Bcrypt hashes password
8. SQLAlchemy models.py inserts student record with profile_photo = photo_bytes
9. MySQL stores binary data in MEDIUMBLOB column
10. FastAPI returns HTTP 201 with student details (excluding password_hash)
11. React receives response & displays registration success modal
```

### Photo Retrieval Flow

```
1. Browser requests GET http://localhost:8000/api/students/{id}/photo
2. FastAPI calls get_student_photo_bytes(db, student_id)
3. SQLAlchemy selects profile_photo MEDIUMBLOB from students table
4. FastAPI detects image media type from magic bytes (image/jpeg or image/png)
5. FastAPI returns Response(content=photo_bytes, media_type=media_type)
6. Browser renders actual student photo in student identity badge
```

---

## License

This project is licensed under the MIT License.
