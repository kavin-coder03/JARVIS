from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.models import ReportRecord
from app.schemas.report import ReportCreateRequest

VALID_REASONS = {"phishing", "impersonation", "suspicious_redirect", "malware", "scam", "other"}

def create_report(db: Session, report_data: ReportCreateRequest) -> ReportRecord:
    reason = report_data.reason.strip().lower()
    if reason not in VALID_REASONS:
        reason = "other"

    # Duplicate check: check if the exact URL was reported within the last 15 minutes
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
    existing = db.query(ReportRecord).filter(
        ReportRecord.url == report_data.url.strip(),
        ReportRecord.reason == reason,
        ReportRecord.created_at >= cutoff
    ).first()
    
    if existing:
        # Return existing to prevent duplicate spam
        return existing

    record = ReportRecord(
        url=report_data.url.strip(),
        hostname=report_data.hostname.strip() if report_data.hostname else None,
        risk_category=report_data.risk_category,
        risk_score=report_data.risk_score,
        reason=reason,
        notes=report_data.notes.strip() if report_data.notes else None,
        status="submitted"
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def list_reports(db: Session, skip: int = 0, limit: int = 50) -> Tuple[List[Dict[str, Any]], int]:
    total_count = db.query(ReportRecord).count()
    records = db.query(ReportRecord).order_by(desc(ReportRecord.created_at)).offset(skip).limit(limit).all()
    
    items = []
    for r in records:
        items.append({
            "id": r.id,
            "url": r.url,
            "hostname": r.hostname,
            "risk_category": r.risk_category,
            "risk_score": r.risk_score,
            "reason": r.reason,
            "notes": r.notes,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else ""
        })
    return items, total_count

def delete_report(db: Session, report_id: str) -> bool:
    record = db.query(ReportRecord).filter(ReportRecord.id == report_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
