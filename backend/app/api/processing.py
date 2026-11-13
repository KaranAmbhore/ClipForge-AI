import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.job import ProcessingJob
from app.schemas.job import JobGenerateRequest, JobStatusResponse
from app.api.auth import get_current_user
from app.workers.video_tasks import process_video_job

router = APIRouter(prefix="/processing", tags=["Processing"])

@router.post("/{project_id}/generate", response_model=JobStatusResponse)
def start_processing_job(
    project_id: int,
    payload: JobGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiates the 8-stage video processing pipeline in the background.
    """
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # Create job
    job = ProcessingJob(
        project_id=project.id,
        status="queued",
        progress=0.0,
        current_stage="Queued for processing",
        stage_index=1,
        settings=json.dumps(payload.model_dump())
    )
    db.add(job)
    project.processing_status = "processing"
    db.commit()
    db.refresh(job)

    # Launch worker in background
    background_tasks.add_task(process_video_job, job.id)

    return job

@router.get("/{job_id}/status", response_model=JobStatusResponse)
def get_job_status(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found.")
    return job

@router.post("/{job_id}/cancel", response_model=JobStatusResponse)
def cancel_processing_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found.")

    job.status = "cancelled"
    job.current_stage = "Job cancelled by user"
    
    project = db.query(Project).filter(Project.id == job.project_id).first()
    if project and project.processing_status == "processing":
        project.processing_status = "draft"

    db.commit()
    db.refresh(job)
    return job
