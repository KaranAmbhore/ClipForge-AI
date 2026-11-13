"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Video,
  AudioWaveform,
  FileText,
  BrainCircuit,
  Flame,
  Scissors,
  Subtitles,
  Film,
} from "lucide-react";
import { api, JobStatus } from "@/lib/api";

const STAGES = [
  { index: 1, title: "Uploading video", desc: "Validating format and stream resolution", icon: Video },
  { index: 2, title: "Extracting audio", desc: "Isolating high-fidelity audio stream", icon: AudioWaveform },
  { index: 3, title: "Generating transcript", desc: "Word-level speech recognition via Whisper", icon: FileText },
  { index: 4, title: "Analyzing video content", desc: "Evaluating semantic retention and pacing", icon: BrainCircuit },
  { index: 5, title: "Finding interesting moments", desc: "Ranking opening hooks and viral punchlines", icon: Flame },
  { index: 6, title: "Generating short clips", desc: "Extracting segments with FFmpeg 9:16 reframe", icon: Scissors },
  { index: 7, title: "Creating captions", desc: "Generating ASS animated subtitles & highlights", icon: Subtitles },
  { index: 8, title: "Finalizing videos", desc: "Encoding 1080p MP4 exports and thumbnails", icon: Film },
];

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params?.id);

  const [job, setJob] = useState<JobStatus | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const data = await api.getJobStatus(jobId);
        if (!isMounted) return;
        setJob(data);

        // If completed, navigate to generated shorts gallery
        if (data.status === "completed") {
          clearInterval(pollInterval);
          setTimeout(() => {
            router.push(`/shorts/${data.project_id}`);
          }, 1200);
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          setError(data.error_message || "Processing failed.");
        } else if (data.status === "cancelled") {
          clearInterval(pollInterval);
        }
      } catch (err: any) {
        console.error("Status polling error", err);
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [jobId, router]);

  const handleCancel = async () => {
    if (!jobId) return;
    setIsCancelling(true);
    try {
      const res = await api.cancelJob(jobId);
      setJob(res);
    } catch (err) {
      console.error("Cancel error", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const progress = job?.progress || 10;
  const currentStageIndex = job?.stage_index || 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-background">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/20 text-secondary text-xs font-semibold border border-primary/30">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>AI Pipeline Processing</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {job?.status === "completed"
              ? "All Shorts Generated Successfully!"
              : job?.status === "cancelled"
              ? "Job Cancelled"
              : job?.status === "failed"
              ? "Processing Failed"
              : "Generating Your Viral Shorts"}
          </h1>

          <p className="text-sm text-muted max-w-md mx-auto">
            {job?.status === "completed"
              ? "Redirecting to your generated clips preview..."
              : "ClipForge AI is analyzing transcript pacing, cropping 9:16 vertical frames, and rendering captions."}
          </p>
        </div>

        {/* PROGRESS CARD */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Progress Bar & Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span>{job?.current_stage || "Initializing..."}</span>
              </span>
              <span className="text-secondary">{Math.round(progress)}%</span>
            </div>

            <div className="w-full bg-background rounded-full h-3 overflow-hidden border border-border p-0.5">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500 ease-out glow-purple"
                style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
              />
            </div>
          </div>

          {/* 8 STAGES STEPPER */}
          <div className="space-y-3 pt-2">
            {STAGES.map((s) => {
              const Icon = s.icon;
              const isPast = currentStageIndex > s.index || job?.status === "completed";
              const isCurrent = currentStageIndex === s.index && job?.status === "processing";

              return (
                <div
                  key={s.index}
                  className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? "bg-primary/10 border-primary/40 text-white shadow-sm"
                      : isPast
                      ? "bg-background/40 border-border/60 text-zinc-300"
                      : "bg-transparent border-transparent text-zinc-500 opacity-60"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isPast
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : isCurrent
                        ? "bg-primary/30 text-primary-light border border-primary animate-pulse"
                        : "bg-background border border-border text-zinc-500"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-none ${isCurrent ? "text-primary-light" : ""}`}>
                      {s.index}. {s.title}
                    </p>
                    <p className="text-[11px] text-muted truncate mt-1">{s.desc}</p>
                  </div>

                  {isCurrent && (
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Cancel Button */}
          {job?.status === "processing" && (
            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl bg-card-border hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5 text-zinc-400" />
                <span>{isCancelling ? "Cancelling..." : "Cancel Job"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
