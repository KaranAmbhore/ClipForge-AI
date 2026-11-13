import os
import json
import logging
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class CaptionService:
    @staticmethod
    def format_ass_time(seconds: float) -> str:
        """Converts seconds into ASS time format: H:MM:SS.cc"""
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        cs = int(round((seconds - int(seconds)) * 100))
        if cs >= 100:
            s += 1
            cs -= 100
        return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

    @staticmethod
    def format_srt_time(seconds: float) -> str:
        """Converts seconds into SRT time format: HH:MM:SS,mmm"""
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int(round((seconds - int(seconds)) * 1000))
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    @staticmethod
    def hex_to_ass_color(hex_str: str) -> str:
        """Converts #RRGGBB to ASS &H00BBGGRR format."""
        clean = hex_str.strip().lstrip("#")
        if len(clean) == 6:
            r = clean[0:2]
            g = clean[2:4]
            b = clean[4:6]
            return f"&H00{b}{g}{r}&"
        return "&H00FFFFFF&"

    @staticmethod
    def generate_ass_file(
        segments: List[Dict[str, Any]],
        output_path: str,
        style: str = "modern",
        font_size: int = 24,
        font_color: str = "#FFFFFF",
        highlight_color: str = "#FBBF24",
        position: str = "bottom"
    ) -> str:
        """
        Generates an ASS subtitle file with stylish modern typography suitable for 9:16 Shorts.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        primary_ass = CaptionService.hex_to_ass_color(font_color)
        highlight_ass = CaptionService.hex_to_ass_color(highlight_color)

        # Vertical alignment: 2 = bottom-center, 5 = middle-center, 8 = top-center
        align = "2"
        margin_v = "120"
        if position == "center":
            align = "5"
            margin_v = "0"
        elif position == "top":
            align = "8"
            margin_v = "140"

        # Style presets
        outline = "3"
        shadow = "2"
        bold = "-1"  # true in ASS
        font_name = "Arial"

        if style == "bold":
            font_size = int(font_size * 1.2)
            outline = "4"
            shadow = "3"
        elif style == "minimal":
            outline = "1.5"
            shadow = "0"
            bold = "0"

        ass_content = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size * 2},{primary_ass},{highlight_ass},&H00000000&,&H80000000&,{bold},0,0,0,100,100,0,0,1,{outline},{shadow},{align},60,60,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

        events = []
        for seg in segments:
            st = max(0.0, float(seg.get("start", 0.0)))
            et = max(st + 0.5, float(seg.get("end", st + 2.0)))
            text = str(seg.get("text", "")).strip()
            if not text:
                continue

            words = text.split()
            # If karaoke or modern highlight is active, highlight the first or middle word
            if style == "karaoke" and len(words) > 1:
                # Highlight words progressively
                formatted_text = " ".join([f"{{\\c{highlight_ass}}}{words[0]}{{\\c{primary_ass}}}"] + words[1:])
            elif style == "bold":
                formatted_text = text.upper()
            else:
                formatted_text = text

            start_ass = CaptionService.format_ass_time(st)
            end_ass = CaptionService.format_ass_time(et)
            events.append(f"Dialogue: 0,{start_ass},{end_ass},Default,,0,0,0,,{formatted_text}")

        ass_content += "\n".join(events) + "\n"

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(ass_content)

        return output_path

    @staticmethod
    def generate_srt_file(segments: List[Dict[str, Any]], output_path: str) -> str:
        """Generates a standard SRT file for web player subtitle tracks."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        lines = []
        for idx, seg in enumerate(segments, 1):
            st = max(0.0, float(seg.get("start", 0.0)))
            et = max(st + 0.5, float(seg.get("end", st + 2.0)))
            text = str(seg.get("text", "")).strip()
            lines.append(f"{idx}\n{CaptionService.format_srt_time(st)} --> {CaptionService.format_srt_time(et)}\n{text}\n")
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        return output_path
