"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Video,
  Clock,
  Layers,
  Trash2,
  ArrowRight,
  Plus,
  Search,
  ExternalLink,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { api, Project } from "@/lib/api";
import { formatDuration } from "@/lib/utils";

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Error loading projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (projectId: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this project and its generated clips?")) return;

    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.original_video_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex bg-background">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              My Projects
            </h1>
            <p className="text-sm text-muted mt-1">
              Browse, manage, and review all previous video processing sessions.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs text-white placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>

        {/* Projects List / Grid */}
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-card border border-border space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No projects found</h3>
              <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                {searchQuery
                  ? "No projects match your search query."
                  : "Start your first project to convert long videos into viral shorts."}
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Shorts</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-3xl bg-card border border-border overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-all shadow-md group"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-video bg-zinc-900 border-b border-border overflow-hidden flex items-center justify-center">
                  {project.thumbnail_url ? (
                    <img
                      src={api.getMediaUrl(project.thumbnail_url)}
                      alt={project.original_video_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Video className="w-10 h-10 text-muted" />
                  )}

                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-semibold text-white flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted" />
                    <span>{formatDuration(project.video_duration)}</span>
                  </div>

                  <span
                    className={`absolute top-2.5 left-2.5 text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      project.processing_status === "completed"
                        ? "bg-emerald-500/90 text-white"
                        : "bg-zinc-800/90 text-zinc-300"
                    }`}
                  >
                    {project.processing_status}
                  </span>
                </div>

                {/* Metadata & Actions */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-primary-light transition-colors">
                      {project.original_video_title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{project.shorts_count} short{project.shorts_count === 1 ? "" : "s"} generated</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <Link
                      href={
                        project.processing_status === "completed"
                          ? `/shorts/${project.id}`
                          : `/create?project_id=${project.id}`
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-white transition-colors"
                    >
                      <span>{project.processing_status === "completed" ? "Open Shorts" : "Continue"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(project.id, e)}
                      title="Delete Project"
                      className="p-1.5 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
