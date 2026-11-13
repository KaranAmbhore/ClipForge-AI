const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface User {
  id: number;
  name: string;
  email: string;
  plan: string;
  created_at: string;
}

export interface VideoMetadata {
  is_valid: boolean;
  title?: string;
  author?: string;
  duration?: number;
  thumbnail_url?: string;
  can_auto_download: boolean;
  message: string;
}

export interface UploadResponse {
  video_id: number;
  project_id: number;
  filename: string;
  file_size: number;
  duration: number;
  format: string;
  video_url: string;
}

export interface Project {
  id: number;
  user_id: number;
  original_video_title: string;
  original_video_url?: string;
  source_type: string;
  thumbnail_url?: string;
  video_duration: number;
  processing_status: string;
  created_at: string;
  shorts_count: number;
}

export interface ShortClip {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  start_time: number;
  end_time: number;
  duration: number;
  video_url?: string;
  thumbnail_url?: string;
  engagement_score: number;
  hook?: string;
  category?: string;
  transcript?: string;
  caption_style: string;
  aspect_ratio: string;
  font_size: number;
  font_color: string;
  highlight_color: string;
  caption_position: string;
  created_at: string;
}

export interface JobStatus {
  id: number;
  project_id: number;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  current_stage: string;
  stage_index: number;
  total_stages: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("clipforge_token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to get profile");
    return res.json();
  },

  // Videos & YouTube
  async validateYoutubeUrl(url: string): Promise<VideoMetadata> {
    const res = await fetch(`${API_BASE}/videos/validate-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ url }),
    });
    return res.json();
  },

  async uploadVideo(file: File, title?: string, source_type = "upload", youtube_url?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    formData.append("source_type", source_type);
    if (youtube_url) formData.append("youtube_url", youtube_url);

    const res = await fetch(`${API_BASE}/videos/upload`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
  },

  async getProject(id: number): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Project not found");
    return res.json();
  },

  async deleteProject(id: number): Promise<void> {
    await fetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
  },

  // Processing
  async startProcessing(
    projectId: number,
    settings: {
      num_shorts: number;
      clip_duration: number;
      aspect_ratio: string;
      caption_style: string;
      language: string;
      ai_focus: string;
      include_subtitles: boolean;
      include_ai_title: boolean;
    }
  ): Promise<JobStatus> {
    const res = await fetch(`${API_BASE}/processing/${projectId}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("Failed to start processing");
    return res.json();
  },

  async getJobStatus(jobId: number): Promise<JobStatus> {
    const res = await fetch(`${API_BASE}/processing/${jobId}/status`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to fetch job status");
    return res.json();
  },

  async cancelJob(jobId: number): Promise<JobStatus> {
    const res = await fetch(`${API_BASE}/processing/${jobId}/cancel`, {
      method: "POST",
      headers: getAuthHeader(),
    });
    return res.json();
  },

  // Shorts
  async getProjectShorts(projectId: number): Promise<ShortClip[]> {
    const res = await fetch(`${API_BASE}/shorts/${projectId}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to fetch shorts");
    return res.json();
  },

  async getShortDetail(shortId: number): Promise<ShortClip> {
    const res = await fetch(`${API_BASE}/shorts/detail/${shortId}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Short not found");
    return res.json();
  },

  async updateShort(shortId: number, data: Partial<ShortClip>): Promise<ShortClip> {
    const res = await fetch(`${API_BASE}/shorts/${shortId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Update failed" }));
      throw new Error(err.detail || "Failed to update short");
    }
    return res.json();
  },

  async regenerateShort(shortId: number, settings: any): Promise<ShortClip> {
    const res = await fetch(`${API_BASE}/shorts/${shortId}/regenerate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("Regeneration failed");
    return res.json();
  },

  getDownloadUrl(shortId: number): string {
    return `${API_BASE}/shorts/${shortId}/download`;
  },

  getMediaUrl(path: string | undefined): string {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base = API_BASE.replace("/api", "");
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  },
};
