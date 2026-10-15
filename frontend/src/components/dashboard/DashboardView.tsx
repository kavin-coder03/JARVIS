import React, { useEffect, useState } from 'react';
import {
  Camera,
  Upload,
  Link as LinkIcon,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  History,
  Sparkles,
  ArrowRight,
  Shield,
  Lock,
  CheckCircle2,
  Info
} from 'lucide-react';
import { NavTab, HistoryStats, HistoryItem } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { getHistoryStats, getHistoryList } from '../../services/api';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectScan: (scanId: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectScan,
  onShowToast: _onShowToast,
}) => {
  const [stats, setStats] = useState<HistoryStats>({
    total_scans: 0,
    low_risk_count: 0,
    suspicious_count: 0,
    high_risk_count: 0,
  });
  const [recentScans, setRecentScans] = useState<HistoryItem[]>([]);
  const [_isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, histData] = await Promise.all([
        getHistoryStats().catch(() => ({
          total_scans: 0,
          low_risk_count: 0,
          suspicious_count: 0,
          high_risk_count: 0,
        })),
        getHistoryList(undefined, undefined, 'desc', 0, 5).catch(() => ({
          items: [],
          totalCount: 0,
        })),
      ]);
      setStats(statsData);
      setRecentScans(histData.items);
    } catch (err: any) {
      console.warn('Dashboard data fetch note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl border border-[#DCE9DE] bg-[#F7FBF7] p-6 sm:p-10 shadow-sm overflow-hidden">
        {/* Subtle decorative accents */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#EAF7EC] rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF7EC] border border-[#DCE9DE] text-[#1F5135]">
            <Shield size={14} className="text-[#2E8B57]" />
            <span>TrueQR — Scan. Inspect. Decide.</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1F5135] tracking-tight leading-tight">
            Scan before you trust.
          </h1>

          <p className="text-sm sm:text-base text-[#647067] leading-relaxed max-w-2xl">
            Inspect QR destinations and identify potentially suspicious links before opening them. TrueQR gives you a safe checkpoint to inspect URLs, payment addresses, and payload content with confidence.
          </p>

          {/* Core action CTA buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('scan')}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#2E8B57] hover:bg-[#1F5135] shadow-md shadow-[#2E8B57]/20 transition flex items-center gap-2 active:scale-95"
            >
              <Camera size={18} />
              <span>Scan QR Code</span>
            </button>

            <button
              onClick={() => onNavigate('upload')}
              className="px-5 py-3 rounded-xl font-semibold text-sm text-[#1F5135] hover:text-white bg-white hover:bg-[#2E8B57] border border-[#DCE9DE] shadow-xs transition flex items-center gap-2 active:scale-95"
            >
              <Upload size={17} className="text-[#2E8B57] group-hover:text-white" />
              <span>Upload QR Image</span>
            </button>

            <button
              onClick={() => onNavigate('demo')}
              className="px-4 py-3 rounded-xl font-semibold text-xs text-[#1F5135] hover:bg-[#EAF7EC] bg-white border border-[#DCE9DE] transition flex items-center gap-1.5 active:scale-95 ml-auto sm:ml-0"
            >
              <Sparkles size={15} className="text-[#2E8B57]" />
              <span>Judges Demo Mode</span>
            </button>
          </div>

          {/* Privacy Note */}
          <div className="pt-2 flex items-center gap-2 text-xs text-[#647067]">
            <Info size={14} className="text-[#2E8B57] shrink-0" />
            <span>Your QR destination is analyzed before you choose whether to open it.</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#DCE9DE] bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#647067]">
            <span>TOTAL SCANS</span>
            <History size={16} className="text-[#2E8B57]" />
          </div>
          <div className="text-3xl font-extrabold text-[#1F5135] font-mono">
            {stats.total_scans}
          </div>
          <span className="text-[11px] text-[#647067] block">Inspected QR destinations</span>
        </div>

        <div className="rounded-2xl border border-[#DCE9DE] bg-[#F7FBF7] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#15803D]">
            <span>LOW RISK</span>
            <ShieldCheck size={16} className="text-[#15803D]" />
          </div>
          <div className="text-3xl font-extrabold text-[#15803D] font-mono">
            {stats.low_risk_count}
          </div>
          <span className="text-[11px] text-[#647067] block">No major warning indicators</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#D97706]">
            <span>SUSPICIOUS</span>
            <AlertTriangle size={16} className="text-[#D97706]" />
          </div>
          <div className="text-3xl font-extrabold text-[#D97706] font-mono">
            {stats.suspicious_count}
          </div>
          <span className="text-[11px] text-[#647067] block">Caution indicators flagged</span>
        </div>

        <div className="rounded-2xl border border-red-200 bg-[#FEF2F2] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#DC2626]">
            <span>HIGH RISK</span>
            <ShieldAlert size={16} className="text-[#DC2626]" />
          </div>
          <div className="text-3xl font-extrabold text-[#DC2626] font-mono">
            {stats.high_risk_count}
          </div>
          <span className="text-[11px] text-[#647067] block">Severe risks or spoofed targets</span>
        </div>
      </div>

      {/* 3 Interactive Pathway Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Camera Scanner */}
        <div
          onClick={() => onNavigate('scan')}
          className="group rounded-2xl border border-[#DCE9DE] bg-white hover:bg-[#F7FBF7] hover:border-[#2E8B57] p-6 shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7EC] text-[#2E8B57] border border-[#DCE9DE] flex items-center justify-center group-hover:scale-105 transition duration-200">
              <Camera size={24} />
            </div>
            <h3 className="text-base font-bold text-[#1F5135] group-hover:text-[#2E8B57] transition">
              Live Camera Scanner
            </h3>
            <p className="text-xs text-[#647067] leading-relaxed">
              Use your device camera with camera selection and front/rear switching. Camera frames are processed locally in your browser.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E8B57] group-hover:translate-x-1 transition">
            <span>Open Camera</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Card 2: Image Upload */}
        <div
          onClick={() => onNavigate('upload')}
          className="group rounded-2xl border border-[#DCE9DE] bg-white hover:bg-[#F7FBF7] hover:border-[#2E8B57] p-6 shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7EC] text-[#2E8B57] border border-[#DCE9DE] flex items-center justify-center group-hover:scale-105 transition duration-200">
              <Upload size={24} />
            </div>
            <h3 className="text-base font-bold text-[#1F5135] group-hover:text-[#2E8B57] transition">
              Upload QR Image
            </h3>
            <p className="text-xs text-[#647067] leading-relaxed">
              Select screenshots, photos, or downloaded images containing QR codes. Decodes PNG, JPEG, and WebP formats.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E8B57] group-hover:translate-x-1 transition">
            <span>Browse Files</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Card 3: Manual URL Analysis */}
        <div
          onClick={() => onNavigate('manual')}
          className="group rounded-2xl border border-[#DCE9DE] bg-white hover:bg-[#F7FBF7] hover:border-[#2E8B57] p-6 shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7EC] text-[#2E8B57] border border-[#DCE9DE] flex items-center justify-center group-hover:scale-105 transition duration-200">
              <LinkIcon size={24} />
            </div>
            <h3 className="text-base font-bold text-[#1F5135] group-hover:text-[#2E8B57] transition">
              Manual Link Inspection
            </h3>
            <p className="text-xs text-[#647067] leading-relaxed">
              Inspect any URL or UPI payment string directly. Add an optional expected domain to test for sticker replacement attacks.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E8B57] group-hover:translate-x-1 transition">
            <span>Analyze Link</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-2xl border border-[#DCE9DE] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE9DE]">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[#2E8B57]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F5135]">
              Recent Scan Activity
            </h3>
          </div>
          {recentScans.length > 0 && (
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-[#2E8B57] hover:text-[#1F5135] font-bold flex items-center gap-1"
            >
              <span>View Full History ({stats.total_scans})</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Empty State */}
        {recentScans.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7EC] border border-[#DCE9DE] text-[#2E8B57] flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-[#1F5135]">No Stored Scans Yet</h4>
              <p className="text-xs text-[#647067] leading-relaxed">
                Scan a real QR code using your camera, upload an image, or run a test scenario from our Demo Showcase to see the heuristic risk engine in action.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() => onNavigate('demo')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1F5135] bg-[#EAF7EC] border border-[#DCE9DE] hover:bg-[#DCE9DE] transition flex items-center gap-1.5"
              >
                <Sparkles size={14} className="text-[#2E8B57]" />
                <span>Try Demo Showcase</span>
              </button>
              <button
                onClick={() => onNavigate('scan')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#2E8B57] hover:bg-[#1F5135] transition flex items-center gap-1.5"
              >
                <Camera size={14} />
                <span>Launch Camera</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => onSelectScan(scan.id)}
                className="rounded-xl border border-[#DCE9DE] bg-[#F7FBF7] hover:bg-[#EAF7EC]/60 p-3.5 transition flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <RiskBadge category={scan.risk_category} size="sm" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#1F5135] font-mono truncate block">
                      {scan.hostname || scan.sanitized_url || scan.original_payload}
                    </span>
                    <span className="text-[11px] text-[#647067] font-mono truncate block">
                      {scan.sanitized_url || scan.original_payload}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-[#647067]">
                  <span className="px-2 py-0.5 rounded bg-white border border-[#DCE9DE] text-[11px] font-semibold text-[#1F5135]">
                    Score: {scan.risk_score}
                  </span>
                  <span className="hidden sm:inline text-[11px]">
                    {scan.created_at ? new Date(scan.created_at).toLocaleTimeString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety & Privacy Pledge */}
      <div className="rounded-2xl border border-[#DCE9DE] bg-[#F7FBF7] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#647067]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#EAF7EC] text-[#2E8B57] border border-[#DCE9DE]">
            <Lock size={16} />
          </div>
          <div>
            <span className="font-bold text-[#1F5135] block">Privacy & Security First</span>
            <span className="text-[11px] text-[#647067]">
              Camera frames stay in your browser. We never automatically follow redirects or execute remote payloads.
            </span>
          </div>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="text-[#2E8B57] hover:text-[#1F5135] font-semibold text-xs underline underline-offset-2 shrink-0"
        >
          View Settings
        </button>
      </div>
    </div>
  );
};
