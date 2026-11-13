import os
import json
import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

# Cache model instance in memory so it's loaded only once across requests
_local_whisper_model = None

def get_local_whisper_model():
    global _local_whisper_model
    if _local_whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            logger.info("Initializing local faster-whisper (tiny) CPU model...")
            _local_whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
        except Exception as e:
            logger.warning(f"Could not load faster-whisper model: {e}")
            _local_whisper_model = False
    return _local_whisper_model if _local_whisper_model is not False else None

class TranscriptionService:
    @staticmethod
    def transcribe_audio(audio_path: str, duration: float = 60.0, language: str = "en") -> List[Dict[str, Any]]:
        """
        Transcribes real audio:
        1. Uses OpenAI Whisper API if OPENAI_API_KEY is configured.
        2. Otherwise uses the built-in local faster-whisper model (100% free, runs on device, real speech recognition).
        3. If no speech is detected (silent video), falls back to pacing segments.
        """
        # 1. Cloud OpenAI Whisper (if user entered an API key)
        if settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("dummy"):
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                
                with open(audio_path, "rb") as audio_file:
                    logger.info("Calling OpenAI Whisper API for speech-to-text...")
                    response = client.audio.transcriptions.create(
                        model=settings.WHISPER_MODEL,
                        file=audio_file,
                        response_format="verbose_json",
                        timestamp_granularities=["segment"]
                    )
                    
                    segments = []
                    if hasattr(response, "segments") and response.segments:
                        for s in response.segments:
                            text = (s.get("text", "") if isinstance(s, dict) else getattr(s, "text", "")).strip()
                            if text:
                                segments.append({
                                    "start": round(float(s.get("start", 0.0) if isinstance(s, dict) else getattr(s, "start", 0.0)), 2),
                                    "end": round(float(s.get("end", 0.0) if isinstance(s, dict) else getattr(s, "end", 0.0)), 2),
                                    "text": text
                                })
                        if segments:
                            logger.info(f"OpenAI Whisper returned {len(segments)} segments.")
                            return segments
            except Exception as e:
                logger.warning(f"OpenAI Whisper API failed, trying local whisper: {e}")

        # 2. Local Built-in Whisper Model (Offline, Real Speech Extraction, Free)
        local_model = get_local_whisper_model()
        if local_model and os.path.exists(audio_path):
            try:
                logger.info(f"Extracting real speech from {audio_path} using local Whisper...")
                lang_param = language if language and language != "auto" else None
                segments_iter, info = local_model.transcribe(
                    audio_path,
                    language=lang_param,
                    vad_filter=True, # Voice Activity Detection filter to skip dead silence
                    beam_size=1
                )
                
                real_segments = []
                for s in segments_iter:
                    text = s.text.strip()
                    if text:
                        real_segments.append({
                            "start": round(float(s.start), 2),
                            "end": round(float(s.end), 2),
                            "text": text
                        })
                
                if real_segments:
                    logger.info(f"Local Whisper successfully extracted {len(real_segments)} real speech segments! (Lang: {info.language})")
                    return real_segments
                else:
                    logger.info("Local Whisper detected no spoken dialogue in the audio track.")
            except Exception as e:
                logger.warning(f"Local Whisper transcription failed: {e}", exc_info=True)

        # 3. Fallback only if no speech is detected or transcription fails
        logger.info("Falling back to pacing segments for clip generation...")
        return TranscriptionService._generate_dev_transcript(duration)

    @staticmethod
    def _generate_dev_transcript(duration: float) -> List[Dict[str, Any]]:
        segments = []
        step = min(15.0, duration / 3.0)
        t = 0.0
        idx = 1
        while t < duration:
            end_t = min(duration, t + step)
            segments.append({
                "start": round(t, 2),
                "end": round(end_t, 2),
                "text": f"Highlight Section #{idx}"
            })
            t = end_t
            idx += 1
        return segments
