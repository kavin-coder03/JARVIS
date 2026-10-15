import sys
from pathlib import Path

# Ensure the backend directory is in sys.path so 'app' can be imported regardless of execution directory
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.database import engine, Base
from app.api.routes import health, analyze, history, reports, community

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TrueQR backend API: inspects QR destination URLs, calculates explainable risk scores, and manages history & reports.",
    lifespan=lifespan
)

# CORS configuration allowing localhost and LAN IP addresses (such as 172.19.2.220)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"]
)

# Register API routes
app.include_router(health.router, prefix=settings.API_PREFIX, tags=["Health"])
app.include_router(analyze.router, prefix=settings.API_PREFIX, tags=["Analysis"])
app.include_router(history.router, prefix=settings.API_PREFIX, tags=["History"])
app.include_router(reports.router, prefix=settings.API_PREFIX, tags=["Reports"])
app.include_router(community.router, prefix=settings.API_PREFIX, tags=["Community"])

# Top-level WebSocket route aliases for flexibility across all clients
app.add_api_websocket_route("/ws/community", community.community_ws_endpoint)
app.add_api_websocket_route("/api/ws/community", community.community_ws_endpoint)

@app.get("/")
def root():
    return {
        "message": "Welcome to TrueQR API. Scan. Inspect. Decide.",
        "documentation": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, app_dir=str(_backend_dir))
