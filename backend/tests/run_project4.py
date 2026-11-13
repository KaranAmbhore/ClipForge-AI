import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.job import ProcessingJob
from app.workers.video_tasks import process_video_job
from app.models.short import Short

def test_project():
    db = SessionLocal()
    settings_dict = {
        "num_shorts": 2,
        "clip_duration": 15,
        "aspect_ratio": "9:16",
        "caption_style": "karaoke",
        "ai_focus": "engaging",
        "include_subtitles": True,
        "language": "en"
    }
    job = ProcessingJob(
        project_id=4,
        status="queued",
        progress=0.0,
        current_stage="Queued",
        settings=json.dumps(settings_dict)
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    print(f"Created Job ID {job.id} for Project 4")

    # Run processing pipeline
    process_video_job(job.id)

    db.refresh(job)
    print(f"Job Status: {job.status}, Error: {job.error_message}")

    # Inspect generated shorts
    shorts = db.query(Short).filter(Short.project_id == 4).order_by(Short.id.desc()).limit(2).all()
    for s in shorts:
        print(f"\n--- Generated Short #{s.id} ---")
        print(f"Title: {s.title}")
        print(f"Duration: {s.duration}s ({s.start_time}s -> {s.end_time}s)")
        print(f"Video URL: {s.video_url}")
        print(f"Transcript: {s.transcript}")

    db.close()

if __name__ == "__main__":
    test_project()
