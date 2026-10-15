from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    url: str = Field(..., description="The decoded QR payload or URL to inspect", min_length=1, max_length=4096)
    reference_domain: Optional[str] = Field(None, description="Optional expected domain provided by user", max_length=255)
    source_type: Optional[str] = Field("manual", description="Source: camera, upload, or manual")

class SignalDetail(BaseModel):
    id: str
    name: str
    severity: str  # "info" | "warning" | "danger"
    score_impact: int
    description: str
    actionable_advice: str

class UntriggeredCheck(BaseModel):
    id: str
    name: str
    status: str = "passed"
    description: str

class NormalizedDestination(BaseModel):
    original_input: str
    normalized_url: str
    payload_type: str # "url" | "wifi" | "text" | "email" | "phone" | "unsupported_scheme" | "malformed"
    scheme: Optional[str] = None
    hostname: Optional[str] = None
    registered_domain: Optional[str] = None
    subdomain: Optional[str] = None
    port: Optional[int] = None
    path: Optional[str] = None
    query_params_count: int = 0
    has_credentials: bool = False
    is_secure_transport: bool = False
    is_ip_address: bool = False
    is_shortener: bool = False
    is_internationalized: bool = False
    payment_details: Optional[Dict[str, Any]] = None

class AnalysisResponse(BaseModel):
    risk_score: int
    risk_category: str  # "LOW RISK" | "SUSPICIOUS" | "HIGH RISK"
    destination: NormalizedDestination
    triggered_signals: List[SignalDetail]
    untriggered_checks: List[UntriggeredCheck]
    verdict_headline: str
    verdict_explanation: str
    suggested_action: str
    security_limitations: str
    scan_id: Optional[str] = None
    timestamp: str
