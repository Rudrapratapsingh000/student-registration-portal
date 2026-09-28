import os
from pathlib import Path
from dotenv import load_dotenv

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env if present
env_path = BASE_DIR / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# Database settings
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./student_portal.db"
).strip()

# Server settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

# CORS settings
ALLOWED_ORIGINS_RAW = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
)
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]

# Profile Photo Validation Rules
MAX_IMAGE_SIZE_BYTES = 600 * 1024  # 600 KB
ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"]
MIN_IMAGE_WIDTH = 200
MIN_IMAGE_HEIGHT = 260
MAX_IMAGE_WIDTH = 530
MAX_IMAGE_HEIGHT = 690
