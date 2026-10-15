import io
import csv
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.history import HistoryItemResponse, HistoryDetailResponse, HistoryStatsResponse
from app.services.history_service import (
    get_scan_history,
    get_scan_by_id,
    delete_scan_record,
    clear_all_history,
    get_history_stats
)

router = APIRouter(prefix="/history")

@router.get("/stats", response_model=HistoryStatsResponse)
def get_stats_endpoint(db: Session = Depends(get_db)):
    return get_history_stats(db)

@router.get("", response_model=List[HistoryItemResponse])
def get_history_endpoint(
    q: Optional[str] = Query(None, description="Search query across hostname or URL"),
    risk_category: Optional[str] = Query(None, description="Filter: LOW RISK, SUSPICIOUS, HIGH RISK"),
    sort: str = Query("desc", description="Sort order: desc or asc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    response: Response = None,
    db: Session = Depends(get_db)
):
    items, total_count = get_scan_history(
        db=db,
        query=q,
        risk_category=risk_category,
        sort_order=sort,
        skip=skip,
        limit=limit
    )
    if response:
        response.headers["X-Total-Count"] = str(total_count)
    return items

@router.get("/export")
def export_history_endpoint(
    format: str = Query("json", description="Export format: json or csv"),
    db: Session = Depends(get_db)
):
    items, _ = get_scan_history(db=db, skip=0, limit=1000)
    
    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp", "Type", "Hostname", "URL", "Risk Category", "Risk Score", "Source", "Signals Count"])
        for item in items:
            writer.writerow([
                item["id"],
                item["created_at"],
                item["payload_type"],
                item["hostname"] or "",
                item["sanitized_url"] or item["original_payload"],
                item["risk_category"],
                item["risk_score"],
                item["source_type"],
                item["signals_count"]
            ])
        output.seek(0)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=trueqr-history.csv"}
        )
    else:
        return items

@router.get("/{scan_id}", response_model=HistoryDetailResponse)
def get_scan_detail_endpoint(scan_id: str, db: Session = Depends(get_db)):
    record = get_scan_by_id(db, scan_id)
    if not record:
        raise HTTPException(status_code=404, detail="Scan record not found.")
    return record

@router.delete("/{scan_id}")
def delete_scan_endpoint(scan_id: str, db: Session = Depends(get_db)):
    success = delete_scan_record(db, scan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scan record not found.")
    return {"status": "deleted", "id": scan_id}

@router.delete("")
def clear_history_endpoint(db: Session = Depends(get_db)):
    deleted = clear_all_history(db)
    return {"status": "cleared", "deleted_count": deleted}
