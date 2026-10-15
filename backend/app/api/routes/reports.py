from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.report import ReportCreateRequest, ReportResponse
from app.services.report_service import create_report, list_reports, delete_report

router = APIRouter(prefix="/reports")

@router.post("", response_model=ReportResponse, status_code=201)
def submit_report_endpoint(req: ReportCreateRequest, db: Session = Depends(get_db)):
    record = create_report(db, req)
    return {
        "id": record.id,
        "url": record.url,
        "hostname": record.hostname,
        "risk_category": record.risk_category,
        "risk_score": record.risk_score,
        "reason": record.reason,
        "notes": record.notes,
        "status": record.status,
        "created_at": record.created_at.isoformat() if record.created_at else ""
    }

@router.get("", response_model=List[ReportResponse])
def get_reports_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    response: Response = None,
    db: Session = Depends(get_db)
):
    items, total_count = list_reports(db, skip=skip, limit=limit)
    if response:
        response.headers["X-Total-Count"] = str(total_count)
    return items

@router.delete("/{report_id}")
def delete_report_endpoint(report_id: str, db: Session = Depends(get_db)):
    success = delete_report(db, report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {"status": "deleted", "id": report_id}
