import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  Laptop,
  ExternalLink
} from 'lucide-react';
import { CommunityThreatAlert } from '../../types';

interface CommunityAlertModalProps {
  alert: CommunityThreatAlert | null;
  onClose: () => void;
  onViewReports: () => void;
  alarmActive: boolean;
  onStopAlarm: () => void;
}

export const CommunityAlertModal: React.FC<CommunityAlertModalProps> = ({
  alert,
  onClose,
  onViewReports,
  alarmActive,
  onStopAlarm,
}) => {
  if (!alert) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="community-alert-title"
    >
      <div className="w-full max-w-lg rounded-2xl border-4 border-[#DC2626] bg-[#FEF2F2] p-6 shadow-2xl relative text-left text-[#24312A] space-y-4 animate-in zoom-in-95 duration-150">
        {/* Top Close Button */}
        <button
          onClick={() => {
            onStopAlarm();
            onClose();
          }}
          className="absolute top-4 right-4 text-[#DC2626]/70 hover:text-[#DC2626] p-1.5 rounded-lg hover:bg-[#fee2e2] transition"
          aria-label="Dismiss Alert"
        >
          <X size={20} />
        </button>

        {/* Pulsing Live Alert Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="p-3 rounded-2xl bg-[#DC2626] text-white shadow-lg shadow-[#DC2626]/40 shrink-0 animate-bounce">
            <Radio size={28} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#DC2626] text-white shadow-xs">
                NETWORK BROADCAST
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-100 border border-red-300 text-[#991B1B]">
                {alert.risk_level || 'HIGH RISK'}
              </span>
              {alert.risk_score !== undefined && (
                <span className="text-xs font-mono font-bold text-[#DC2626]">
                  Score: {alert.risk_score}/100
                </span>
              )}
            </div>
            <h2 id="community-alert-title" className="text-lg sm:text-xl font-extrabold text-[#991B1B] tracking-tight flex items-center gap-2">
              <span>LIVE COMMUNITY FAKE-QR ALERT</span>
            </h2>
          </div>
        </div>

        {/* Reporter & Time Metadata Bar */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/90 border border-[#DC2626]/20 text-xs text-[#7F1D1D] shadow-xs">
          <span className="flex items-center gap-1.5 font-bold">
            <Laptop size={14} className="text-[#DC2626]" />
            <span>Origin: <span className="text-[#991B1B] font-mono">{alert.reporter_client_id || 'Network Device'}</span></span>
          </span>
          <span className="flex items-center gap-1 text-[11px] font-mono text-[#647067]">
            <Clock size={12} />
            <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
          </span>
        </div>

        {/* Audio Siren Banner */}
        {alarmActive && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#DC2626]/40 text-xs text-[#DC2626] shadow-sm animate-pulse">
            <div className="flex items-center gap-2 font-bold">
              <Volume2 size={16} />
              <span>Network Warning Alarm Sounding</span>
            </div>
            <button
              onClick={onStopAlarm}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-[#DC2626] hover:bg-[#b91c1c] transition flex items-center gap-1 shadow-xs"
            >
              <VolumeX size={13} />
              <span>Mute Alarm</span>
            </button>
          </div>
        )}

        {/* Warning Explanation */}
        <p className="text-xs sm:text-sm text-[#7F1D1D] leading-relaxed font-semibold">
          A client laptop on the TrueQR network scanned and flagged a deceptive QR code destination. Do not scan or open this link if encountered on physical posters or flyers.
        </p>

        {/* Target Destination Box */}
        <div className="rounded-xl bg-white border border-[#DC2626]/30 p-3.5 space-y-1 font-mono text-xs shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#991B1B] tracking-wider">
            Flagged Host / Destination
          </div>
          <div className="text-sm font-bold text-[#B91C1C] truncate select-all">
            {alert.safe_display_target || alert.hostname || 'Suspicious Target'}
          </div>
          <div className="text-[11px] text-[#647067] break-all select-all font-mono">
            {alert.destination}
          </div>
        </div>

        {/* Threat Reasons List */}
        {alert.reasons && alert.reasons.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#991B1B]">
              Detected Threat Signals:
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
              {alert.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-white border border-[#DC2626]/20 text-xs text-[#7F1D1D] flex items-center gap-2 shadow-xs"
                >
                  <AlertTriangle size={14} className="text-[#DC2626] shrink-0" />
                  <span className="font-semibold">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[#DC2626]/20">
          <button
            onClick={() => {
              onStopAlarm();
              onViewReports();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-[#991B1B] bg-white border border-[#DC2626]/30 hover:bg-[#fee2e2] transition flex items-center justify-center gap-1.5"
          >
            <ShieldAlert size={14} />
            <span>View All Reports</span>
          </button>

          <button
            onClick={() => {
              onStopAlarm();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#DC2626] hover:bg-[#b91c1c] shadow-lg shadow-[#DC2626]/30 transition active:scale-95 text-center"
          >
            Acknowledge & Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
