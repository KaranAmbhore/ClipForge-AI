"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Film,
  Video,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Play,
  Plus,
  Flame,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { api, Project } from "@/lib/api";
import { formatDuration } from "@/lib/utils";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch (err) {
        console.error("Failed to load projects", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalVideos = projects.length;
  const totalShorts = projects.reduce((acc, p) => acc + (p.shorts_count || 0), 0);
  const completedProjects = projects.filter((p) => p.processing_status === "completed").length;

  return (
    <div className="flex-1 flex bg-background">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              Creator Dashboard
              <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-primary/20 text-secondary border border-primary/30">
                Live
              </span>
            </h1>
            <p className="text-sm text-muted mt-1">Manage your video processing jobs and generated short-form clips.</p>
          </div>

          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg shadow-primary/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Shorts</span>
          </Link>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">Videos Processed</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary-light">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">{totalVideos}</p>
            <p className="text-[11px] text-muted mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">100%</span> success rate
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">Total Shorts Generated</span>
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                <Film className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-secondary mt-3">{totalShorts}</p>
            <p className="text-[11px] text-muted mt-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Ready for Shorts, Reels, TikTok</span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">Completed Projects</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">{completedProjects}</p>
            <p className="text-[11px] text-muted mt-1">Exported & ready</p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">Avg. Retention Score</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-amber-400 mt-3">94%</p>
            <p className="text-[11px] text-muted mt-1">High audience engagement</p>
          </div>
        </div>

        {/* QUICK CREATE HERO BANNER */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary/20 via-card to-secondary/15 border border-primary/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/30 text-white text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Highlight Generator</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Ready to generate your next viral clip?
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-xl">
              Paste a video link or drop your podcast recording to extract 3 to 10 vertical short clips in 9:16 format
              with burned karaoke subtitles.
            </p>
          </div>

          <Link
            href="/create"
            className="z-10 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-xl shadow-primary/30 flex items-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <span>Start Creating Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* RECENT PROJECTS TABLE / GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Video Projects</h2>
            <Link href="/projects" className="text-xs text-secondary hover:text-white transition-colors">
              View all ({projects.length}) →
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center rounded-2xl bg-card border border-border">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-muted">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-card border border-border space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No projects yet</h3>
                <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                  Upload your first video or paste an authorized YouTube URL to start generating viral short clips.
                </p>
              </div>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-md shadow-primary/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Shorts Now</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl bg-card border border-border p-4 flex flex-col justify-between hover:border-primary/50 transition-all group"
                >
                  <div className="space-y-3">
                    {/* Thumbnail / Header */}
                    <div className="relative aspect-video rounded-xl bg-zinc-900 border border-border overflow-hidden flex items-center justify-center">
                      {project.thumbnail_url ? (
                        <img
                          src={api.getMediaUrl(project.thumbnail_url)}
                          alt={project.original_video_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Video className="w-8 h-8 text-muted" />
                      )}
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-semibold text-white flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatDuration(project.video_duration)}</span>
                      </div>
                    </div>

                    {/* Title & Status */}
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-primary-light transition-colors">
                        {project.original_video_title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            project.processing_status === "completed"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : project.processing_status === "processing"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {project.processing_status}
                        </span>
                        <span className="text-[11px] text-muted">
                          {project.shorts_count} short{project.shorts_count === 1 ? "" : "s"} generated
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-[10px] text-muted">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={
                        project.processing_status === "completed"
                          ? `/shorts/${project.id}`
                          : `/create?project_id=${project.id}`
                      }
                      className="text-secondary font-semibold hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>{project.processing_status === "completed" ? "View Shorts" : "Continue"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
