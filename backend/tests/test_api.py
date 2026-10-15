import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db

# Use in-memory SQLite database with StaticPool so all connections share the same memory DB
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_analyze_and_history_workflow():
    # 1. Check stats initially empty
    stats_res = client.get("/api/history/stats")
    assert stats_res.status_code == 200
    assert stats_res.json()["total_scans"] == 0

    # 2. Analyze a safe HTTPS URL
    analyze_res = client.post("/api/analyze", json={
        "url": "https://www.google.com/search?q=security",
        "source_type": "manual"
    })
    assert analyze_res.status_code == 200
    data = analyze_res.json()
    assert data["risk_category"] == "LOW RISK"
    assert data["scan_id"] is not None
    scan_id = data["scan_id"]

    # 3. Analyze a high-risk URL
    high_res = client.post("/api/analyze", json={
        "url": "https://paypal.com@verify-account-security.site/login",
        "source_type": "camera"
    })
    assert high_res.status_code == 200
    assert high_res.json()["risk_category"] == "HIGH RISK"

    # 4. Check stats now has 2 scans
    stats_res2 = client.get("/api/history/stats")
    assert stats_res2.json()["total_scans"] == 2
    assert stats_res2.json()["low_risk_count"] == 1
    assert stats_res2.json()["high_risk_count"] == 1

    # 5. Get history list
    hist_res = client.get("/api/history")
    assert hist_res.status_code == 200
    items = hist_res.json()
    assert len(items) == 2

    # 6. Filter history by category
    filter_res = client.get("/api/history?risk_category=HIGH RISK")
    assert len(filter_res.json()) == 1
    assert filter_res.json()[0]["risk_category"] == "HIGH RISK"

    # 7. Get scan details
    detail_res = client.get(f"/api/history/{scan_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == scan_id

    # 8. Delete one scan
    del_res = client.delete(f"/api/history/{scan_id}")
    assert del_res.status_code == 200

    # 9. Verify 1 remains, then clear all
    assert len(client.get("/api/history").json()) == 1
    clear_res = client.delete("/api/history")
    assert clear_res.status_code == 200
    assert len(client.get("/api/history").json()) == 0

def test_reports_workflow():
    # 1. Submit report
    rep_res = client.post("/api/reports", json={
        "url": "https://fake-bank-login.xyz",
        "hostname": "fake-bank-login.xyz",
        "risk_category": "HIGH RISK",
        "risk_score": 75,
        "reason": "phishing",
        "notes": "Fake credential harvesting page found on parking poster"
    })
    assert rep_res.status_code == 201
    rep_data = rep_res.json()
    rep_id = rep_data["id"]
    assert rep_data["reason"] == "phishing"

    # 2. List reports
    list_res = client.get("/api/reports")
    assert list_res.status_code == 200
    reps = list_res.json()
    assert len(reps) == 1
    assert reps[0]["id"] == rep_id

    # 3. Duplicate protection test (same URL within 15 min returns existing)
    dup_res = client.post("/api/reports", json={
        "url": "https://fake-bank-login.xyz",
        "reason": "phishing"
    })
    assert dup_res.status_code == 201
    assert dup_res.json()["id"] == rep_id

    # 4. Delete report
    del_res = client.delete(f"/api/reports/{rep_id}")
    assert del_res.status_code == 200
    assert len(client.get("/api/reports").json()) == 0
