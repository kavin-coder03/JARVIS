import json
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.db.models import CommunityThreatReport
from app.core.websocket_manager import ws_manager

logger = logging.getLogger("trueqr.community")

router = APIRouter()

class CommunityThreatCreate(BaseModel):
    url: str = Field(..., min_length=1, max_length=4096)
    hostname: Optional[str] = Field(None, max_length=255)
    risk_level: str = Field("HIGH RISK", max_length=32)
    risk_score: Optional[int] = Field(None, ge=0, le=100)
    reasons: List[str] = Field(default_factory=list)
    reporter_client_id: Optional[str] = Field("Laptop 1", max_length=64)
    notes: Optional[str] = Field(None, max_length=1000)

@router.websocket("/ws/community")
async def community_ws_endpoint(
    websocket: WebSocket,
    client_id: str = Query("anonymous")
):
    """
    Persistent WebSocket connection endpoint for real-time community alerts.
    Maintains connection across Laptop 1 (server) and Laptops 2, 3, 4 (clients).
    """
    client_ip = websocket.client.host if websocket.client else "unknown"
    await ws_manager.connect(websocket, client_id=client_id, client_ip=client_ip)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)

@router.post("/community/alert", status_code=201)
async def broadcast_threat_alert(
    req: CommunityThreatCreate,
    db: Session = Depends(get_db)
):
    """
    Records a high-risk fake QR threat in the database and broadcasts
    a COMMUNITY_THREAT_ALERT event in real time to all connected laptops.
    """
    target_url = req.url.strip()
    host = req.hostname.strip() if req.hostname else "Unspecified Host"
    fingerprint = f"{host}_{req.risk_level}"
    reasons_json_str = json.dumps(req.reasons)
    now = datetime.now(timezone.utc)

    # Check if already reported to throttle/aggregate
    existing = db.query(CommunityThreatReport).filter(
        (CommunityThreatReport.raw_payload_preview == target_url) |
        (CommunityThreatReport.fingerprint == fingerprint)
    ).first()

    if existing:
        existing.report_count += 1
        existing.last_reported_at = now
        if req.reporter_client_id and existing.reporter_client_id == "anonymous":
            existing.reporter_client_id = req.reporter_client_id
        db.commit()
        db.refresh(existing)
        record = existing
    else:
        record = CommunityThreatReport(
            fingerprint=fingerprint,
            risk_level=req.risk_level,
            payload_type="url",
            safe_display_target=host,
            raw_payload_preview=target_url,
            reasons_json=reasons_json_str,
            reporter_client_id=req.reporter_client_id or "Laptop 1",
            status="COMMUNITY REPORTED",
            report_count=1,
            created_at=now,
            last_reported_at=now
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    # Real-time event payload sent to all connected laptops
    alert_event: Dict[str, Any] = {
        "type": "COMMUNITY_THREAT_ALERT",
        "report_id": record.id,
        "timestamp": record.created_at.isoformat() if record.created_at else now.isoformat(),
        "risk_level": record.risk_level,
        "risk_score": req.risk_score or 85,
        "safe_display_target": record.safe_display_target,
        "destination": record.raw_payload_preview,
        "hostname": record.safe_display_target,
        "reasons": req.reasons if req.reasons else ["High-Risk Deceptive QR Destination"],
        "reporter_client_id": record.reporter_client_id,
        "status": record.status,
        "report_count": record.report_count
    }

    # Broadcast to all connected clients
    await ws_manager.broadcast(alert_event)
    logger.info(f"Broadcasted COMMUNITY_THREAT_ALERT for {record.safe_display_target} to {ws_manager.get_connected_count()} clients")

    return alert_event

@router.get("/community/alerts")
def list_community_alerts(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns recent community threat alerts stored in SQLite.
    """
    records = db.query(CommunityThreatReport).order_by(desc(CommunityThreatReport.last_reported_at)).limit(limit).all()
    results = []
    for r in records:
        try:
            reasons = json.loads(r.reasons_json)
        except Exception:
            reasons = []
        results.append({
            "id": r.id,
            "fingerprint": r.fingerprint,
            "risk_level": r.risk_level,
            "safe_display_target": r.safe_display_target,
            "destination": r.raw_payload_preview,
            "hostname": r.safe_display_target,
            "reasons": reasons,
            "reporter_client_id": r.reporter_client_id,
            "status": r.status,
            "report_count": r.report_count,
            "created_at": r.created_at.isoformat() if r.created_at else "",
            "last_reported_at": r.last_reported_at.isoformat() if r.last_reported_at else ""
        })
    return results

@router.get("/community/status")
def get_community_status():
    """
    Returns connected clients count and server uptime.
    """
    return ws_manager.get_stats()
