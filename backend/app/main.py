from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import ALLOWED_ORIGINS, DEBUG, DATABASE_URL
from app.database import get_db, init_db, engine, active_db_url
from app.routes import students, photos
from app.schemas import HealthResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    try:
        init_db()
    except Exception as e:
        print(f"[Startup Warning] Could not initialize database tables: {e}")
    yield
    # Shutdown logic (if any)

app = FastAPI(
    title="Student Registration Portal API",
    description="Full-stack student registration backend with MySQL MEDIUMBLOB storage and Pillow image processing.",
    version="1.0.0",
    debug=DEBUG,
    lifespan=lifespan,
)

# Configure CORS Middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler to prevent leaking raw traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import logging
    logging.exception(f"Unhandled exception on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later or contact support."},
    )

# Include Routers
app.include_router(students.router)
app.include_router(photos.router)

@app.get("/api/health", response_model=HealthResponse, summary="System & Database Health Check")
def health_check(db: Session = Depends(get_db)):
    """
    Checks backend service status and verifies database connectivity.
    """
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    engine_name = "MySQL (InnoDB)" if "mysql" in str(active_db_url).lower() else "SQLite (Fallback/Dev)"

    return HealthResponse(
        status="healthy" if db_ok else "database_disconnected",
        database_connected=db_ok,
        database_engine=engine_name,
        timestamp=datetime.now(timezone.utc),
    )

@app.get("/", summary="Root index")
def root():
    return {
        "portal": "StudentHub University Registration Portal",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/api/health",
    }
