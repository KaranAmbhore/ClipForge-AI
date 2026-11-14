import os
import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.video import Video
from app.schemas.video import (
    VideoValidateUrlRequest,
    VideoValidateUrlResponse,
    VideoUploadResponse,
    VideoResponse,
    VideoDownloadYoutubeRequest
)
from app.api.auth import get_current_user
from app.services.youtube_service import YouTubeService
from app.services.storage_service import StorageService
from app.utils.ffmpeg_utils import get_video_info
from app.utils.validators import validate_video_extension, is_valid_youtube_url

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/videos", tags=["Videos"])

@router.post("/validate-url", response_model=VideoValidateUrlResponse)
async def validate_youtube_url(payload: VideoValidateUrlRequest):
    """
    Validates a YouTube URL and returns video metadata (title, author, thumbnail).
    """
    data = await YouTubeService.get_video_metadata(payload.url)
    if not data.get("is_valid"):
        return VideoValidateUrlResponse(
            is_valid=False,
            message="Please provide a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)."
        )

    return VideoValidateUrlResponse(
        is_valid=True,
        title=data.get("title"),
        author=data.get("author"),
        duration=data.get("duration"),
        thumbnail_url=data.get("thumbnail_url"),
        can_auto_download=data.get("can_auto_download", True),
        message=data.get("message")
    )

@router.post("/download-youtube", response_model=VideoUploadResponse)
async def download_youtube(
    payload: VideoDownloadYoutubeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Downloads YouTube video directly into local storage using yt-dlp, and initializes the project.
    """
    url = payload.url.strip()
    if not is_valid_youtube_url(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid YouTube URL."
        )

    try:
        # Run yt-dlp download in thread pool to prevent blocking FastAPI event loop
        meta = await asyncio.to_thread(YouTubeService.download_video, url)
    except Exception as e:
        logger.error(f"Error downloading YouTube video {url}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to auto-download YouTube video: {str(e)}"
        )

    file_path = meta["file_path"]
    video_info = get_video_info(file_path)
    dur = video_info.get("duration") or meta.get("duration", 60.0)
    title = payload.title or meta.get("title") or "YouTube Video"

    # Create Project
    project = Project(
        user_id=current_user.id,
        original_video_title=title,
        original_video_url=url,
        source_type="youtube",
        video_duration=dur,
        processing_status="draft"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Create Video record
    video = Video(
        project_id=project.id,
        original_file_url=meta["media_url"],
        file_path=file_path,
        file_size=meta["file_size"],
        format=video_info.get("format", meta["format"]),
        duration=dur,
        width=video_info.get("width", 1920),
        height=video_info.get("height", 1080)
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    return VideoUploadResponse(
        video_id=video.id,
        project_id=project.id,
        filename=meta["filename"],
        file_size=meta["file_size"],
        duration=dur,
        format=video.format,
        video_url=meta["media_url"]
    )

@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    title: str = Form(None),
    source_type: str = Form("upload"),
    youtube_url: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accepts video file upload, validates format, saves to storage, and registers project.
    """
    if not validate_video_extension(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Read content and enforce size limits
    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Video file exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # Save to storage
    saved_meta = StorageService.save_upload_file(content, file.filename)
    file_path = saved_meta["file_path"]

    # Extract basic video metadata via FFmpeg
    video_info = get_video_info(file_path)
    dur = video_info.get("duration", 60.0)

    project_title = title or os.path.splitext(file.filename)[0]

    # Create Project
    project = Project(
        user_id=current_user.id,
        original_video_title=project_title,
        original_video_url=youtube_url,
        source_type=source_type,
        video_duration=dur,
        processing_status="draft"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Create Video record
    video = Video(
        project_id=project.id,
        original_file_url=saved_meta["media_url"],
        file_path=file_path,
        file_size=saved_meta["file_size"],
        format=video_info.get("format", "mp4"),
        duration=dur,
        width=video_info.get("width", 1920),
        height=video_info.get("height", 1080)
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    return VideoUploadResponse(
        video_id=video.id,
        project_id=project.id,
        filename=saved_meta["filename"],
        file_size=saved_meta["file_size"],
        duration=dur,
        format=video.format,
        video_url=saved_meta["media_url"]
    )

@router.get("/{video_id}", response_model=VideoResponse)
def get_video_details(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found.")
    return video

@router.get("/media/{filename}")
def stream_video_file(filename: str):
    """
    Serves stored video files with proper headers for web playback.
    """
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Media file not found.")

    ext = os.path.splitext(filename)[1].lower()
    media_types = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".jpg": "image/jpeg",
        ".png": "image/png"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    return FileResponse(file_path, media_type=media_type)
