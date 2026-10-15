import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db

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

def test_community_websocket_and_alert_broadcast():
    # 1. Connect WebSocket client (simulating Laptop 2 / 3 / 4)
    with client.websocket_connect("/api/ws/community?client_id=Laptop-2") as websocket:
        # Initial handshake received
        handshake = websocket.receive_json()
        assert handshake["type"] == "CONNECTION_ESTABLISHED"
        assert handshake["clientId"] == "Laptop-2"

        # 2. Laptop 1 reports a HIGH RISK fake QR
        res = client.post("/api/community/alert", json={
            "url": "https://paypal.com@verify-fake-login.site/auth",
            "hostname": "verify-fake-login.site",
            "risk_level": "HIGH RISK",
            "risk_score": 90,
            "reasons": ["RFC 3986 Userinfo Spoof", "Phishing Credential Theft"],
            "reporter_client_id": "Laptop 1 (Server)"
        })
        assert res.status_code == 201
        data = res.json()
        assert data["type"] == "COMMUNITY_THREAT_ALERT"
        assert data["hostname"] == "verify-fake-login.site"
        assert data["reporter_client_id"] == "Laptop 1 (Server)"

        # 3. Laptop 2 immediately receives the broadcast event over WebSocket
        incoming_alert = websocket.receive_json()
        assert incoming_alert["type"] == "COMMUNITY_THREAT_ALERT"
        assert incoming_alert["hostname"] == "verify-fake-login.site"
        assert incoming_alert["risk_level"] == "HIGH RISK"
        assert "RFC 3986 Userinfo Spoof" in incoming_alert["reasons"]

    # 4. Verify alerts list endpoint
    list_res = client.get("/api/community/alerts")
    assert list_res.status_code == 200
    alerts = list_res.json()
    assert len(alerts) >= 1
    assert alerts[0]["safe_display_target"] == "verify-fake-login.site"
