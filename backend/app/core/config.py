import os

class Settings:
    PROJECT_NAME: str = "TrueQR — The QR Destination Safety Assistant"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./trueqr.db")
    
    # CORS
    ALLOWED_ORIGINS: list[str] = [
        origin.strip() 
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://172.19.2.220:5173,http://172.19.2.220:8000,http://172.19.2.220"
        ).split(",")
        if origin.strip()
    ]
    
    # Thresholds for heuristic scoring
    LOW_RISK_MAX: int = int(os.getenv("LOW_RISK_MAX", "24"))
    SUSPICIOUS_MAX: int = int(os.getenv("SUSPICIOUS_MAX", "59"))
    
    # Upload limits
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(10 * 1024 * 1024))) # 10MB

settings = Settings()
