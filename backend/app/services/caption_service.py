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
        seconds = max(0.0, float(seconds))
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
        seconds = max(0.0, float(seconds))
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
    def extract_words_from_segments(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extracts word-level timestamps from segments.
        If segment doesn't contain word-level timings, synthesizes them proportionally.
        """
        all_words = []
        for seg in segments:
            seg_st = float(seg.get("start", 0.0))
            seg_et = float(seg.get("end", seg_st + 2.0))
            words_in_seg = seg.get("words", [])

            if words_in_seg:
                for w in words_in_seg:
                    w_text = str(w.get("word", "")).strip()
                    if w_text:
                        w_st = max(0.0, float(w.get("start", seg_st)))
                        w_et = max(w_st + 0.1, float(w.get("end", seg_et)))
                        all_words.append({
                            "word": w_text,
                            "start": w_st,
                            "end": w_et
                        })
            else:
                text = str(seg.get("text", "")).strip()
                tokens = text.split()
                if not tokens:
                    continue
                total_chars = sum(len(t) for t in tokens)
                cur_time = seg_st
                total_dur = max(0.4, seg_et - seg_st)
                for t in tokens:
                    word_dur = (len(t) / max(1, total_chars)) * total_dur
                    all_words.append({
                        "word": t,
                        "start": round(cur_time, 2),
                        "end": round(cur_time + max(0.12, word_dur), 2)
                    })
                    cur_time += word_dur

        return all_words

    @staticmethod
    def chunk_words(words: List[Dict[str, Any]], max_words: int = 3, max_chars: int = 18) -> List[List[Dict[str, Any]]]:
        """
        Groups words into punchy, high-retention chunks (1-3 words) for Shorts/Reels/TikTok.
        """
        chunks = []
        i = 0
        n = len(words)
        while i < n:
            chunk = []
            char_count = 0
            while i < n:
                w = words[i]
                w_len = len(w["word"])
                if chunk and (len(chunk) >= max_words or (char_count + w_len) > max_chars):
                    break
                chunk.append(w)
                char_count += w_len + 1
                i += 1
            if not chunk and i < n:
                chunk.append(words[i])
                i += 1
            if chunk:
                chunks.append(chunk)
        return chunks

    @staticmethod
    def generate_ass_file(
        segments: List[Dict[str, Any]],
        output_path: str,
        style: str = "karaoke",
        font_size: int = 38,
        font_color: str = "#FBBF24",
        highlight_color: str = "#FFFFFF",
        position: str = "center"
    ) -> str:
        """
        Generates an ASS subtitle file with dynamic word-by-word animated typography,
        featuring a thin stylish colorful border and vibrant contrast.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        primary_ass = CaptionService.hex_to_ass_color(font_color)
        highlight_ass = CaptionService.hex_to_ass_color(highlight_color)

        # Stylish, attractive thin border colors tailored to match the font palette
        # (replaces harsh thick black borders with modern, colorful aesthetic outlines)
        fc_clean = font_color.strip().lstrip("#").lower()
        if fc_clean in ["fbbf24", "facc15", "eab308", "f59e0b", "ffd700", "ffff00"]:
            # Gold / Yellow text -> Deep rich electric violet outline
            outline_color = "&H004B1428&"
        elif fc_clean in ["22c55e", "10b981", "16a34a", "00ff00", "4ade80"]:
            # Green / Lime text -> Deep cyber forest / teal outline
            outline_color = "&H002E3806&"
        elif fc_clean in ["ef4444", "f87171", "dc2626", "ff0000", "ff5722"]:
            # Red / Orange text -> Deep burgundy outline
            outline_color = "&H00180838&"
        elif fc_clean in ["06b6d4", "38bdf8", "0ea5e9", "00ffff"]:
            # Cyan / Blue text -> Deep navy outline
            outline_color = "&H003B1A10&"
        else:
            # Default stylish dark indigo / slate border
            outline_color = "&H003B1A28&"

        # Vertical alignment: 5 = middle-center (default), 2 = bottom-center, 8 = top-center
        align = "5"
        margin_v = "0"
        if position == "bottom":
            align = "2"
            margin_v = "320"
        elif position == "top":
            align = "8"
            margin_v = "240"

        # Thin, modern stylish outline and subtle depth shadow
        outline = "1.8"
        shadow = "1.5"
        bold = "-1"  # Bold in ASS
        font_name = "Arial Black"
        # 38px base font size maps to 76pt in 1080x1920 portrait canvas
        ass_font_size = int(font_size * 2)

        if style == "bold":
            ass_font_size = int(ass_font_size * 1.08)
            outline = "2.0"
            shadow = "2.0"
        elif style == "minimal":
            font_name = "Arial"
            ass_font_size = max(38, int(font_size * 1.3))
            outline = "1.2"
            shadow = "0.8"
            bold = "0"
            if position == "bottom":
                margin_v = "200"

        ass_content = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: BeastStyle,{font_name},{ass_font_size},{primary_ass},{highlight_ass},{outline_color},&H70000000&,{bold},0,0,0,100,100,1,0,1,{outline},{shadow},{align},40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        words = CaptionService.extract_words_from_segments(segments)
        events = []

        if not words:
            # Fallback if no words extracted
            for seg in segments:
                st = max(0.0, float(seg.get("start", 0.0)))
                et = max(st + 0.5, float(seg.get("end", st + 2.0)))
                text = str(seg.get("text", "")).strip().upper()
                if text:
                    events.append(f"Dialogue: 0,{CaptionService.format_ass_time(st)},{CaptionService.format_ass_time(et)},BeastStyle,,0,0,0,,{{\\blur1.2}}{text}")
        elif style == "minimal":
            # Minimal: 3-word chunks without per-word highlight
            chunks = CaptionService.chunk_words(words, max_words=4, max_chars=24)
            for chunk in chunks:
                c_st = chunk[0]["start"]
                c_et = max(c_st + 0.4, chunk[-1]["end"])
                text = " ".join(w["word"] for w in chunk)
                events.append(f"Dialogue: 0,{CaptionService.format_ass_time(c_st)},{CaptionService.format_ass_time(c_et)},BeastStyle,,0,0,0,,{{\\blur1.0}}{text}")
        else:
            # Dynamic Word-to-Word Highlighting (MrBeast / Karaoke / Modern / Bold)
            max_words_per_chunk = 2 if style == "bold" else 3
            chunks = CaptionService.chunk_words(words, max_words=max_words_per_chunk, max_chars=18)

            for chunk in chunks:
                chunk_len = len(chunk)
                for curr_idx, curr_word in enumerate(chunk):
                    w_start = curr_word["start"]
                    if curr_idx < chunk_len - 1:
                        w_end = max(w_start + 0.12, chunk[curr_idx + 1]["start"])
                    else:
                        w_end = max(w_start + 0.25, curr_word["end"])

                    start_ass = CaptionService.format_ass_time(w_start)
                    end_ass = CaptionService.format_ass_time(w_end)

                    # Build the chunk line: active word lights up in highlight_color with a subtle 112% pop scale,
                    # while inactive words in the chunk remain in the vibrant primary font_color
                    line_parts = []
                    for j, w in enumerate(chunk):
                        word_str = w["word"].upper()
                        if j == curr_idx:
                            # Active word: Highlight color + 112% pop scale
                            line_parts.append(f"{{\\c{highlight_ass}\\fscx112\\fscy112}}{word_str}{{\\r\\c{primary_ass}\\blur1.2}}")
                        else:
                            # Inactive word in chunk: Vibrant primary font color
                            line_parts.append(f"{{\\c{primary_ass}}}{word_str}")

                    formatted_line = "{\\blur1.2}" + " ".join(line_parts)
                    events.append(f"Dialogue: 0,{start_ass},{end_ass},BeastStyle,,0,0,0,,{formatted_line}")

        ass_content += "\n".join(events) + "\n"

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(ass_content)

        logger.info(f"Generated dynamic ASS subtitles: {output_path} ({len(events)} events)")
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
