from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

class VideoValidateUrlRequest(BaseModel):
    url: str

class VideoValidateUrlResponse(BaseModel):
    is_valid: bool
    title: Optional[str] = None
    author: Optional[str] = None
    duration: Optional[float] = None
    thumbnail_url: Optional[str] = None
    can_auto_download: bool = False
    message: str

class VideoUploadResponse(BaseModel):
    video_id: int
    project_id: int
    filename: str
    file_size: int
    duration: float
    format: str
    video_url: str

class VideoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    original_file_url: str
    file_size: int
    format: str
    duration: float
    width: int
    height: int
    created_at: datetime
