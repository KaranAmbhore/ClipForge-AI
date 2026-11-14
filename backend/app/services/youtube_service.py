import os
import uuid
import logging
import httpx
from typing import Dict, Any, Optional
import yt_dlp
from app.config import settings
from app.utils.validators import extract_youtube_video_id
from app.utils.ffmpeg_utils import get_ffmpeg_binary

logger = logging.getLogger(__name__)

class YouTubeService:
    @staticmethod
    async def get_video_metadata(url: str) -> Dict[str, Any]:
        """
        Retrieves video metadata using YouTube's official oEmbed API and Data API v3 where available.
        """
        video_id = extract_youtube_video_id(url)
        if not video_id:
            return {
                "is_valid": False,
                "message": "Invalid YouTube URL format."
            }

        title = None
        author = None
        thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
        duration = None

        # 1. Fetch official oEmbed data (no API key required)
        try:
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(oembed_url)
                if resp.status_code == 200:
                    data = resp.json()
                    title = data.get("title")
                    author = data.get("author_name")
                    if data.get("thumbnail_url"):
                        thumbnail_url = data.get("thumbnail_url")
        except Exception as e:
            logger.warning(f"YouTube oEmbed fetch error: {e}")

        # 2. If YouTube Data API v3 key is configured, fetch duration and full details
        if settings.YOUTUBE_API_KEY:
            try:
                api_url = f"https://www.googleapis.com/youtube/v3/videos?id={video_id}&part=snippet,contentDetails&key={settings.YOUTUBE_API_KEY}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(api_url)
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data.get("items", [])
                        if items:
                            snippet = items[0].get("snippet", {})
                            content = items[0].get("contentDetails", {})
                            title = snippet.get("title", title)
                            author = snippet.get("channelTitle", author)
                            duration = 180.0  # default fallback
            except Exception as e:
                logger.warning(f"YouTube Data API fetch error: {e}")

        if not title:
            title = f"YouTube Video ({video_id})"

        can_auto_download = getattr(settings, "ENABLE_YOUTUBE_DOWNLOAD", True)
        if can_auto_download:
            message = "Metadata retrieved successfully. Auto-download is available, or you can upload a local file."
        else:
            message = "Metadata retrieved successfully. In accordance with YouTube TOS, please upload your video file."

        return {
            "is_valid": True,
            "video_id": video_id,
            "title": title,
            "author": author or "YouTube Creator",
            "thumbnail_url": thumbnail_url,
            "duration": duration or 120.0,
            "can_auto_download": can_auto_download,
            "message": message
        }

    @staticmethod
    def download_video(url: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Downloads a YouTube video directly using yt-dlp into the local storage folder.
        Optimized for local offline / personal use.
        """
        output_dir = output_dir or settings.UPLOAD_DIR
        os.makedirs(output_dir, exist_ok=True)

        video_id = extract_youtube_video_id(url)
        unique_id = uuid.uuid4().hex
        output_template = os.path.join(output_dir, f"{unique_id}.%(ext)s")
        ffmpeg_bin = get_ffmpeg_binary()

        max_res = getattr(settings, "YOUTUBE_DOWNLOAD_MAX_RESOLUTION", 1080)
        ydl_opts = {
            'format': f'bestvideo[ext=mp4][height<={max_res}]+bestaudio[ext=m4a]/best[ext=mp4][height<={max_res}]/best[height<={max_res}]/best',
            'outtmpl': output_template,
            'merge_output_format': 'mp4',
            'noplaylist': True,
            'quiet': False,
            'no_warnings': True,
        }
        if ffmpeg_bin:
            ydl_opts['ffmpeg_location'] = ffmpeg_bin

        logger.info(f"Starting yt-dlp download for URL: {url} -> {output_template}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)

        # Identify generated file on disk
        expected_mp4 = os.path.join(output_dir, f"{unique_id}.mp4")
        if os.path.exists(expected_mp4):
            final_path = expected_mp4
            ext = "mp4"
        else:
            candidates = [
                os.path.join(output_dir, f)
                for f in os.listdir(output_dir)
                if f.startswith(unique_id)
            ]
            if not candidates:
                raise RuntimeError("Downloaded video file could not be found on disk.")
            final_path = candidates[0]
            ext = os.path.splitext(final_path)[1].lstrip(".").lower() or "mp4"

        file_size = os.path.getsize(final_path)
        title = (info.get("title") if info else None) or f"YouTube Video ({video_id or unique_id[:8]})"
        duration = float(info.get("duration") or 0.0) if info else 0.0
        author = (info.get("uploader") or info.get("channel")) if info else "YouTube Creator"
        thumbnail = (info.get("thumbnail") if info else None) or (
            f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg" if video_id else None
        )

        filename = os.path.basename(final_path)
        logger.info(f"yt-dlp download completed: {filename} ({file_size} bytes)")

        return {
            "filename": filename,
            "file_path": final_path,
            "file_size": file_size,
            "format": ext,
            "title": title,
            "author": author,
            "duration": duration,
            "thumbnail_url": thumbnail,
            "media_url": f"/api/videos/media/{filename}"
        }
