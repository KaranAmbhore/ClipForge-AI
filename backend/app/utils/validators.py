import re
from typing import Tuple, Optional
from app.config import settings

YOUTUBE_REGEX = re.compile(
    r"^(https?://)?(www\.)?(youtube\.com/(watch\?v=|shorts/|embed/)|youtu\.be/)([a-zA-Z0-9_-]{11})"
)

def extract_youtube_video_id(url: str) -> Optional[str]:
    """Extracts the 11-character YouTube video ID if valid."""
    match = YOUTUBE_REGEX.search(url.strip())
    if match:
        return match.group(5)
    return None

def is_valid_youtube_url(url: str) -> bool:
    """Checks whether the given URL is a syntactically valid YouTube video link."""
    return extract_youtube_video_id(url) is not None

def validate_video_extension(filename: str) -> bool:
    """Validates file extension against allowed video extensions."""
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    return ext in settings.ALLOWED_EXTENSIONS
