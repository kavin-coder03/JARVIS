import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Flag,
  RotateCcw,
  Globe,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Wifi,
  Smartphone,
  Mail,
  FileText,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { AnalysisResponse } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { RiskScoreGauge } from '../common/RiskScoreGauge';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface AnalysisResultViewProps {
  result: AnalysisResponse;
  onScanAnother: () => void;
  onOpenReportModal: (url: string, hostname?: string, category?: string, score?: number) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onTriggerHighRiskModal?: () => void;
  onReportToCommunity?: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  onScanAnother,
  onOpenReportModal,
  onShowToast,
  onTriggerHighRiskModal,
  onReportToCommunity,
}) => {
  const [showUntriggered, setShowUntriggered] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const dest = result.destination;
  const isWebUrl = dest.payload_type === 'url';
  const isPaymentUri = dest.payload_type === ('payment_uri' as any);
  const isDangerousScheme = dest.payload_type === 'unsupported_scheme';
  const isOfflinePayload = ['wifi', 'email', 'phone', 'location', 'text', 'contact_or_otp'].includes(
    dest.payload_type
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(dest.original_input);
    setCopied(true);
    onShowToast('Payload copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenClick = () => {
    if (isDangerousScheme) {
      onShowToast('Blocked: Dangerous execution scheme cannot be opened in browser.', 'error');
      return;
    }
    if (isOfflinePayload) {
      onShowToast('This is an offline non-web payload. Use the preview directly.', 'info');
      return;
    }
    if (result.risk_category === 'HIGH RISK' && onTriggerHighRiskModal) {
      onTriggerHighRiskModal();
      return;
    }
    setConfirmModalOpen(true);
  };

  const handleConfirmedNavigation = () => {
    window.open(dest.normalized_url, '_blank', 'noopener,noreferrer');
  };

  const getPayloadIcon = () => {
    if (isPaymentUri) return <CreditCard size={18} className="text-[#2E8B57]" />;
    switch (dest.payload_type) {
      case 'wifi':
        return <Wifi size={18} className="text-[#2E8B57]" />;
      case 'email':
        return <Mail size={18} className="text-[#2E8B57]" />;
      case 'phone':
        return <Smartphone size={18} className="text-[#2E8B57]" />;
      case 'text':
        return <FileText size={18} className="text-[#2E8B57]" />;
      default:
        return <Globe size={18} className="text-[#2E8B57]" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner: Score & Verdict */}
      <div className="rounded-2xl border border-[#DCE9DE] bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Gauge Column */}
          <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#DCE9DE] pb-6 md:pb-0 md:pr-6">
            <RiskScoreGauge score={result.risk_score} category={result.risk_category} />
            <RiskBadge category={result.risk_category} size="lg" />
          </div>

          {/* Verdict Summary Column */}
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2E8B57]">
                TrueQR Verdict
              </span>
              <span className="text-[#DCE9DE]">•</span>
              <span className="text-xs font-mono text-[#647067]">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F5135] tracking-tight">
              {result.verdict_headline}
            </h2>

            <p className="text-xs sm:text-sm text-[#24312A] leading-relaxed">
              {result.verdict_explanation}
            </p>

            {/* Recommendation Box */}
            <div className="p-3.5 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] text-xs text-[#24312A] space-y-1">
              <span className="font-bold text-[#1F5135] block uppercase tracking-wider text-[11px]">
                Recommended Safe Action:
              </span>
              <p className="leading-relaxed">{result.suggested_action}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Card (if UPI / Payment payload) */}
      {isPaymentUri && (dest as any).payment_details && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2.5">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-blue-700" />
              <h3 className="text-xs sm:text-sm font-bold text-blue-900 uppercase tracking-wider">
                UPI Payment Request Details
              </h3>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
              Payment Intent
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-0.5">Payee Name</span>
              <span className="font-bold text-blue-950 truncate block">
                {(dest as any).payment_details?.payee_name || 'Not provided in QR'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-0.5">Payee VPA Address</span>
              <span className="font-mono font-bold text-blue-950 truncate block">
                {(dest as any).payment_details?.payee_vpa || 'Not provided'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-0.5">Amount</span>
              <span className="font-bold text-blue-950 truncate block">
                {(dest as any).payment_details?.amount
                  ? `${(dest as any).payment_details?.currency || 'INR'} ${(dest as any).payment_details?.amount}`
                  : 'Open (Enter amount during checkout)'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-blue-900 leading-relaxed">
            <strong>Important Safety Rule:</strong> Never enter your UPI PIN to receive money. TrueQR does not execute payments or verify payee credentials.
          </p>
        </div>
      )}

      {/* Decoded Destination Breakdown Card */}
      <div className="rounded-2xl border border-[#DCE9DE] bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE9DE]">
          <div className="flex items-center gap-2">
            {getPayloadIcon()}
            <h3 className="text-sm font-bold text-[#1F5135] uppercase tracking-wider">
              Decoded Destination Payload
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#EAF7EC] text-[#1F5135] uppercase border border-[#DCE9DE] font-semibold">
            {dest.payload_type}
          </span>
        </div>

        {/* Complete raw payload container */}
        <div className="relative rounded-xl bg-[#F7FBF7] p-3.5 border border-[#DCE9DE] font-mono text-xs break-all text-[#24312A]">
          <button
            onClick={handleCopy}
            className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-white hover:bg-gray-50 border border-[#DCE9DE] text-[#647067] hover:text-[#24312A] transition flex items-center gap-1 text-[11px] font-sans font-medium shadow-xs"
            title="Copy payload"
          >
            {copied ? <Check size={13} className="text-[#15803D]" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <div className="pr-16 select-all font-mono leading-relaxed">
            {dest.original_input}
          </div>
        </div>

        {/* Host details grid */}
        {isWebUrl && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE]">
              <span className="text-[10px] font-mono font-bold uppercase text-[#647067] block mb-0.5">
                Hostname
              </span>
              <span className="text-xs font-bold text-[#1F5135] font-mono truncate block" title={dest.hostname || ''}>
                {dest.hostname || 'None'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE]">
              <span className="text-[10px] font-mono font-bold uppercase text-[#647067] block mb-0.5">
                Registered Domain
              </span>
              <span className="text-xs font-bold text-[#2E8B57] font-mono truncate block" title={dest.registered_domain || ''}>
                {dest.registered_domain || dest.hostname || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE]">
              <span className="text-[10px] font-mono font-bold uppercase text-[#647067] block mb-0.5">
                Transport Security
              </span>
              <div className="flex items-center gap-1 text-xs font-mono font-bold">
                {dest.scheme === 'https' ? (
                  <>
                    <Lock size={12} className="text-[#15803D]" />
                    <span className="text-[#15803D] uppercase">HTTPS</span>
                  </>
                ) : (
                  <>
                    <Unlock size={12} className="text-[#D97706]" />
                    <span className="text-[#D97706] uppercase">{dest.scheme || 'HTTP'}</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE]">
              <span className="text-[10px] font-mono font-bold uppercase text-[#647067] block mb-0.5">
                Query Parameters
              </span>
              <span className="text-xs font-bold text-[#1F5135] font-mono">
                {dest.query_params_count > 0 ? `${dest.query_params_count} params` : 'None'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Triggered Warning Signals List */}
      <div className="rounded-2xl border border-[#DCE9DE] bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE9DE]">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#D97706]" />
            <h3 className="text-sm font-bold text-[#1F5135] uppercase tracking-wider">
              Detected Warning Signals ({result.triggered_signals.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-[#647067]">Explainable Rules</span>
        </div>

        {result.triggered_signals.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#EAF7EC] border border-[#DCE9DE] text-center text-xs text-[#1F5135]">
            No major warning indicators were detected by TrueQR's heuristic rules.
          </div>
        ) : (
          <div className="space-y-3">
            {result.triggered_signals.map((sig) => (
              <div
                key={sig.id}
                className={`p-4 rounded-xl border transition ${
                  sig.severity === 'danger'
                    ? 'bg-[#FEF2F2] border-[#DC2626]/30 text-[#7F1D1D]'
                    : sig.severity === 'warning'
                    ? 'bg-amber-50/80 border-amber-200 text-[#78350F]'
                    : 'bg-[#EAF7EC]/60 border-[#DCE9DE] text-[#1F5135]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        sig.severity === 'danger'
                          ? 'bg-[#DC2626]'
                          : sig.severity === 'warning'
                          ? 'bg-[#D97706]'
                          : 'bg-[#2E8B57]'
                      }`}
                    />
                    <h4 className="text-sm font-bold tracking-tight">{sig.name}</h4>
                  </div>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white/80 border border-current">
                    +{sig.score_impact} Risk
                  </span>
                </div>

                <p className="mt-1.5 text-xs leading-relaxed opacity-95">{sig.description}</p>

                <div className="mt-2.5 pt-2 border-t border-current/15 text-[11px] flex items-start gap-1.5">
                  <span className="font-bold shrink-0 uppercase tracking-wider text-[10px]">
                    Guidance:
                  </span>
                  <span>{sig.actionable_advice}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Untriggered Checks Accordion */}
      {result.untriggered_checks && result.untriggered_checks.length > 0 && (
        <div className="rounded-2xl border border-[#DCE9DE] bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => setShowUntriggered(!showUntriggered)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7FBF7] transition"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#647067]">
              <ShieldCheck size={16} className="text-[#15803D]" />
              <span>Verified Checks ({result.untriggered_checks.length} Passed)</span>
            </div>
            {showUntriggered ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showUntriggered && (
            <div className="p-4 pt-0 border-t border-[#DCE9DE] space-y-2 animate-in fade-in duration-150">
              {result.untriggered_checks.map((chk) => (
                <div
                  key={chk.id}
                  className="p-2.5 rounded-lg bg-[#F7FBF7] border border-[#DCE9DE] text-xs flex items-start gap-2.5"
                >
                  <Check size={14} className="text-[#15803D] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#1F5135]">{chk.name}: </span>
                    <span className="text-[#647067]">{chk.description}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Primary User Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onScanAnother}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-[#1F5135] bg-white border border-[#DCE9DE] hover:bg-[#F7FBF7] transition flex items-center justify-center gap-2 shadow-xs"
          >
            <RotateCcw size={14} />
            <span>Scan Another QR</span>
          </button>

          <button
            onClick={() =>
              onOpenReportModal(
                dest.original_input,
                dest.hostname || undefined,
                result.risk_category,
                result.risk_score
              )
            }
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626]/30 hover:bg-[#fee2e2] transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Flag size={14} />
            <span>Report Suspicious</span>
          </button>

          {result.risk_category === 'HIGH RISK' && onReportToCommunity && (
            <button
              onClick={onReportToCommunity}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#991B1B] hover:bg-[#7F1D1D] transition flex items-center justify-center gap-2 shadow-xs active:scale-95"
              title="Broadcast this high-risk threat to all connected laptops"
            >
              <span>Report to Community</span>
            </button>
          )}
        </div>

        {/* Proceed to Destination Button */}
        {isWebUrl && !isDangerousScheme && (
          <button
            onClick={handleOpenClick}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-sm active:scale-95 ${
              result.risk_category === 'HIGH RISK'
                ? 'bg-[#DC2626] hover:bg-[#b91c1c]'
                : result.risk_category === 'SUSPICIOUS'
                ? 'bg-[#D97706] hover:bg-[#b45309]'
                : 'bg-[#2E8B57] hover:bg-[#257347]'
            }`}
          >
            <span>Proceed to Website</span>
            <ExternalLink size={15} />
          </button>
        )}
      </div>

      {/* Honest Limitation Notice */}
      <div className="p-3 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] text-[11px] text-[#647067] leading-relaxed">
        <strong>Privacy & Consent Notice:</strong> TrueQR never automatically navigates to scanned destinations. An absence of detected warnings does not guarantee complete safety.
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        destinationUrl={dest.normalized_url}
        hostname={dest.hostname || 'Unspecified Host'}
        riskCategory={result.risk_category}
        riskScore={result.risk_score}
        triggeredSignals={result.triggered_signals}
        onConfirmOpen={handleConfirmedNavigation}
      />
    </div>
  );
};
