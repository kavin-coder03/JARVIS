import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class ScanRecord(Base):
    __tablename__ = "scan_records"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    payload_type = Column(String(32), default="url", nullable=False)
    original_payload = Column(Text, nullable=False)
    sanitized_url = Column(Text, nullable=True)
    hostname = Column(String(255), nullable=True, index=True)
    scheme = Column(String(32), nullable=True)
    port = Column(Integer, nullable=True)
    risk_score = Column(Integer, nullable=False, default=0)
    risk_category = Column(String(32), nullable=False, default="LOW RISK", index=True)
    source_type = Column(String(32), default="camera", nullable=False) # camera, upload, manual
    reference_domain = Column(String(255), nullable=True)
    signals_json = Column(Text, nullable=False, default="[]") # JSON encoded triggered signals
    untriggered_json = Column(Text, nullable=False, default="[]") # JSON encoded untriggered checks
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

class ReportRecord(Base):
    __tablename__ = "report_records"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    url = Column(Text, nullable=False)
    hostname = Column(String(255), nullable=True, index=True)
    risk_category = Column(String(32), nullable=True)
    risk_score = Column(Integer, nullable=True)
    reason = Column(String(64), nullable=False) # phishing, impersonation, redirect, malware, other
    notes = Column(Text, nullable=True)
    status = Column(String(32), default="submitted", nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

class CommunityThreatReport(Base):
    __tablename__ = "community_threat_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    fingerprint = Column(String(64), nullable=False, index=True)
    risk_level = Column(String(32), nullable=False, default="HIGH RISK", index=True)
    payload_type = Column(String(32), nullable=False, default="url")
    safe_display_target = Column(String(255), nullable=False, index=True)
    raw_payload_preview = Column(Text, nullable=False)
    reasons_json = Column(Text, nullable=False, default="[]")
    reporter_client_id = Column(String(64), nullable=False, default="anonymous")
    status = Column(String(64), nullable=False, default="COMMUNITY REPORTED")
    report_count = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)
    last_reported_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

