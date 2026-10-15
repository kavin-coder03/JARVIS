import logging
from datetime import datetime, timezone
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("trueqr.websocket")

class ConnectionManager:
    """
    Central WebSocket Connection Manager for TrueQR.
    Maintains real-time connections from Laptop 1 (server) and Laptops 2, 3, 4 (clients).
    Handles client disconnects/reconnects gracefully without crashing.
    """
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.connection_meta: Dict[WebSocket, Dict[str, Any]] = {}
        self.start_time: datetime = datetime.now(timezone.utc)

    async def connect(self, websocket: WebSocket, client_id: str = "anonymous", client_ip: str = "unknown"):
        await websocket.accept()
        self.active_connections.add(websocket)
        self.connection_meta[websocket] = {
            "client_id": client_id,
            "client_ip": client_ip,
            "connected_at": datetime.now(timezone.utc).isoformat()
        }
        logger.info(f"WebSocket client connected: {client_id} from {client_ip} (Total: {len(self.active_connections)})")

        # Send initial handshake to newly connected client
        try:
            await websocket.send_json({
                "type": "CONNECTION_ESTABLISHED",
                "clientId": client_id,
                "connectedClients": len(self.active_connections),
                "serverTime": datetime.now(timezone.utc).isoformat(),
                "message": "Connected to TrueQR Central Community Server"
            })
        except Exception as e:
            logger.warning(f"Failed to send initial handshake to {client_id}: {e}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        meta = self.connection_meta.pop(websocket, None)
        client_id = meta.get("client_id") if meta else "unknown"
        logger.info(f"WebSocket client disconnected: {client_id} (Remaining: {len(self.active_connections)})")

    async def broadcast(self, message: Dict[str, Any]):
        """
        Broadcasts an event payload to all currently connected clients.
        If a connection fails or is broken, it is cleaned up without crashing the server.
        """
        dead_connections: List[WebSocket] = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error broadcasting to client: {e}")
                dead_connections.append(connection)

        for dead_conn in dead_connections:
            self.disconnect(dead_conn)

    def get_connected_count(self) -> int:
        return len(self.active_connections)

    def get_stats(self) -> Dict[str, Any]:
        return {
            "connected_clients": len(self.active_connections),
            "server_start_time": self.start_time.isoformat(),
            "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds()
        }

# Global singleton connection manager
ws_manager = ConnectionManager()
