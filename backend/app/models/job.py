from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    status = Column(String(50), default="queued")  # queued, processing, completed, failed, cancelled
    progress = Column(Float, default=0.0)  # 0.0 - 100.0
    current_stage = Column(String(100), default="Initializing")
    stage_index = Column(Integer, default=1)  # 1 to 8
    error_message = Column(Text, nullable=True)
    settings = Column(Text, nullable=True)  # JSON-encoded generation settings
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="processing_jobs")
