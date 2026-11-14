import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)

def setup_module(module):
    Base.metadata.create_all(bind=engine)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ClipForge AI" in data["service"]

def test_register_and_login():
    email = "testuser@clipforge.ai"
    # Register
    res = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": email,
        "password": "Password123!"
    })
    # If already exists or created, test login
    if res.status_code == 200:
        token_data = res.json()
        assert "access_token" in token_data
        assert token_data["user"]["email"] == email

    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_validate_youtube_url():
    # Valid YouTube URL
    res = client.post("/api/videos/validate-url", json={
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert data["can_auto_download"] is True
    assert "YouTube" in data["message"] or "Auto-download" in data["message"]

    # Invalid URL
    bad_res = client.post("/api/videos/validate-url", json={
        "url": "https://notyoutube.com/watch?v=123"
    })
    assert bad_res.status_code == 200
    assert bad_res.json()["is_valid"] is False

def test_download_youtube_invalid_url():
    # Test invalid url rejection
    res = client.post("/api/videos/download-youtube", json={
        "url": "https://invalid-video-site.com/video"
    })
    assert res.status_code == 400

def test_projects_crud():
    # Create project
    res = client.post("/api/projects", json={
        "title": "My Viral Podcast Episode",
        "source_type": "upload",
        "video_duration": 180.0
    })
    assert res.status_code == 200
    proj = res.json()
    proj_id = proj["id"]
    assert proj["original_video_title"] == "My Viral Podcast Episode"

    # List projects
    list_res = client.get("/api/projects")
    assert list_res.status_code == 200
    assert any(p["id"] == proj_id for p in list_res.json())

    # Get project detail
    detail_res = client.get(f"/api/projects/{proj_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == proj_id

    # Delete project
    del_res = client.delete(f"/api/projects/{proj_id}")
    assert del_res.status_code == 204

def test_dynamic_karaoke_captions(tmp_path):
    from app.services.caption_service import CaptionService
    import os

    segments = [
        {
            "start": 0.0,
            "end": 2.5,
            "text": "Everything you are watching",
            "words": [
                {"word": "Everything", "start": 0.0, "end": 0.8},
                {"word": "you", "start": 0.8, "end": 1.4},
                {"word": "are", "start": 1.4, "end": 1.8},
                {"word": "watching", "start": 1.8, "end": 2.5}
            ]
        }
    ]

    ass_path = str(tmp_path / "dynamic_test.ass")
    CaptionService.generate_ass_file(
        segments=segments,
        output_path=ass_path,
        style="karaoke",
        highlight_color="#22C55E"
    )

    assert os.path.exists(ass_path)
    with open(ass_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "BeastStyle" in content
    assert r"\fscx112\fscy112" in content
    assert "Dialogue:" in content
