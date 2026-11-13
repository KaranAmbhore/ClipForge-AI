from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any

class JobGenerateRequest(BaseModel):
    num_shorts: int = 3
    clip_duration: int = 30  # 15, 30, 45, 60
    aspect_ratio: str = "9:16"  # 9:16, 1:1, 16:9
    caption_style: str = "modern"  # modern, minimal, bold, karaoke
    language: str = "en"
    ai_focus: str = "engaging"  # engaging, educational, funny, motivational, storytelling
    include_subtitles: bool = True
    include_ai_title: bool = True

class JobStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    status: str  # queued, processing, completed, failed, cancelled
    progress: float
    current_stage: str
    stage_index: int
    total_stages: int = 8
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
