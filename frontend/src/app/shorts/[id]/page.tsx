"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  Edit3,
  RefreshCw,
  Play,
  Pause,
  Flame,
  Clock,
  Sparkles,
  ArrowLeft,
  Share2,
  Check,
  Video,
  Layers,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { api, ShortClip, Project } from "@/lib/api";
import { formatDuration } from "@/lib/utils";

export default function GeneratedShortsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params?.id);

  const [project, setProject] = useState<Project | null>(null);
  const [shorts, setShorts] = useState<ShortClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlayingId, setActivePlayingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (!projectId) return;

    async function loadData() {
      try {
        const [projData, shortsData] = await Promise.all([
          api.getProject(projectId),
          api.getProjectShorts(projectId),
        ]);
        setProject(projData);
        setShorts(shortsData);
      } catch (err) {
        console.error("Failed to load shorts", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  const handleDownloadAll = () => {
    shorts.forEach((s) => {
      const link = document.createElement("a");
      link.href = api.getDownloadUrl(s.id);
      link.download = `${s.title.replace(/\s+/g, "_")}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleCopyShare = (shortId: number) => {
    const url = `${window.location.origin}/editor/${shortId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(shortId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex bg-background">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>{project?.original_video_title || "Generated Shorts"}</span>
              <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Ready
              </span>
            </h1>
            <p className="text-xs text-muted">
              {shorts.length} vertical short-form clip{shorts.length === 1 ? "" : "s"} extracted with burned subtitles
              and viral scores.
            </p>
          </div>

          {/* Download All Button */}
          {shorts.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download All Clips</span>
              </button>
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted">Loading generated shorts...</p>
          </div>
        ) : shorts.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-card border border-border space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No shorts found for this project</h3>
              <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                You can start a new processing job with custom moment parameters.
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold"
            >
              <span>Generate Shorts</span>
            </Link>
          </div>
        ) : (
          /* RESPONSIVE GRID OF GENERATED SHORTS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shorts.map((clip) => {
              const isPlaying = activePlayingId === clip.id;
              const videoSrc = api.getMediaUrl(clip.video_url);

              return (
                <div
                  key={clip.id}
                  className="rounded-3xl bg-card border border-border overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-all shadow-lg group"
                >
                  {/* VIDEO PREVIEW FRAME (9:16 aspect) */}
                  <div className="relative aspect-[9/16] bg-black overflow-hidden flex items-center justify-center">
                    {clip.video_url ? (
                      <video
                        src={videoSrc}
                        controls
                        playsInline
                        poster={api.getMediaUrl(clip.thumbnail_url)}
                        className="w-full h-full object-cover"
                        onPlay={() => setActivePlayingId(clip.id)}
                        onPause={() => setActivePlayingId(null)}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Video className="w-8 h-8 text-muted mx-auto mb-2" />
                        <span className="text-xs text-muted">Processing clip...</span>
                      </div>
                    )}

                    {/* TOP ENGAGEMENT BADGE */}
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-amber-400 font-extrabold text-[11px] border border-white/10 shadow">
                        <Flame className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{clip.engagement_score} VIRAL SCORE</span>
                      </span>
                    </div>

                    {/* TOP RIGHT DURATION */}
                    <div className="absolute top-3 right-3 pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-white font-semibold text-[10px]">
                        <Clock className="w-3 h-3 text-muted" />
                        <span>{formatDuration(clip.duration)}</span>
                      </span>
                    </div>
                  </div>

                  {/* METADATA & ACTIONS */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                          {clip.category || "Highlight"}
                        </span>
                        <span className="text-[11px] text-muted">
                          {clip.start_time.toFixed(1)}s - {clip.end_time.toFixed(1)}s
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{clip.title}</h3>
                      <p className="text-xs text-muted leading-relaxed line-clamp-2">
                        {clip.description || clip.hook}
                      </p>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <Link
                        href={`/editor/${clip.id}`}
                        className="flex-1 py-2 rounded-xl bg-card-border hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-secondary" />
                        <span>Edit Short</span>
                      </Link>

                      <a
                        href={api.getDownloadUrl(clip.id)}
                        download
                        className="py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>MP4</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyShare(clip.id)}
                        title="Copy editor share link"
                        className="p-2 rounded-xl bg-card-border hover:bg-zinc-700 text-muted hover:text-white transition-colors"
                      >
                        {copiedId === clip.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
