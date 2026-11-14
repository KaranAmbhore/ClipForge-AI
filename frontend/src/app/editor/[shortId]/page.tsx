"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  Type,
  Crop,
  Sliders,
  Check,
  Film,
  Plus,
  Trash2,
  Clock,
  Palette,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
} from "lucide-react";
import { api, ShortClip } from "@/lib/api";
import { formatTimecode, formatDuration } from "@/lib/utils";

export default function VideoEditorPage() {
  const params = useParams();
  const router = useRouter();
  const shortId = Number(params?.shortId);

  const videoRef = useRef<HTMLVideoElement>(null);

  const [clip, setClip] = useState<ShortClip | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editor State
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(30);

  // Editable parameters
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [captionStyle, setCaptionStyle] = useState("modern");
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [highlightColor, setHighlightColor] = useState("#FBBF24");
  const [captionPosition, setCaptionPosition] = useState("bottom");

  // Subtitle segments
  const [subtitles, setSubtitles] = useState<Array<{ start: number; end: number; text: string }>>([]);

  useEffect(() => {
    if (!shortId) return;

    async function loadShort() {
      try {
        const data = await api.getShortDetail(shortId);
        setClip(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setStartTime(data.start_time);
        setEndTime(data.end_time);
        setAspectRatio(data.aspect_ratio || "9:16");
        setCaptionStyle(data.caption_style || "modern");
        setFontSize(data.font_size || 38);
        setFontColor(data.font_color || "#FBBF24");
        setHighlightColor(data.highlight_color || "#FFFFFF");
        setCaptionPosition(data.caption_position || "center");

        if (data.transcript) {
          try {
            const parsed = JSON.parse(data.transcript);
            if (Array.isArray(parsed)) {
              setSubtitles(parsed);
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error("Failed to load short for editing", err);
      } finally {
        setLoading(false);
      }
    }
    loadShort();
  }, [shortId]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSubtitleTextChange = (index: number, newText: string) => {
    setSubtitles((prev) => {
      const copy = [...prev];
      copy[index].text = newText;
      return copy;
    });
  };

  const handleSaveAndExport = async () => {
    if (!shortId) return;
    setIsRendering(true);
    setSaveSuccess(false);

    try {
      const updated = await api.updateShort(shortId, {
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        aspect_ratio: aspectRatio,
        caption_style: captionStyle,
        font_size: fontSize,
        font_color: fontColor,
        highlight_color: highlightColor,
        caption_position: captionPosition,
        transcript: JSON.stringify(subtitles),
      });

      setClip(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Force video reload
      if (videoRef.current) {
        videoRef.current.load();
      }
    } catch (err: any) {
      console.error("Export error", err);
      alert(err.message || "Failed to render video edits.");
    } finally {
      setIsRendering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen">
      {/* Top Navbar */}
      <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={clip ? `/shorts/${clip.project_id}` : "/dashboard"}
            className="p-2 rounded-xl bg-card-border hover:bg-zinc-700 text-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Video Editor</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/20 text-secondary border border-primary/30">
                {aspectRatio}
              </span>
            </h1>
            <p className="text-[11px] text-muted truncate max-w-sm">{title}</p>
          </div>
        </div>

        {/* Export & Download Actions */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
              <Check className="w-4 h-4" /> Export Complete
            </span>
          )}

          <a
            href={api.getDownloadUrl(shortId)}
            download
            className="px-4 py-2 rounded-xl bg-card-border hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download MP4</span>
          </a>

          <button
            type="button"
            onClick={handleSaveAndExport}
            disabled={isRendering}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/30 disabled:opacity-50"
          >
            {isRendering ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Re-Rendering with FFmpeg...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-Render & Save</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace: 3 Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Subtitle Word/Line Editor (4 cols) */}
        <div className="lg:col-span-4 border-r border-border p-6 overflow-y-auto max-h-[calc(100vh-4rem)] space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" />
              <span>Subtitle & Transcript Editor</span>
            </h3>
            <p className="text-xs text-muted">Edit caption text and timestamps burned into the final export.</p>
          </div>

          <div className="space-y-3">
            {subtitles.length === 0 ? (
              <div className="p-6 rounded-2xl bg-card border border-border text-center text-xs text-muted">
                No transcript segments found for this clip.
              </div>
            ) : (
              subtitles.map((sub, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-card border border-border space-y-2 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span className="font-semibold text-secondary">Segment #{idx + 1}</span>
                    <span>
                      {sub.start.toFixed(1)}s → {sub.end.toFixed(1)}s
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={sub.text}
                    onChange={(e) => handleSubtitleTextChange(idx, e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-background border border-border text-xs text-white placeholder-muted focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Column: Video Canvas Player (5 cols) */}
        <div className="lg:col-span-5 p-6 flex flex-col items-center justify-between bg-zinc-950/60 overflow-y-auto">
          {/* Dynamic Video Aspect Container */}
          <div
            className={`w-full max-w-sm rounded-3xl bg-black border border-card-border overflow-hidden relative shadow-2xl flex items-center justify-center my-auto ${
              aspectRatio === "9:16"
                ? "aspect-[9/16]"
                : aspectRatio === "1:1"
                ? "aspect-square"
                : "aspect-video"
            }`}
          >
            {clip?.video_url && (
              <video
                ref={videoRef}
                src={api.getMediaUrl(clip.video_url)}
                playsInline
                className="w-full h-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
            )}

            {/* Live Play/Pause Center Button Overlay */}
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-transform active:scale-90"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
          </div>

          {/* Timeline & Scrubber Bar */}
          <div className="w-full max-w-sm mt-4 p-4 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>

            <input
              type="range"
              min={0}
              max={duration || 30}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentTime(val);
                if (videoRef.current) videoRef.current.currentTime = val;
              }}
              className="w-full accent-primary cursor-pointer"
            />

            {/* Trimmer Controls */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted">Start Trim (sec)</label>
                <input
                  type="number"
                  step={0.5}
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted">End Trim (sec)</label>
                <input
                  type="number"
                  step={0.5}
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Caption Typography & Aspect Ratio Styling (3 cols) */}
        <div className="lg:col-span-3 border-l border-border p-6 overflow-y-auto max-h-[calc(100vh-4rem)] space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <span>Styling & Format</span>
            </h3>
            <p className="text-xs text-muted">Customize caption appearance and canvas aspect ratio.</p>
          </div>

          {/* Aspect Ratio Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <Crop className="w-3.5 h-3.5 text-primary" />
              <span>Aspect Ratio</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["9:16", "1:1", "16:9"].map((ar) => (
                <button
                  key={ar}
                  type="button"
                  onClick={() => setAspectRatio(ar)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    aspectRatio === ar
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-card border-border text-muted hover:text-white"
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Caption Style Preset */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted">Caption Style Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "modern", label: "Modern" },
                { id: "karaoke", label: "Karaoke" },
                { id: "bold", label: "Bold" },
                { id: "minimal", label: "Minimal" },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setCaptionStyle(st.id)}
                  className={`py-2 px-3 rounded-xl text-left border transition-all ${
                    captionStyle === st.id
                      ? "bg-primary/20 text-white border-primary"
                      : "bg-card border-border text-muted hover:text-white"
                  }`}
                >
                  <p className="text-xs font-bold">{st.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>Font Size</span>
              <span className="text-white">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={16}
              max={60}
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted flex items-center gap-1">
                <Palette className="w-3 h-3 text-primary" />
                <span>Text Color</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <span className="text-xs text-white uppercase">{fontColor}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted flex items-center gap-1">
                <Palette className="w-3 h-3 text-secondary" />
                <span>Highlight Color</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <span className="text-xs text-white uppercase">{highlightColor}</span>
              </div>
            </div>
          </div>

          {/* Caption Position */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted">Caption Position</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "top", label: "Top", icon: AlignVerticalJustifyStart },
                { id: "center", label: "Center", icon: AlignVerticalJustifyCenter },
                { id: "bottom", label: "Bottom", icon: AlignVerticalJustifyEnd },
              ].map((pos) => {
                const Icon = pos.icon;
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setCaptionPosition(pos.id)}
                    className={`py-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-all ${
                      captionPosition === pos.id
                        ? "bg-primary/20 text-white border-primary"
                        : "bg-card border-border text-muted hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{pos.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Description Fields */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">Short Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">Description & Hashtags</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-card border border-border text-xs text-white resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
