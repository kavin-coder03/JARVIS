import { CommunityThreatAlert } from '../types';

type AlertListener = (alert: CommunityThreatAlert) => void;
type StatusListener = (connected: boolean, clientCount: number) => void;

class CommunitySocketClient {
  private ws: WebSocket | null = null;
  private alertListeners: Set<AlertListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private isConnected: boolean = false;
  private clientCount: number = 0;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private shouldReconnect: boolean = true;
  private connectAttempts: number = 0;

  public getDeviceId(): string {
    let id = localStorage.getItem('trueqr_device_id');
    if (!id) {
      // Default to host or generated role
      const isServerHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      id = isServerHost ? 'Laptop 1 (Server)' : `Laptop ${Math.floor(Math.random() * 3) + 2}`;
      localStorage.setItem('trueqr_device_id', id);
    }
    return id;
  }

  public setDeviceId(newId: string) {
    localStorage.setItem('trueqr_device_id', newId.trim());
    // Reconnect with new client_id
    this.reconnect();
  }

  public getServerHost(): string {
    const saved = localStorage.getItem('trueqr_server_host');
    if (saved && saved.trim()) return saved.trim();
    if (typeof window !== 'undefined' && window.location.hostname) {
      return window.location.hostname;
    }
    return '172.19.2.220';
  }

  public setServerHost(host: string) {
    localStorage.setItem('trueqr_server_host', host.trim());
    this.reconnect();
  }

  private getWebSocketUrl(): string {
    const host = this.getServerHost();
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const proto = isHttps ? 'wss:' : 'ws:';
    const clientId = encodeURIComponent(this.getDeviceId());

    // If current window is port 5173, we can connect via Vite proxy or direct to 8000
    // Try direct backend port 8000 first, or proxy on 5173
    if (typeof window !== 'undefined' && window.location.port === '5173') {
      // Direct connection to server on port 8000:
      return `${proto}//${host}:8000/api/ws/community?client_id=${clientId}`;
    }

    return `${proto}//${host}:8000/api/ws/community?client_id=${clientId}`;
  }

  public connect() {
    this.shouldReconnect = true;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = this.getWebSocketUrl();
    console.log(`[TrueQR Community] Connecting to WebSocket: ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[TrueQR Community] WebSocket connected successfully');
        this.isConnected = true;
        this.connectAttempts = 0;
        this.notifyStatusListeners();

        // Keep connection alive with periodic ping
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'CONNECTION_ESTABLISHED') {
            this.clientCount = data.connectedClients || 1;
            this.notifyStatusListeners();
          } else if (data.type === 'COMMUNITY_THREAT_ALERT') {
            console.warn('[TrueQR Community] Real-time threat alert received:', data);
            this.notifyAlertListeners(data as CommunityThreatAlert);
          }
        } catch {
          // Non-JSON ping/pong or message
        }
      };

      this.ws.onclose = () => {
        console.log('[TrueQR Community] WebSocket connection closed');
        this.cleanup();
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[TrueQR Community] WebSocket error:', err);
        // Fallback: If port 8000 fails and we are on port 5173, try proxy path
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch (e) {
      console.error('[TrueQR Community] Connection exception:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.connectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, Math.min(this.connectAttempts, 5)), 10000);
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  public reconnect() {
    this.disconnect();
    this.connect();
  }

  public disconnect() {
    this.shouldReconnect = false;
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private cleanup() {
    this.isConnected = false;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.notifyStatusListeners();
  }

  public subscribeAlerts(listener: AlertListener): () => void {
    this.alertListeners.add(listener);
    return () => {
      this.alertListeners.delete(listener);
    };
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.isConnected, this.clientCount);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyAlertListeners(alert: CommunityThreatAlert) {
    this.alertListeners.forEach((listener) => {
      try {
        listener(alert);
      } catch (err) {
        console.error('Error in community alert listener:', err);
      }
    });
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach((listener) => {
      try {
        listener(this.isConnected, this.clientCount);
      } catch (err) {
        console.error('Error in community status listener:', err);
      }
    });
  }

  public getStatus(): { connected: boolean; clientCount: number } {
    return { connected: this.isConnected, clientCount: this.clientCount };
  }
}

export const communitySocket = new CommunitySocketClient();
