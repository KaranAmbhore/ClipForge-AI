import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.short import Short
from app.schemas.short import ShortResponse, ShortUpdate, RegenerateRequest
from app.api.auth import get_current_user
from app.services.video_editor_service import VideoEditorService

router = APIRouter(prefix="/shorts", tags=["Shorts"])

@router.get("/{project_id}", response_model=List[ShortResponse])
def get_project_shorts(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all generated shorts for the given project.
    """
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    shorts = db.query(Short).filter(Short.project_id == project_id).order_by(Short.start_time.asc()).all()
    return shorts

@router.get("/detail/{short_id}", response_model=ShortResponse)
def get_short_detail(
    short_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    short = db.query(Short).filter(Short.id == short_id).first()
    if not short:
        raise HTTPException(status_code=404, detail="Short not found.")
    return short

@router.put("/{short_id}", response_model=ShortResponse)
def update_short(
    short_id: int,
    payload: ShortUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Video Editor endpoint: saves edited metadata and re-renders short if trimming,
    aspect ratio, or caption styling parameters were changed.
    """
    short = db.query(Short).filter(Short.id == short_id).first()
    if not short:
        raise HTTPException(status_code=404, detail="Short not found.")

    # Check if rendering parameters changed
    needs_rerender = any([
        payload.start_time is not None and payload.start_time != short.start_time,
        payload.end_time is not None and payload.end_time != short.end_time,
        payload.aspect_ratio is not None and payload.aspect_ratio != short.aspect_ratio,
        payload.caption_style is not None and payload.caption_style != short.caption_style,
        payload.font_size is not None and payload.font_size != short.font_size,
        payload.font_color is not None and payload.font_color != short.font_color,
        payload.highlight_color is not None and payload.highlight_color != short.highlight_color,
        payload.caption_position is not None and payload.caption_position != short.caption_position,
        payload.transcript is not None
    ])

    if payload.title is not None:
        short.title = payload.title
    if payload.description is not None:
        short.description = payload.description

    if needs_rerender:
        try:
            short = VideoEditorService.render_edited_short(
                db=db,
                short_id=short.id,
                start_time=payload.start_time,
                end_time=payload.end_time,
                caption_style=payload.caption_style,
                aspect_ratio=payload.aspect_ratio,
                font_size=payload.font_size,
                font_color=payload.font_color,
                highlight_color=payload.highlight_color,
                caption_position=payload.caption_position,
                transcript_json=payload.transcript
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Re-render failed: {str(e)}")
    else:
        db.commit()
        db.refresh(short)

    return short

@router.post("/{short_id}/regenerate", response_model=ShortResponse)
def regenerate_short(
    short_id: int,
    payload: RegenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Regenerates the short video file with new styling options.
    """
    short = db.query(Short).filter(Short.id == short_id).first()
    if not short:
        raise HTTPException(status_code=404, detail="Short not found.")

    updated_short = VideoEditorService.render_edited_short(
        db=db,
        short_id=short.id,
        caption_style=payload.caption_style,
        aspect_ratio=payload.aspect_ratio,
        font_size=payload.font_size,
        font_color=payload.font_color,
        highlight_color=payload.highlight_color,
        caption_position=payload.caption_position
    )
    return updated_short

@router.get("/{short_id}/download")
def download_short(short_id: int, db: Session = Depends(get_db)):
    """
    Streams the generated MP4 file with attachment download headers.
    """
    short = db.query(Short).filter(Short.id == short_id).first()
    if not short or not short.file_path or not os.path.exists(short.file_path):
        raise HTTPException(status_code=404, detail="Video file not found.")

    clean_filename = f"{short.title.replace(' ', '_')[:30]}_{short.aspect_ratio.replace(':', 'x')}.mp4"
    return FileResponse(
        path=short.file_path,
        media_type="video/mp4",
        filename=clean_filename,
        headers={"Content-Disposition": f'attachment; filename="{clean_filename}"'}
    )

@router.get("/media/{filename}")
def stream_short_media(filename: str):
    """
    Serves generated short media (videos, thumbnails) for preview in web player.
    """
    file_path = os.path.join(settings.OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Media file not found.")

    ext = os.path.splitext(filename)[1].lower()
    media_types = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".jpg": "image/jpeg",
        ".png": "image/png"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    return FileResponse(file_path, media_type=media_type)
