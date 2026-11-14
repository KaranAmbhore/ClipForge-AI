# ClipForge AI 🎬⚡

**ClipForge AI** is a modern, production-ready SaaS application that converts long-form videos (podcasts, webinars, interviews, keynotes, tutorials) into viral, high-retention short-form videos tailored for **YouTube Shorts**, **Instagram Reels**, and **TikTok**.

---

## 🌟 Key Features

1. **Intelligent AI Moment Selection**:
   - Uses speech cadence, hook intensity, semantic value, and emotional peaks to automatically identify the top viral segments from long videos.
   - Assigns a **Viral Score (0–100)**, suggests catchy titles, and crafts hashtag descriptions.

2. **Smart 9:16 Auto Reframe & Crop**:
   - Hardware-accelerated **FFmpeg** pipeline reframes widescreen 16:9 videos into vertical 9:16 mobile shorts or 1:1 square feed clips.
   - Preserves video quality (1080×1920) with accurate audio-video sync.

3. **Burned Animated Karaoke Subtitles**:
   - Generates high-contrast **ASS (Advanced SubStation Alpha)** subtitles.
   - Supports 4 typography presets: **Modern**, **Bold**, **Karaoke** (word-level animated highlights), and **Minimal**.

4. **In-Browser Video Editor**:
   - Interactive live canvas preview with dynamic timeline scrubber.
   - Fine-tune trim boundaries (`start_time` / `end_time`) to the tenth of a second.
   - Inline transcript editor to customize words, spellings, and timestamps.
   - Real-time FFmpeg re-rendering and instant export.

5. **Flexible Ingestion & Local Auto-Download Engine**:
   - **Local Mode (Default)**: Integrated `yt-dlp` pipeline allows 1-click automatic downloading directly from YouTube links for personal, offline testing.
   - **Compliant Public SaaS Mode**: Configurable via `ENABLE_YOUTUBE_DOWNLOAD=false` to enforce metadata-only validation and direct authorized file uploads.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Zustand |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, Uvicorn |
| **Media Engine** | FFmpeg (auto-detects system binary or bundled static binary via `imageio-ffmpeg`) |
| **AI Layer** | OpenAI GPT-4o / GPT-4o-mini & Whisper STT (with pluggable development fallback engine) |
| **Database** | PostgreSQL / SQLite (zero-config local dev default) |
| **Deployment** | Docker & Docker Compose |

---

## 🚀 Quickstart Guide

### Option 1: Running Locally (Development Mode)

#### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend automated unit tests
python -m pytest tests/test_api.py

# Start FastAPI backend server
python -m uvicorn app.main:app --reload --port 8000
# Or alternatively:
# python run.py
```
Backend will be available at: **http://localhost:8000**  
Interactive Swagger Docs: **http://localhost:8000/docs**

#### 2. Frontend Setup
```bash
# Navigate to frontend directory in another terminal
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend will be available at: **http://localhost:3000**

---

### Option 2: Running with Docker Compose

Make sure you have Docker and Docker Compose installed:
```bash
# Copy example environment file
cp .env.example .env

# Build and launch all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up --build
```
Access the application at **http://localhost:3000**.

---

## 🧪 Developer Demo Mode & Sample Data

ClipForge AI includes a built-in test video generator:
```bash
cd backend
python sample_data/create_sample.py
```
This generates `backend/sample_data/sample_podcast.mp4`, a 20-second test video with synthesized audio and timecode.  
On the **Create Shorts Page** (`/create`), click **"Load 20s Sample Video (Instant Demo)"** to test the entire 8-stage pipeline end-to-end without uploading external media!

---

## 📁 Project Structure

```
AI Clipper / ClipForge AI
├── backend/
│   ├── app/
│   │   ├── api/             # REST API routers (auth, videos, projects, processing, shorts)
│   │   ├── models/          # SQLAlchemy ORM models (User, Project, Video, Short, ProcessingJob)
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   ├── services/        # Business logic (AI analysis, Whisper, FFmpeg reframe, captions)
│   │   ├── workers/         # 8-stage background pipeline worker
│   │   ├── utils/           # Cross-platform FFmpeg runner & validators
│   │   ├── config.py        # Settings & environment variables
│   │   ├── database.py      # Database engine & session
│   │   └── main.py          # FastAPI application & CORS
│   ├── sample_data/         # Sample video generator
│   ├── tests/               # Pytest suite
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Landing page (Hero, URL input, preview, pricing, FAQ)
│   │   │   ├── dashboard/          # Creator dashboard with metrics & recent projects
│   │   │   ├── create/             # Create Shorts page (YouTube validation, upload, settings)
│   │   │   ├── processing/[id]/    # 8-stage live progress tracker
│   │   │   ├── shorts/[id]/        # Generated shorts gallery & preview player
│   │   │   ├── editor/[shortId]/   # Video editor (timeline, captions, aspect ratio, re-export)
│   │   │   ├── projects/           # My Projects manager
│   │   │   ├── settings/           # API keys, profile, subscription tiers
│   │   │   ├── login/ & register/  # Authentication
│   │   │   ├── globals.css         # Dark theme styling & scrollbars
│   │   │   └── layout.tsx          # Root layout
│   │   ├── components/layout/      # Navbar, Sidebar, Footer
│   │   └── lib/                    # API client & Zustand store
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔒 Security & Authorization

- **User Isolation**: Projects and videos are bound to authenticated `user_id` records.
- **Password Security**: Passwords hashed with `bcrypt`.
- **JWT Authentication**: Secure Bearer tokens with configurable expiration.
- **Upload Restrictions**: Enforces maximum file size (500 MB) and whitelisted extensions (`mp4`, `mov`, `webm`, `mkv`).
- **Temporary Cleanup**: Temporary audio and subtitle files are isolated and cleaned up after processing.

---

## 📄 License

Proprietary SaaS license. All rights reserved.
