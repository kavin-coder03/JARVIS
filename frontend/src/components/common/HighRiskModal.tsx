import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { SignalDetail } from '../../types';

interface HighRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationUrl: string;
  hostname: string;
  riskScore: number;
  triggeredSignals: SignalDetail[];
  onViewDetails: () => void;
  onConfirmContinueAnyway: () => void;
  alarmActive: boolean;
  onStopAlarm: () => void;
  onReportToCommunity?: () => Promise<void> | void;
}

export const HighRiskModal: React.FC<HighRiskModalProps> = ({
  isOpen,
  onClose,
  destinationUrl,
  hostname,
  riskScore,
  triggeredSignals,
  onViewDetails,
  onConfirmContinueAnyway,
  alarmActive,
  onStopAlarm,
  onReportToCommunity,
}) => {
  const [showSecondaryConfirm, setShowSecondaryConfirm] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showCommunityConfirm, setShowCommunityConfirm] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [communityBroadcasted, setCommunityBroadcasted] = useState(false);

  const handleBroadcast = async () => {
    if (!onReportToCommunity) return;
    setIsBroadcasting(true);
    try {
      await onReportToCommunity();
      setCommunityBroadcasted(true);
      setShowCommunityConfirm(false);
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="high-risk-title"
    >
      <div className="w-full max-w-lg rounded-2xl border-2 border-[#DC2626] bg-[#FEF2F2] p-6 shadow-2xl relative text-left text-[#24312A] space-y-4">
        {/* Top Close Button */}
        <button
          onClick={() => {
            onStopAlarm();
            onClose();
          }}
          className="absolute top-4 right-4 text-[#DC2626]/70 hover:text-[#DC2626] p-1.5 rounded-lg hover:bg-[#fee2e2] transition"
          aria-label="Close Warning"
        >
          <X size={20} />
        </button>

        {/* Warning Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="p-3 rounded-2xl bg-[#DC2626] text-white shadow-md shadow-[#DC2626]/30 shrink-0 animate-bounce">
            <ShieldAlert size={30} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#DC2626] text-white">
                CRITICAL WARNING
              </span>
              <span className="text-xs font-mono font-bold text-[#DC2626]">
                Risk Score: {riskScore}/100
              </span>
            </div>
            <h2 id="high-risk-title" className="text-lg sm:text-xl font-extrabold text-[#991B1B] tracking-tight">
              DANGER: HIGH-RISK QR DESTINATION
            </h2>
          </div>
        </div>

        {/* Alarm Banner & Mute Control */}
        {alarmActive && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#DC2626]/30 text-xs text-[#DC2626] shadow-sm">
            <div className="flex items-center gap-2 font-medium">
              <Volume2 size={16} className="animate-pulse" />
              <span>Warning Alarm Sounding</span>
            </div>
            <button
              onClick={onStopAlarm}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-[#DC2626] hover:bg-[#b91c1c] transition flex items-center gap-1 shadow-xs"
            >
              <VolumeX size={13} />
              <span>Stop Alarm</span>
            </button>
          </div>
        )}

        {/* Primary Explanation */}
        <p className="text-xs sm:text-sm text-[#7F1D1D] leading-relaxed font-medium">
          TrueQR detected potentially dangerous indicators in this QR destination. Do not open the link unless you independently verify and understand the risks.
        </p>

        {/* Destination Box */}
        <div className="rounded-xl bg-white border border-[#DC2626]/30 p-3.5 space-y-1 font-mono text-xs shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#991B1B] tracking-wider">
            Target Destination Host
          </div>
          <div className="text-sm font-bold text-[#B91C1C] truncate select-all">
            {hostname || 'Unspecified Host'}
          </div>
          <div className="text-[11px] text-[#647067] truncate select-all">
            {destinationUrl}
          </div>
        </div>

        {/* Detected Warnings List */}
        {triggeredSignals.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#991B1B]">
              Detected Threat Signals ({triggeredSignals.length})
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {triggeredSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="p-2.5 rounded-xl bg-white border border-[#DC2626]/20 text-xs text-[#7F1D1D] flex items-start gap-2 shadow-xs"
                >
                  <AlertTriangle size={15} className="text-[#DC2626] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{signal.name}: </span>
                    <span className="text-[#991B1B]">{signal.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Defensive Recommendation */}
        <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#DC2626]/30 text-xs text-[#991B1B] leading-relaxed">
          <strong>Defensive Recommendation:</strong> Avoid entering passwords, OTP codes, bank card numbers, or UPI PINs on suspicious destinations.
        </div>

        {/* Secondary Confirmation Panel (If user clicks Continue Anyway) */}
        {showSecondaryConfirm && (
          <div className="p-3.5 rounded-xl bg-white border-2 border-[#DC2626] space-y-2.5 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold text-[#991B1B] uppercase tracking-wider">
              Final Confirmation Required
            </h4>
            <label className="flex items-start gap-2 text-xs text-[#7F1D1D] cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 rounded border-[#DC2626] text-[#DC2626] focus:ring-[#DC2626]"
              />
              <span>
                I acknowledge that this site exhibits high-risk phishing or spoofing patterns and may compromise my security.
              </span>
            </label>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowSecondaryConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#647067] hover:text-[#24312A] bg-gray-100"
              >
                Go Back
              </button>
              <button
                disabled={!acknowledged}
                onClick={() => {
                  onStopAlarm();
                  onConfirmContinueAnyway();
                  onClose();
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#DC2626] hover:bg-[#b91c1c] disabled:opacity-50 transition shadow-sm"
              >
                Open Anyway in New Tab
              </button>
            </div>
          </div>
        )}

        {/* Community Confirmation Panel */}
        {showCommunityConfirm && (
          <div className="p-3.5 rounded-xl bg-white border-2 border-[#DC2626] space-y-2.5 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold text-[#991B1B] uppercase tracking-wider flex items-center gap-1.5">
              <span>Broadcast Threat to Community Network</span>
            </h4>
            <p className="text-xs text-[#7F1D1D] leading-relaxed">
              This will immediately send a real-time warning alert to all 4 connected laptops on the network, displaying the flagged destination and sounding the audio alarm.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowCommunityConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#647067] hover:text-[#24312A] bg-gray-100"
              >
                Cancel
              </button>
              <button
                disabled={isBroadcasting}
                onClick={handleBroadcast}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#DC2626] hover:bg-[#b91c1c] disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
              >
                {isBroadcasting ? 'Broadcasting...' : 'Confirm & Broadcast to All'}
              </button>
            </div>
          </div>
        )}

        {communityBroadcasted && (
          <div className="p-3 rounded-xl bg-[#EAF7EC] border border-[#2E8B57] text-xs text-[#15803D] font-bold flex items-center gap-2">
            <span>✓ Real-time alert successfully broadcasted to all connected laptops!</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        {!showSecondaryConfirm && !showCommunityConfirm && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[#DC2626]/20">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  onStopAlarm();
                  onViewDetails();
                  onClose();
                }}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-[#991B1B] bg-white border border-[#DC2626]/30 hover:bg-[#fee2e2] transition flex items-center justify-center gap-1"
              >
                <span>View Details</span>
                <ChevronRight size={14} />
              </button>

              {onReportToCommunity && !communityBroadcasted && (
                <button
                  onClick={() => setShowCommunityConfirm(true)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#991B1B] hover:bg-[#7F1D1D] shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>Report to Community</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowSecondaryConfirm(true)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold text-[#991B1B] hover:bg-[#fee2e2] transition text-center"
              >
                Continue Anyway...
              </button>

              {/* SAFEST AND MOST PROMINENT BUTTON */}
              <button
                onClick={() => {
                  onStopAlarm();
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#DC2626] hover:bg-[#b91c1c] shadow-lg shadow-[#DC2626]/30 transition active:scale-95 text-center"
              >
                Close Warning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
