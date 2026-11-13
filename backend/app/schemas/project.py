from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from app.schemas.video import VideoResponse

class ProjectCreate(BaseModel):
    title: str
    source_type: str = "upload"
    original_video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_duration: float = 0.0

class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    original_video_title: str
    original_video_url: Optional[str] = None
    source_type: str
    thumbnail_url: Optional[str] = None
    video_duration: float
    processing_status: str
    created_at: datetime
    shorts_count: Optional[int] = 0

class ProjectDetailResponse(ProjectResponse):
    videos: List[VideoResponse] = []
