from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.video import Video
from app.models.short import Short
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectDetailResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = Project(
        user_id=current_user.id,
        original_video_title=payload.title,
        original_video_url=payload.original_video_url,
        source_type=payload.source_type,
        thumbnail_url=payload.thumbnail_url,
        video_duration=payload.video_duration,
        processing_status="draft"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("", response_model=List[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    projects = db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.created_at.desc()).all()
    results = []
    for p in projects:
        shorts_count = db.query(Short).filter(Short.project_id == p.id).count()
        results.append(ProjectResponse(
            id=p.id,
            user_id=p.user_id,
            original_video_title=p.original_video_title,
            original_video_url=p.original_video_url,
            source_type=p.source_type,
            thumbnail_url=p.thumbnail_url,
            video_duration=p.video_duration,
            processing_status=p.processing_status,
            created_at=p.created_at,
            shorts_count=shorts_count
        ))
    return results

@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    
    shorts_count = db.query(Short).filter(Short.project_id == project.id).count()
    videos = db.query(Video).filter(Video.project_id == project.id).all()

    return ProjectDetailResponse(
        id=project.id,
        user_id=project.user_id,
        original_video_title=project.original_video_title,
        original_video_url=project.original_video_url,
        source_type=project.source_type,
        thumbnail_url=project.thumbnail_url,
        video_duration=project.video_duration,
        processing_status=project.processing_status,
        created_at=project.created_at,
        shorts_count=shorts_count,
        videos=videos
    )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    db.delete(project)
    db.commit()
    return None
