from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any

class SubtitleItem(BaseModel):
    start: float
    end: float
    text: str

class ShortUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    caption_style: Optional[str] = None
    aspect_ratio: Optional[str] = None
    font_size: Optional[int] = None
    font_color: Optional[str] = None
    highlight_color: Optional[str] = None
    caption_position: Optional[str] = None
    transcript: Optional[str] = None  # JSON string or text

class ShortResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    start_time: float
    end_time: float
    duration: float
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    engagement_score: int
    hook: Optional[str] = None
    category: Optional[str] = None
    transcript: Optional[str] = None
    caption_style: str
    aspect_ratio: str
    font_size: int
    font_color: str
    highlight_color: str
    caption_position: str
    created_at: datetime

class RegenerateRequest(BaseModel):
    caption_style: Optional[str] = "modern"
    aspect_ratio: Optional[str] = "9:16"
    font_size: Optional[int] = 24
    font_color: Optional[str] = "#FFFFFF"
    highlight_color: Optional[str] = "#FBBF24"
    caption_position: Optional[str] = "bottom"
    burn_subtitles: bool = True
