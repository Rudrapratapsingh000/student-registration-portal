import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import DATABASE_URL, BASE_DIR

logger = logging.getLogger("student_portal.database")
logging.basicConfig(level=logging.INFO)

Base = declarative_base()

# Determine database engine with graceful fallback if MySQL credentials are placeholder
is_mysql = "mysql" in DATABASE_URL.lower()
is_placeholder = "YOUR_USERNAME" in DATABASE_URL or "YOUR_PASSWORD" in DATABASE_URL

engine = None
active_db_url = DATABASE_URL
using_fallback = False

if not is_placeholder:
    try:
        # Attempt to connect to the configured database
        test_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = test_engine
        logger.info(f"Successfully connected to configured database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    except Exception as e:
        logger.warning(f"Could not connect to configured database ({e}).")
        using_fallback = True
else:
    logger.info("Placeholder MySQL credentials detected in DATABASE_URL.")
    using_fallback = True

if using_fallback or engine is None:
    # Fallback to local SQLite database so the portal starts and functions smoothly
    sqlite_path = BASE_DIR / "student_portal.db"
    active_db_url = f"sqlite:///{sqlite_path}"
    logger.info(f"Using local database for development/testing: {active_db_url}")
    engine = create_engine(active_db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI dependency that yields a SQLAlchemy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes database tables defined in models."""
    from app import models  # noqa
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully.")
