from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    original_video_title = Column(String(500), nullable=False)
    original_video_url = Column(String(1000), nullable=True)
    source_type = Column(String(50), default="upload")  # "youtube" or "upload"
    thumbnail_url = Column(String(1000), nullable=True)
    video_duration = Column(Float, default=0.0)
    processing_status = Column(String(50), default="draft")  # "draft", "processing", "completed", "failed"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="projects")
    videos = relationship("Video", back_populates="project", cascade="all, delete-orphan")
    shorts = relationship("Short", back_populates="project", cascade="all, delete-orphan")
    processing_jobs = relationship("ProcessingJob", back_populates="project", cascade="all, delete-orphan")
