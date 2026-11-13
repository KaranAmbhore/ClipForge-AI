import os
import sys
import subprocess

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.utils.ffmpeg_utils import get_ffmpeg_binary

def create_sample_video():
    """Generates a sample 20-second test video with synthesized audio for development testing."""
    os.makedirs("sample_data", exist_ok=True)
    out_path = os.path.join("sample_data", "sample_podcast.mp4")
    
    if os.path.exists(out_path):
        print(f"Sample video already exists at {out_path}")
        return out_path

    ffmpeg_bin = get_ffmpeg_binary()
    # Generates 20s of 1920x1080 30fps test video with audio sine wave and timecode
    cmd = [
        ffmpeg_bin, "-y",
        "-f", "lavfi", "-i", "testsrc=duration=20:size=1920x1080:rate=30",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=20",
        "-vf", "drawtext=text='ClipForge AI Demo Clip %{pts\\:hms}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=(h-text_h)/2",
        "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest",
        out_path
    ]
    print(f"Generating test video: {' '.join(cmd)}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"Sample video created successfully at {out_path}")
        return out_path
    else:
        print(f"Failed to create sample: {res.stderr}")
        return None

if __name__ == "__main__":
    create_sample_video()
