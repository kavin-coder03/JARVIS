from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict

class HistoryItemResponse(BaseModel):
    id: str
    payload_type: str
    original_payload: str
    sanitized_url: Optional[str]
    hostname: Optional[str]
    scheme: Optional[str]
    port: Optional[int]
    risk_score: int
    risk_category: str
    source_type: str
    reference_domain: Optional[str]
    signals_count: int
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class HistoryDetailResponse(BaseModel):
    id: str
    payload_type: str
    original_payload: str
    sanitized_url: Optional[str]
    hostname: Optional[str]
    scheme: Optional[str]
    port: Optional[int]
    risk_score: int
    risk_category: str
    source_type: str
    reference_domain: Optional[str]
    signals: List[Any]
    untriggered: List[Any]
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class HistoryStatsResponse(BaseModel):
    total_scans: int
    low_risk_count: int
    suspicious_count: int
    high_risk_count: int
    latest_scan_at: Optional[str] = None
