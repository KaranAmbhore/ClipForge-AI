import os
import json
import logging
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.project import Project
from app.models.video import Video
from app.models.short import Short
from app.models.job import ProcessingJob
from app.utils.ffmpeg_utils import extract_audio, get_video_info
from app.services.transcription_service import TranscriptionService
from app.services.ai_analysis_service import AIAnalysisService
from app.services.clip_generation_service import ClipGenerationService

logger = logging.getLogger(__name__)

STAGES = [
    (1, "Uploading video", 10.0),
    (2, "Extracting audio", 25.0),
    (3, "Generating transcript", 40.0),
    (4, "Analyzing video content", 55.0),
    (5, "Finding interesting moments", 70.0),
    (6, "Generating short clips", 85.0),
    (7, "Creating captions", 95.0),
    (8, "Finalizing videos", 100.0)
]

def update_job_progress(db: Session, job: ProcessingJob, stage_idx: int, message: str, progress: float):
    job.stage_index = stage_idx
    job.current_stage = message
    job.progress = progress
    db.commit()
    db.refresh(job)

def process_video_job(job_id: int):
    """
    Asynchronous worker task that executes the 8-stage video processing pipeline.
    """
    db = SessionLocal()
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if not job or job.status == "cancelled":
            return

        job.status = "processing"
        job.started_at = datetime.utcnow()
        db.commit()

        # Parse settings
        settings_data = {}
        if job.settings:
            try:
                settings_data = json.loads(job.settings)
            except Exception:
                pass

        num_shorts = settings_data.get("num_shorts", 3)
        clip_duration = settings_data.get("clip_duration", 30)
        aspect_ratio = settings_data.get("aspect_ratio", "9:16")
        caption_style = settings_data.get("caption_style", "modern")
        ai_focus = settings_data.get("ai_focus", "engaging")
        include_subtitles = settings_data.get("include_subtitles", True)
        language = settings_data.get("language", "en")

        project = db.query(Project).filter(Project.id == job.project_id).first()
        video = db.query(Video).filter(Video.project_id == job.project_id).first()

        if not project or not video or not os.path.exists(video.file_path):
            job.status = "failed"
            job.error_message = "Source video file not found on disk."
            db.commit()
            return

        # Stage 1: Validating video metadata
        update_job_progress(db, job, 1, "Uploading video", 10.0)
        video_info = get_video_info(video.file_path)
        video_duration = video_info.get("duration", 60.0)
        if video_duration <= 0:
            video_duration = 60.0
        video.duration = video_duration
        video.width = video_info.get("width", 1920)
        video.height = video_info.get("height", 1080)
        project.video_duration = video_duration
        db.commit()

        # Stage 2: Extracting audio
        update_job_progress(db, job, 2, "Extracting audio", 25.0)
        audio_path = os.path.splitext(video.file_path)[0] + ".mp3"
        extract_audio(video.file_path, audio_path)

        # Stage 3: Generating transcript
        update_job_progress(db, job, 3, "Generating transcript", 40.0)
        transcript = TranscriptionService.transcribe_audio(
            audio_path=audio_path,
            duration=video_duration,
            language=language
        )

        # Stage 4: Analyzing video content
        update_job_progress(db, job, 4, "Analyzing video content", 55.0)

        # Stage 5: Finding interesting moments
        update_job_progress(db, job, 5, "Finding interesting moments", 70.0)
        moments = AIAnalysisService.analyze_moments(
            transcript_segments=transcript,
            video_duration=video_duration,
            num_shorts=num_shorts,
            target_duration=clip_duration,
            ai_focus=ai_focus
        )

        # Stage 6 & 7: Generating short clips and creating captions
        update_job_progress(db, job, 6, "Generating short clips", 85.0)
        generated_shorts = []
        for idx, moment in enumerate(moments):
            # Check for cancellation
            db.refresh(job)
            if job.status == "cancelled":
                logger.info(f"Job {job.id} cancelled by user.")
                return

            update_job_progress(db, job, 7, f"Creating captions for clip {idx + 1}/{len(moments)}", 85.0 + (idx / len(moments)) * 10.0)

            clip_res = ClipGenerationService.generate_short_clip(
                source_video_path=video.file_path,
                project_id=project.id,
                short_index=idx + 1,
                start_time=moment["start_time"],
                end_time=moment["end_time"],
                aspect_ratio=aspect_ratio,
                transcript_slice=moment.get("transcript_slice", transcript),
                include_subtitles=include_subtitles,
                caption_style=caption_style
            )

            new_short = Short(
                project_id=project.id,
                title=moment["title"],
                description=moment["description"],
                start_time=moment["start_time"],
                end_time=moment["end_time"],
                duration=clip_res["duration"],
                video_url=clip_res["video_url"],
                file_path=clip_res["video_path"],
                thumbnail_url=clip_res["thumbnail_url"],
                engagement_score=moment["engagement_score"],
                hook=moment["hook"],
                category=moment["category"],
                transcript=json.dumps(moment.get("transcript_slice", transcript)),
                caption_style=caption_style,
                aspect_ratio=aspect_ratio
            )
            db.add(new_short)
            generated_shorts.append(new_short)

        # Stage 8: Finalizing videos
        update_job_progress(db, job, 8, "Finalizing videos", 100.0)
        job.status = "completed"
        job.completed_at = datetime.utcnow()
        project.processing_status = "completed"
        if generated_shorts and not project.thumbnail_url:
            project.thumbnail_url = generated_shorts[0].thumbnail_url
        db.commit()

        logger.info(f"Successfully completed video processing job {job_id} for project {project.id}")

    except Exception as e:
        logger.error(f"Error executing processing job {job_id}: {e}", exc_info=True)
        try:
            job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error_message = str(e)
                db.commit()
            project = db.query(Project).filter(Project.id == job.project_id).first()
            if project:
                project.processing_status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
