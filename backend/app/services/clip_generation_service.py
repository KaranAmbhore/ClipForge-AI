import os
import logging
from typing import Dict, Any, List, Optional
from app.services.storage_service import StorageService
from app.services.caption_service import CaptionService
from app.utils.ffmpeg_utils import cut_and_reframe_clip, generate_thumbnail

logger = logging.getLogger(__name__)

class ClipGenerationService:
    @staticmethod
    def generate_short_clip(
        source_video_path: str,
        project_id: int,
        short_index: int,
        start_time: float,
        end_time: float,
        aspect_ratio: str = "9:16",
        transcript_slice: Optional[List[Dict[str, Any]]] = None,
        include_subtitles: bool = True,
        caption_style: str = "modern",
        font_size: int = 38,
        font_color: str = "#FBBF24",
        highlight_color: str = "#FFFFFF",
        caption_position: str = "center"
    ) -> Dict[str, Any]:
        """
        Extracts, reframes, burns captions (if requested), and generates thumbnail for a short.
        """
        paths = StorageService.get_short_output_path(project_id, short_index)
        video_out = paths["file_path"]
        thumb_out = paths["thumb_path"]

        subtitle_ass = None
        if include_subtitles and transcript_slice:
            # Shift transcript timestamps relative to start_time of clip
            shifted_segments = []
            for seg in transcript_slice:
                seg_start = float(seg.get("start", 0.0))
                seg_end = float(seg.get("end", seg_start + 2.0))
                # Only include segments that overlap with this clip window
                if seg_end <= start_time or seg_start >= end_time:
                    continue
                st = max(0.0, seg_start - start_time)
                et = min(end_time - start_time, seg_end - start_time)
                if et > st:
                    shifted_words = []
                    for w in seg.get("words", []):
                        w_st = float(w.get("start", 0.0))
                        w_et = float(w.get("end", w_st + 0.3))
                        if w_et <= start_time or w_st >= end_time:
                            continue
                        shifted_words.append({
                            "word": w.get("word", ""),
                            "start": max(0.0, round(w_st - start_time, 2)),
                            "end": min(end_time - start_time, round(w_et - start_time, 2))
                        })
                    shifted_segments.append({
                        "start": round(st, 2),
                        "end": round(et, 2),
                        "text": seg.get("text", ""),
                        "words": shifted_words
                    })

            ass_file_path = os.path.splitext(video_out)[0] + ".ass"
            subtitle_ass = CaptionService.generate_ass_file(
                segments=shifted_segments,
                output_path=ass_file_path,
                style=caption_style,
                font_size=font_size,
                font_color=font_color,
                highlight_color=highlight_color,
                position=caption_position
            )

        # 1. FFmpeg cut and reframe
        cut_and_reframe_clip(
            input_path=source_video_path,
            output_path=video_out,
            start_time=start_time,
            end_time=end_time,
            aspect_ratio=aspect_ratio,
            subtitle_ass_path=subtitle_ass
        )

        # 2. Thumbnail extraction
        mid_time = min(end_time - start_time - 0.5, 1.5)
        if mid_time < 0.1:
            mid_time = 0.5
        generate_thumbnail(video_out, thumb_out, timestamp=mid_time)

        return {
            "video_path": video_out,
            "video_url": paths["video_url"],
            "thumb_path": thumb_out,
            "thumbnail_url": paths["thumb_url"],
            "duration": round(end_time - start_time, 2)
        }
