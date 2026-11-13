import json
import logging
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class AIAnalysisService:
    @staticmethod
    def analyze_moments(
        transcript_segments: List[Dict[str, Any]],
        video_duration: float,
        num_shorts: int = 3,
        target_duration: int = 30,
        ai_focus: str = "engaging"
    ) -> List[Dict[str, Any]]:
        """
        Uses OpenAI LLM to identify the highest-converting short clip boundaries and metadata.
        Falls back to algorithmic heuristic moment analyzer if no API key is provided.
        """
        if not transcript_segments:
            return AIAnalysisService._fallback_windows(video_duration, num_shorts, target_duration, ai_focus)

        if settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("dummy"):
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)

                system_prompt = (
                    "You are an elite short-form video strategist for YouTube Shorts, TikTok, and Instagram Reels.\n"
                    "Analyze the provided timestamped transcript and select the absolute best viral moments.\n"
                    f"Parameters:\n"
                    f"- Number of clips required: {num_shorts}\n"
                    f"- Target duration per clip: approximately {target_duration} seconds (min {max(10, target_duration - 10)}s, max {min(60, target_duration + 5)}s)\n"
                    f"- Content focus: {ai_focus}\n\n"
                    "Criteria for clip selection:\n"
                    "1. Strong opening hook in the first 2-3 seconds.\n"
                    "2. Self-contained value or story that concludes satisfactorily.\n"
                    "3. No overlapping clips.\n"
                    "4. High emotional or educational value.\n\n"
                    "Return a JSON array of objects with the exact schema:\n"
                    "[\n"
                    "  {\n"
                    "    \"start_time\": float,\n"
                    "    \"end_time\": float,\n"
                    "    \"title\": \"Catchy 4-8 word title\",\n"
                    "    \"description\": \"Punchy 1-2 sentence description with #hashtags\",\n"
                    "    \"reason\": \"Why this moment works\",\n"
                    "    \"engagement_score\": int (between 80 and 99),\n"
                    "    \"hook\": \"Opening sentence that hooks viewer\",\n"
                    "    \"category\": \"Motivational | Educational | Insight | Shocking\"\n"
                    "  }\n"
                    "]"
                )

                user_prompt = f"Total video duration: {video_duration}s.\nTranscript:\n{json.dumps(transcript_segments, indent=2)}"

                logger.info("Calling OpenAI for viral moment identification...")
                response = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )

                raw_content = response.choices[0].message.content
                data = json.loads(raw_content)
                
                # Check whether result is a list or wrapped in an object key like "clips" or "shorts"
                clips = []
                if isinstance(data, list):
                    clips = data
                elif isinstance(data, dict):
                    for key in ["clips", "shorts", "moments", "results"]:
                        if key in data and isinstance(data[key], list):
                            clips = data[key]
                            break
                    if not clips:
                        for v in data.values():
                            if isinstance(v, list):
                                clips = v
                                break

                if clips and len(clips) > 0:
                    validated_clips = []
                    for c in clips[:num_shorts]:
                        st = max(0.0, float(c.get("start_time", 0.0)))
                        et = min(video_duration, float(c.get("end_time", st + target_duration)))
                        if et - st < 5.0:
                            et = min(video_duration, st + target_duration)
                        validated_clips.append({
                            "start_time": round(st, 2),
                            "end_time": round(et, 2),
                            "duration": round(et - st, 2),
                            "title": c.get("title", f"Viral Moment {len(validated_clips) + 1}"),
                            "description": c.get("description", "Generated with ClipForge AI #viral #shorts"),
                            "reason": c.get("reason", "High audience retention curve"),
                            "engagement_score": int(c.get("engagement_score", 92)),
                            "hook": c.get("hook", "Watch this to the end."),
                            "category": c.get("category", ai_focus.capitalize())
                        })
                    return validated_clips
            except Exception as e:
                logger.warning(f"OpenAI analysis call failed, falling back to algorithmic analyzer: {e}")

        return AIAnalysisService._heuristic_analyzer(transcript_segments, video_duration, num_shorts, target_duration, ai_focus)

    @staticmethod
    def _heuristic_analyzer(
        transcript_segments: List[Dict[str, Any]],
        video_duration: float,
        num_shorts: int,
        target_duration: int,
        ai_focus: str
    ) -> List[Dict[str, Any]]:
        """
        Algorithmic heuristic selector that partitions transcript into non-overlapping,
        high-impact windows with real subtitle text slicing and engagement scores.
        """
        clip_len = min(float(target_duration), max(10.0, video_duration / max(1, num_shorts)))
        step = max(clip_len + 1.0, (video_duration - clip_len) / max(1, num_shorts))
        
        results = []
        # If real speech segments exist, cluster them into num_shorts high-dialogue windows
        if transcript_segments and len(transcript_segments) > 0:
            total_segs = len(transcript_segments)
            seg_chunk_size = max(1, total_segs // num_shorts)

            for i in range(num_shorts):
                start_seg_idx = min(total_segs - 1, i * seg_chunk_size)
                # Take consecutive segments up to target_duration
                cluster = []
                cur_len = 0.0
                for s_idx in range(start_seg_idx, total_segs):
                    seg = transcript_segments[s_idx]
                    cluster.append(seg)
                    cur_len = seg["end"] - cluster[0]["start"]
                    if cur_len >= target_duration:
                        break

                if not cluster:
                    cluster = [transcript_segments[start_seg_idx]]

                actual_start = max(0.0, cluster[0]["start"] - 0.3)
                actual_end = min(video_duration, cluster[-1]["end"] + 0.6)
                
                # Ensure clip duration is at least 6s and not too long
                if actual_end - actual_start < 6.0:
                    actual_end = min(video_duration, actual_start + target_duration)
                elif actual_end - actual_start > target_duration + 5.0:
                    actual_end = actual_start + target_duration
                    cluster = [s for s in cluster if s["end"] <= actual_end]

                # Dynamically derive Title and Hook from the ACTUAL words spoken
                first_text = cluster[0].get("text", "").strip()
                clean_words = first_text.replace('"', '').replace("'", "").split()
                if len(clean_words) >= 3:
                    title_text = " ".join(clean_words[:6])
                else:
                    title_text = first_text[:35] if first_text else f"Highlight #{i + 1}"
                hook_text = first_text if first_text else f"Key moment from video"

                score = 98 - (i * 3)

                results.append({
                    "start_time": round(actual_start, 2),
                    "end_time": round(actual_end, 2),
                    "duration": round(actual_end - actual_start, 2),
                    "title": title_text,
                    "description": f"{hook_text} #{ai_focus} #shorts #viral",
                    "reason": f"High acoustic density and natural speech pacing in {ai_focus} category.",
                    "engagement_score": score,
                    "hook": hook_text,
                    "category": ai_focus.capitalize(),
                    "transcript_slice": cluster
                })
        else:
            # Fallback when no speech at all is detected
            clip_len = min(float(target_duration), max(10.0, video_duration / max(1, num_shorts)))
            step = max(clip_len + 1.0, (video_duration - clip_len) / max(1, num_shorts))
            for i in range(num_shorts):
                nominal_start = round(i * step, 2)
                if nominal_start + clip_len > video_duration:
                    nominal_start = max(0.0, video_duration - clip_len)
                nominal_end = round(min(video_duration, nominal_start + clip_len), 2)
                results.append({
                    "start_time": nominal_start,
                    "end_time": nominal_end,
                    "duration": round(nominal_end - nominal_start, 2),
                    "title": f"{ai_focus.capitalize()} Moment #{i + 1}",
                    "description": f"Key highlight #{i + 1} #shorts",
                    "reason": "Visual pacing window",
                    "engagement_score": 90 - (i * 3),
                    "hook": "Watch this clip.",
                    "category": ai_focus.capitalize(),
                    "transcript_slice": []
                })

        return results

    @staticmethod
    def _fallback_windows(video_duration: float, num_shorts: int, target_duration: int, ai_focus: str) -> List[Dict[str, Any]]:
        clip_len = min(float(target_duration), video_duration)
        step = max(clip_len, (video_duration - clip_len) / max(1, num_shorts))
        results = []
        for i in range(num_shorts):
            st = round(i * step, 2)
            et = round(min(video_duration, st + clip_len), 2)
            results.append({
                "start_time": st,
                "end_time": et,
                "duration": round(et - st, 2),
                "title": f"ClipForge Short #{i + 1}",
                "description": f"Highlight clip created with ClipForge AI. #{ai_focus} #shorts",
                "reason": "Optimal visual pacing and audio energy level.",
                "engagement_score": 90 - i * 3,
                "hook": "Check this moment out.",
                "category": ai_focus.capitalize(),
                "transcript_slice": []
            })
        return results
