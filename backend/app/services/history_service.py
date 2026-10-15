import json
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_
from app.db.models import ScanRecord
from app.services.url_parser import sanitize_url_for_storage

def save_scan_record(
    db: Session,
    analysis_result: Dict[str, Any],
    source_type: str = "manual",
    reference_domain: Optional[str] = None
) -> ScanRecord:
    dest = analysis_result["destination"]
    orig_payload = dest.get("original_input", "")
    sanitized_url = sanitize_url_for_storage(dest.get("normalized_url", orig_payload))
    
    signals_json = json.dumps(analysis_result.get("triggered_signals", []))
    untriggered_json = json.dumps(analysis_result.get("untriggered_checks", []))

    record = ScanRecord(
        payload_type=dest.get("payload_type", "url"),
        original_payload=orig_payload,
        sanitized_url=sanitized_url,
        hostname=dest.get("hostname"),
        scheme=dest.get("scheme"),
        port=dest.get("port"),
        risk_score=analysis_result.get("risk_score", 0),
        risk_category=analysis_result.get("risk_category", "LOW RISK"),
        source_type=source_type,
        reference_domain=reference_domain,
        signals_json=signals_json,
        untriggered_json=untriggered_json
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def get_scan_history(
    db: Session,
    query: Optional[str] = None,
    risk_category: Optional[str] = None,
    sort_order: str = "desc", # "desc" | "asc"
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[Dict[str, Any]], int]:
    q = db.query(ScanRecord)
    
    if query:
        search_filter = f"%{query.strip().lower()}%"
        q = q.filter(
            or_(
                ScanRecord.hostname.ilike(search_filter),
                ScanRecord.original_payload.ilike(search_filter),
                ScanRecord.sanitized_url.ilike(search_filter)
            )
        )
        
    if risk_category and risk_category.strip().upper() != "ALL":
        q = q.filter(ScanRecord.risk_category == risk_category.strip().upper())
        
    total_count = q.count()
    
    order_clause = desc(ScanRecord.created_at) if sort_order == "desc" else asc(ScanRecord.created_at)
    records = q.order_by(order_clause).offset(skip).limit(limit).all()
    
    items = []
    for r in records:
        signals = json.loads(r.signals_json or "[]")
        items.append({
            "id": r.id,
            "payload_type": r.payload_type,
            "original_payload": r.original_payload,
            "sanitized_url": r.sanitized_url,
            "hostname": r.hostname,
            "scheme": r.scheme,
            "port": r.port,
            "risk_score": r.risk_score,
            "risk_category": r.risk_category,
            "source_type": r.source_type,
            "reference_domain": r.reference_domain,
            "signals_count": len(signals),
            "created_at": r.created_at.isoformat() if r.created_at else ""
        })
        
    return items, total_count

def get_scan_by_id(db: Session, scan_id: str) -> Optional[Dict[str, Any]]:
    record = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not record:
        return None
        
    return {
        "id": record.id,
        "payload_type": record.payload_type,
        "original_payload": record.original_payload,
        "sanitized_url": record.sanitized_url,
        "hostname": record.hostname,
        "scheme": record.scheme,
        "port": record.port,
        "risk_score": record.risk_score,
        "risk_category": record.risk_category,
        "source_type": record.source_type,
        "reference_domain": record.reference_domain,
        "signals": json.loads(record.signals_json or "[]"),
        "untriggered": json.loads(record.untriggered_json or "[]"),
        "created_at": record.created_at.isoformat() if record.created_at else ""
    }

def delete_scan_record(db: Session, scan_id: str) -> bool:
    record = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True

def clear_all_history(db: Session) -> int:
    deleted_count = db.query(ScanRecord).delete()
    db.commit()
    return deleted_count

def get_history_stats(db: Session) -> Dict[str, Any]:
    total = db.query(ScanRecord).count()
    low = db.query(ScanRecord).filter(ScanRecord.risk_category == "LOW RISK").count()
    suspicious = db.query(ScanRecord).filter(ScanRecord.risk_category == "SUSPICIOUS").count()
    high = db.query(ScanRecord).filter(ScanRecord.risk_category == "HIGH RISK").count()
    latest = db.query(ScanRecord).order_by(desc(ScanRecord.created_at)).first()
    
    return {
        "total_scans": total,
        "low_risk_count": low,
        "suspicious_count": suspicious,
        "high_risk_count": high,
        "latest_scan_at": latest.created_at.isoformat() if (latest and latest.created_at) else None
    }
