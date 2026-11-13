import os
import uuid
import shutil
from pathlib import Path
from app.config import settings

class StorageService:
    @staticmethod
    def get_upload_path(filename: str) -> str:
        return os.path.join(settings.UPLOAD_DIR, filename)

    @staticmethod
    def save_upload_file(file_content: bytes, original_filename: str) -> dict:
        ext = original_filename.split(".")[-1].lower() if "." in original_filename else "mp4"
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        target_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        
        with open(target_path, "wb") as f:
            f.write(file_content)
            
        file_size = os.path.getsize(target_path)
        media_url = f"/api/videos/media/{unique_name}"
        
        return {
            "filename": unique_name,
            "original_name": original_filename,
            "file_path": target_path,
            "file_size": file_size,
            "media_url": media_url
        }

    @staticmethod
    def get_short_output_path(project_id: int, short_index: int, ext: str = "mp4") -> dict:
        short_id = uuid.uuid4().hex[:8]
        filename = f"short_proj{project_id}_{short_index}_{short_id}.{ext}"
        thumb_name = f"thumb_proj{project_id}_{short_index}_{short_id}.jpg"
        target_path = os.path.join(settings.OUTPUT_DIR, filename)
        thumb_path = os.path.join(settings.OUTPUT_DIR, thumb_name)
        
        return {
            "filename": filename,
            "file_path": target_path,
            "video_url": f"/api/shorts/media/{filename}",
            "thumb_filename": thumb_name,
            "thumb_path": thumb_path,
            "thumb_url": f"/api/shorts/media/{thumb_name}"
        }

    @staticmethod
    def delete_file(file_path: str):
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
