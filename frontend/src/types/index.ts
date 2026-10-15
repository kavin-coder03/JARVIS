export type RiskCategory = 'LOW RISK' | 'SUSPICIOUS' | 'HIGH RISK';

export interface SignalDetail {
  id: string;
  name: string;
  severity: 'info' | 'warning' | 'danger';
  score_impact: number;
  description: string;
  actionable_advice: string;
}

export interface UntriggeredCheck {
  id: string;
  name: string;
  status: string;
  description: string;
}

export interface NormalizedDestination {
  original_input: string;
  normalized_url: string;
  payload_type: 'url' | 'wifi' | 'email' | 'phone' | 'location' | 'contact_or_otp' | 'text' | 'unsupported_scheme' | 'custom_scheme' | 'malformed';
  scheme?: string | null;
  hostname?: string | null;
  registered_domain?: string | null;
  subdomain?: string | null;
  port?: number | null;
  path?: string | null;
  query_params_count: number;
  has_credentials: boolean;
  is_secure_transport: boolean;
  is_ip_address: boolean;
  is_shortener: boolean;
  is_internationalized: boolean;
  is_malformed?: boolean;
}

export interface AnalysisResponse {
  risk_score: number;
  risk_category: RiskCategory;
  destination: NormalizedDestination;
  triggered_signals: SignalDetail[];
  untriggered_checks: UntriggeredCheck[];
  verdict_headline: string;
  verdict_explanation: string;
  suggested_action: string;
  security_limitations: string;
  scan_id?: string | null;
  timestamp: string;
}

export interface HistoryItem {
  id: string;
  payload_type: string;
  original_payload: string;
  sanitized_url?: string | null;
  hostname?: string | null;
  scheme?: string | null;
  port?: number | null;
  risk_score: number;
  risk_category: RiskCategory;
  source_type: string;
  reference_domain?: string | null;
  signals_count: number;
  created_at: string;
}

export interface HistoryStats {
  total_scans: number;
  low_risk_count: number;
  suspicious_count: number;
  high_risk_count: number;
  latest_scan_at?: string | null;
}

export interface ReportItem {
  id: string;
  url: string;
  hostname?: string | null;
  risk_category?: string | null;
  risk_score?: number | null;
  reason: string;
  notes?: string | null;
  status: string;
  created_at: string;
}

export interface ReportCreateInput {
  url: string;
  hostname?: string;
  risk_category?: string;
  risk_score?: number;
  reason: string;
  notes?: string;
}

export interface CommunityThreatAlert {
  type: string;
  report_id: string;
  timestamp: string;
  risk_level: string;
  risk_score?: number;
  safe_display_target: string;
  destination: string;
  hostname?: string;
  reasons: string[];
  reporter_client_id: string;
  status?: string;
  report_count?: number;
}

export interface CommunityThreatCreateInput {
  url: string;
  hostname?: string;
  risk_level?: string;
  risk_score?: number;
  reasons?: string[];
  reporter_client_id?: string;
  notes?: string;
}

export type NavTab = 'dashboard' | 'scan' | 'upload' | 'manual' | 'history' | 'reports' | 'demo' | 'settings';

