import os
import re
import shutil
import subprocess
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

def get_ffmpeg_binary() -> str:
    """Finds available FFmpeg binary: custom settings, PATH, or imageio-ffmpeg."""
    if settings.FFMPEG_PATH and os.path.isfile(settings.FFMPEG_PATH):
        return settings.FFMPEG_PATH

    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg

    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as e:
        logger.warning(f"Could not load imageio_ffmpeg: {e}")
        return "ffmpeg"

def run_ffmpeg_command(cmd: list) -> subprocess.CompletedProcess:
    """Executes FFmpeg with proper logging and error handling."""
    ffmpeg_bin = get_ffmpeg_binary()
    cmd[0] = ffmpeg_bin
    logger.info(f"Executing: {' '.join(str(c) for c in cmd)}")
    
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        logger.error(f"FFmpeg failed with code {result.returncode}: {result.stderr[-400:]}")
        raise RuntimeError(f"FFmpeg execution failed: {result.stderr[-300:]}")
    return result

def get_video_info(file_path: str) -> Dict[str, Any]:
    """Extracts duration, width, height, and format using FFmpeg stdout/stderr."""
    ffmpeg_bin = get_ffmpeg_binary()
    cmd = [ffmpeg_bin, "-i", file_path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    output = res.stderr

    duration = 0.0
    width = 1920
    height = 1080

    # Parse Duration: 00:01:23.45
    dur_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", output)
    if dur_match:
        hours = float(dur_match.group(1))
        mins = float(dur_match.group(2))
        secs = float(dur_match.group(3))
        duration = hours * 3600 + mins * 60 + secs

    # Parse Video stream resolution: e.g., 1920x1080 [SAR 1:1 DAR 16:9]
    res_match = re.search(r"Stream.*Video:.*?(\d{3,4})x(\d{3,4})", output)
    if res_match:
        width = int(res_match.group(1))
        height = int(res_match.group(2))

    return {
        "duration": duration,
        "width": width,
        "height": height,
        "format": os.path.splitext(file_path)[1].replace(".", "").lower()
    }

def extract_audio(video_path: str, audio_path: str) -> str:
    """Extracts MP3 audio from a video file."""
    os.makedirs(os.path.dirname(audio_path), exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "libmp3lame",
        "-ar", "44100",
        "-ac", "2",
        "-b:a", "192k",
        audio_path
    ]
    run_ffmpeg_command(cmd)
    return audio_path

def generate_thumbnail(video_path: str, thumb_path: str, timestamp: float = 1.0) -> str:
    """Generates a high-quality JPEG thumbnail at given timestamp."""
    os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(timestamp),
        "-i", video_path,
        "-vframes", "1",
        "-q:v", "2",
        thumb_path
    ]
    try:
        run_ffmpeg_command(cmd)
    except Exception as e:
        logger.warning(f"Thumbnail generation at {timestamp} failed, retrying at 0: {e}")
        cmd[2] = "0"
        run_ffmpeg_command(cmd)
    return thumb_path

def cut_and_reframe_clip(
    input_path: str,
    output_path: str,
    start_time: float,
    end_time: float,
    aspect_ratio: str = "9:16",
    subtitle_ass_path: Optional[str] = None
) -> str:
    """
    Extracts clip between start_time and end_time, converts to specified aspect ratio
    (9:16 portrait, 1:1 square, or 16:9 landscape), and burns subtitles if provided.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    duration = max(1.0, end_time - start_time)

    # Determine video filter for crop and scale
    filter_chain = []
    
    if aspect_ratio == "9:16":
        # Intelligent center crop to 9:16 and scale to standard 1080x1920
        # If input is 16:9 (e.g. 1920x1080), crop width = 1080 * 9/16 = 607.5
        # crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920
        crop_filter = "crop='if(gte(iw/ih,9/16),ih*9/16,iw)':'if(gte(iw/ih,9/16),ih,iw*16/9)':(iw-ow)/2:(ih-oh)/2,scale=1080:1920"
        filter_chain.append(crop_filter)
    elif aspect_ratio == "1:1":
        crop_filter = "crop=min(iw\\,ih):min(iw\\,ih):(iw-min(iw\\,ih))/2:(ih-min(iw\\,ih))/2,scale=1080:1080"
        filter_chain.append(crop_filter)
    else: # 16:9
        filter_chain.append("scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2")

    if subtitle_ass_path and os.path.exists(subtitle_ass_path):
        # Escape path for FFmpeg filter on Windows
        clean_path = subtitle_ass_path.replace("\\", "/").replace(":", "\\:")
        filter_chain.append(f"subtitles='{clean_path}'")

    vf_arg = ",".join(filter_chain)

    cmd = [
        "ffmpeg", "-y",
        "-ss", f"{start_time:.3f}",
        "-t", f"{duration:.3f}",
        "-i", input_path,
        "-vf", vf_arg,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        output_path
    ]

    run_ffmpeg_command(cmd)
    return output_path
