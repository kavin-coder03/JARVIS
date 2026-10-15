from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class ReportCreateRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=4096)
    hostname: Optional[str] = Field(None, max_length=255)
    risk_category: Optional[str] = Field(None, max_length=32)
    risk_score: Optional[int] = Field(None, ge=0, le=100)
    reason: str = Field(..., min_length=2, max_length=64)
    notes: Optional[str] = Field(None, max_length=1000)

class ReportResponse(BaseModel):
    id: str
    url: str
    hostname: Optional[str]
    risk_category: Optional[str]
    risk_score: Optional[int]
    reason: str
    notes: Optional[str]
    status: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)
