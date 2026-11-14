import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

# Base directory of the backend
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "ClipForge AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = "clipforge-super-secret-jwt-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: SQLite by default for zero-config local run, or PostgreSQL
    DATABASE_URL: str = "sqlite:///./clipforge.db"
    
    # AI Providers
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    WHISPER_MODEL: str = "whisper-1"
    
    # YouTube API & Auto Download
    YOUTUBE_API_KEY: str = ""
    ENABLE_YOUTUBE_DOWNLOAD: bool = True
    YOUTUBE_DOWNLOAD_MAX_RESOLUTION: int = 1080
    
    # Storage & Uploads
    UPLOAD_DIR: str = str(BASE_DIR / "data" / "uploads")
    OUTPUT_DIR: str = str(BASE_DIR / "data" / "outputs")
    MAX_UPLOAD_SIZE_MB: int = 500
    ALLOWED_EXTENSIONS: List[str] = ["mp4", "mov", "webm", "mkv", "m4v"]
    
    # Custom FFmpeg binary path (if empty, auto-detects system ffmpeg or imageio-ffmpeg)
    FFMPEG_PATH: str = ""
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
