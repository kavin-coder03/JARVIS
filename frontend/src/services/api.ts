import {
  AnalysisResponse,
  HistoryItem,
  HistoryStats,
  ReportItem,
  ReportCreateInput,
  CommunityThreatAlert,
  CommunityThreatCreateInput
} from '../types';

const API_BASE = '/api';

export async function checkHealth(): Promise<{ status: string; version?: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error('Health check non-200');
    return await res.json();
  } catch (err) {
    return { status: 'offline' };
  }
}

export async function analyzePayload(
  url: string,
  referenceDomain?: string,
  sourceType: string = 'manual',
  saveHistory: boolean = true
): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze?save_to_history=${saveHistory}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      reference_domain: referenceDomain || null,
      source_type: sourceType,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Analysis failed with status ${res.status}`);
  }

  return await res.json();
}

export async function getHistoryStats(): Promise<HistoryStats> {
  const res = await fetch(`${API_BASE}/history/stats`);
  if (!res.ok) throw new Error('Failed to fetch history stats');
  return await res.json();
}

export async function getHistoryList(
  query?: string,
  riskCategory?: string,
  sort: string = 'desc',
  skip: number = 0,
  limit: number = 50
): Promise<{ items: HistoryItem[]; totalCount: number }> {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (riskCategory && riskCategory !== 'ALL') params.append('risk_category', riskCategory);
  if (sort) params.append('sort', sort);
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const res = await fetch(`${API_BASE}/history?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch history');

  const totalHeader = res.headers.get('X-Total-Count');
  const items: HistoryItem[] = await res.json();
  const totalCount = totalHeader ? parseInt(totalHeader, 10) : items.length;

  return { items, totalCount };
}

export async function getScanDetail(scanId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/history/${scanId}`);
  if (!res.ok) throw new Error('Failed to fetch scan detail');
  return await res.json();
}

export async function deleteScanRecord(scanId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/history/${scanId}`, { method: 'DELETE' });
  return res.ok;
}

export async function clearAllHistory(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
  return res.ok;
}

export function getExportUrl(format: 'json' | 'csv'): string {
  return `${API_BASE}/history/export?format=${format}`;
}

export async function submitReport(input: ReportCreateInput): Promise<ReportItem> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to submit report');
  }

  return await res.json();
}

export async function getReportsList(): Promise<ReportItem[]> {
  const res = await fetch(`${API_BASE}/reports`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return await res.json();
}

export async function deleteReportRecord(reportId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/reports/${reportId}`, { method: 'DELETE' });
  return res.ok;
}

export async function broadcastCommunityAlert(input: CommunityThreatCreateInput): Promise<CommunityThreatAlert> {
  const res = await fetch(`${API_BASE}/community/alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to broadcast community alert');
  }

  return await res.json();
}

export async function getCommunityAlertsList(): Promise<CommunityThreatAlert[]> {
  const res = await fetch(`${API_BASE}/community/alerts`);
  if (!res.ok) throw new Error('Failed to fetch community alerts');
  return await res.json();
}

export async function getCommunityStatus(): Promise<{ connected_clients: number; uptime_seconds: number }> {
  try {
    const res = await fetch(`${API_BASE}/community/status`);
    if (!res.ok) return { connected_clients: 0, uptime_seconds: 0 };
    return await res.json();
  } catch {
    return { connected_clients: 0, uptime_seconds: 0 };
  }
}
