from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Short(Base):
    __tablename__ = "shorts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    duration = Column(Float, nullable=False)
    video_url = Column(String(1000), nullable=True)
    file_path = Column(String(1000), nullable=True)
    thumbnail_url = Column(String(1000), nullable=True)
    engagement_score = Column(Integer, default=85)
    hook = Column(String(500), nullable=True)
    category = Column(String(100), default="Highlight")
    transcript = Column(Text, nullable=True)  # JSON-encoded array of timestamped segments
    caption_style = Column(String(50), default="modern")  # modern, minimal, bold, karaoke
    aspect_ratio = Column(String(20), default="9:16")  # 9:16, 1:1, 16:9
    font_size = Column(Integer, default=38)
    font_color = Column(String(20), default="#FBBF24")  # Gold/Yellow text
    highlight_color = Column(String(20), default="#FFFFFF")  # White active word highlight
    caption_position = Column(String(20), default="center")  # top, center, bottom
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="shorts")
