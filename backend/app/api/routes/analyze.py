from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.url_analysis import AnalysisRequest, AnalysisResponse
from app.services.risk_analyzer import analyze_url_risk
from app.services.history_service import save_scan_record

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponse)
def analyze_endpoint(
    req: AnalysisRequest,
    save_to_history: bool = Query(True, description="Whether to persist the scan in history"),
    db: Session = Depends(get_db)
):
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="QR payload or URL cannot be empty.")
        
    analysis = analyze_url_risk(
        raw_payload=req.url,
        reference_domain=req.reference_domain,
        source_type=req.source_type or "manual"
    )
    
    scan_id = None
    if save_to_history:
        record = save_scan_record(
            db=db,
            analysis_result=analysis,
            source_type=req.source_type or "manual",
            reference_domain=req.reference_domain
        )
        scan_id = record.id

    analysis["scan_id"] = scan_id
    return analysis
