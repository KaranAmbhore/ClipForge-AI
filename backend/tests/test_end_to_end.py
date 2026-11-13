import requests
import time
import os

BASE_URL = "http://127.0.0.1:8000/api"

def test_full_pipeline():
    # 1. Health check
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ Health check passed")

    # 2. Validate YouTube URL
    yt_res = requests.post(f"{BASE_URL}/videos/validate-url", json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
    assert yt_res.status_code == 200
    assert yt_res.json()["is_valid"] is True
    print("✓ YouTube URL validation passed")

    # 3. Upload Sample Video
    sample_file = "sample_data/sample_podcast.mp4"
    assert os.path.exists(sample_file), "Sample video file does not exist"
    
    with open(sample_file, "rb") as f:
        upload_res = requests.post(
            f"{BASE_URL}/videos/upload",
            files={"file": ("sample_podcast.mp4", f, "video/mp4")},
            data={"title": "Demo Podcast Episode"}
        )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    upload_data = upload_res.json()
    project_id = upload_data["project_id"]
    print(f"✓ Video uploaded, project ID: {project_id}")

    # 4. Trigger 8-stage processing pipeline
    gen_res = requests.post(
        f"{BASE_URL}/processing/{project_id}/generate",
        json={
            "num_shorts": 2,
            "clip_duration": 8,
            "aspect_ratio": "9:16",
            "caption_style": "modern",
            "language": "en",
            "ai_focus": "engaging",
            "include_subtitles": True,
            "include_ai_title": True
        }
    )
    assert gen_res.status_code == 200, f"Generation failed: {gen_res.text}"
    job_id = gen_res.json()["id"]
    print(f"✓ Processing job initiated, job ID: {job_id}")

    # 5. Poll job status until completion
    max_wait = 60
    start = time.time()
    final_status = None

    while time.time() - start < max_wait:
        st_res = requests.get(f"{BASE_URL}/processing/{job_id}/status")
        assert st_res.status_code == 200
        data = st_res.json()
        print(f"  Stage {data['stage_index']}/8: {data['current_stage']} ({data['progress']:.0f}%)")
        if data["status"] in ["completed", "failed", "cancelled"]:
            final_status = data
            break
        time.sleep(2)

    assert final_status is not None, "Job timed out"
    assert final_status["status"] == "completed", f"Job failed: {final_status.get('error_message')}"
    print("✓ 8-stage video processing completed successfully!")

    # 6. Verify generated shorts
    shorts_res = requests.get(f"{BASE_URL}/shorts/{project_id}")
    assert shorts_res.status_code == 200
    shorts = shorts_res.json()
    assert len(shorts) >= 1, "No shorts were generated"
    print(f"✓ Retrieved {len(shorts)} generated shorts:")
    for s in shorts:
        print(f"  - [{s['aspect_ratio']}] {s['title']} | Score: {s['engagement_score']} | Duration: {s['duration']}s | Video URL: {s['video_url']}")
        assert s["aspect_ratio"] == "9:16"
        assert s["duration"] > 0
        assert s["video_url"] is not None

    # 7. Test Video Editor update & re-render on the first short
    first_short_id = shorts[0]["id"]
    edit_res = requests.put(
        f"{BASE_URL}/shorts/{first_short_id}",
        json={
            "caption_style": "karaoke",
            "aspect_ratio": "9:16",
            "font_size": 28,
            "highlight_color": "#A78BFA",
            "title": "Edited Viral Lesson"
        }
    )
    assert edit_res.status_code == 200
    updated_short = edit_res.json()
    assert updated_short["caption_style"] == "karaoke"
    assert updated_short["title"] == "Edited Viral Lesson"
    print("✓ Video Editor re-render and update succeeded!")

    print("\n🎉 ALL END-TO-END PIPELINE CHECKS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_full_pipeline()
