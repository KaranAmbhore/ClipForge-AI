import json
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.short import Short
from app.models.video import Video
from app.services.clip_generation_service import ClipGenerationService

logger = logging.getLogger(__name__)

class VideoEditorService:
    @staticmethod
    def render_edited_short(
        db: Session,
        short_id: int,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        caption_style: Optional[str] = None,
        aspect_ratio: Optional[str] = None,
        font_size: Optional[int] = None,
        font_color: Optional[str] = None,
        highlight_color: Optional[str] = None,
        caption_position: Optional[str] = None,
        transcript_json: Optional[str] = None
    ) -> Short:
        """
        Re-renders short with updated editor parameters and saves new media files.
        """
        short = db.query(Short).filter(Short.id == short_id).first()
        if not short:
            raise ValueError(f"Short {short_id} not found.")

        # Find original source video for this project
        source_video = db.query(Video).filter(Video.project_id == short.project_id).first()
        if not source_video:
            raise ValueError(f"Source video for project {short.project_id} not found.")

        # Update properties
        st = start_time if start_time is not None else short.start_time
        et = end_time if end_time is not None else short.end_time
        c_style = caption_style or short.caption_style
        a_ratio = aspect_ratio or short.aspect_ratio
        f_size = font_size or short.font_size
        f_color = font_color or short.font_color
        h_color = highlight_color or short.highlight_color
        c_pos = caption_position or short.caption_position

        # Parse transcript
        transcript_data = []
        raw_tr = transcript_json or short.transcript
        if raw_tr:
            try:
                transcript_data = json.loads(raw_tr) if isinstance(raw_tr, str) else raw_tr
            except Exception:
                pass

        # Generate re-rendered short
        result = ClipGenerationService.generate_short_clip(
            source_video_path=source_video.file_path,
            project_id=short.project_id,
            short_index=short.id,
            start_time=st,
            end_time=et,
            aspect_ratio=a_ratio,
            transcript_slice=transcript_data,
            include_subtitles=True,
            caption_style=c_style,
            font_size=f_size,
            font_color=f_color,
            highlight_color=h_color,
            caption_position=c_pos
        )

        # Update short record
        short.start_time = st
        short.end_time = et
        short.duration = result["duration"]
        short.video_url = result["video_url"]
        short.file_path = result["video_path"]
        short.thumbnail_url = result["thumbnail_url"]
        short.caption_style = c_style
        short.aspect_ratio = a_ratio
        short.font_size = f_size
        short.font_color = f_color
        short.highlight_color = h_color
        short.caption_position = c_pos
        if transcript_json:
            short.transcript = transcript_json

        db.commit()
        db.refresh(short)
        return short
