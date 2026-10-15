import React from 'react';
import { AlertOctagon, ExternalLink, CheckCircle2, X, ShieldAlert } from 'lucide-react';
import { RiskCategory, SignalDetail } from '../../types';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationUrl: string;
  hostname: string;
  riskCategory: RiskCategory;
  riskScore: number;
  triggeredSignals: SignalDetail[];
  onConfirmOpen: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  destinationUrl,
  hostname,
  riskCategory,
  riskScore,
  triggeredSignals,
  onConfirmOpen,
}) => {
  if (!isOpen) return null;

  const isSuspicious = riskCategory === 'SUSPICIOUS';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#DCE9DE] bg-white p-6 shadow-xl relative text-left text-[#24312A] space-y-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#647067] hover:text-[#24312A] p-1.5 rounded-lg hover:bg-[#F7FBF7] transition"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-6">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isSuspicious
                ? 'bg-amber-100 text-[#D97706]'
                : 'bg-[#EAF7EC] text-[#2E8B57]'
            }`}
          >
            {isSuspicious ? <AlertOctagon size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div>
            <h2 id="confirm-modal-title" className="text-lg font-bold text-[#1F5135] tracking-tight">
              {isSuspicious ? 'Review Suspicious Destination' : 'Confirm Navigation'}
            </h2>
            <p className="text-xs text-[#647067]">
              TrueQR Safety Checkpoint. You are choosing whether to leave this application.
            </p>
          </div>
        </div>

        {/* Destination preview box */}
        <div className="rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] p-3.5 space-y-1 font-mono text-xs">
          <div className="text-[10px] uppercase font-bold text-[#647067] tracking-wider flex items-center justify-between">
            <span>Destination Host</span>
            <span className={isSuspicious ? 'text-[#D97706]' : 'text-[#2E8B57]'}>
              Risk Score: {riskScore}/100
            </span>
          </div>
          <div className="text-sm font-bold text-[#1F5135] truncate select-all">
            {hostname || 'Unspecified Host'}
          </div>
          <div className="text-[11px] text-[#647067] truncate select-all">
            {destinationUrl}
          </div>
        </div>

        {/* Signals */}
        {triggeredSignals.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-[#1F5135] uppercase tracking-wider">
              Identified Patterns ({triggeredSignals.length})
            </h3>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {triggeredSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="rounded-lg p-2 text-xs bg-[#F7FBF7] border border-[#DCE9DE] flex items-start gap-2"
                >
                  <span
                    className={`mt-1 inline-block w-2 h-2 rounded-full shrink-0 ${
                      signal.severity === 'danger'
                        ? 'bg-[#DC2626]'
                        : signal.severity === 'warning'
                        ? 'bg-[#D97706]'
                        : 'bg-[#2E8B57]'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-[#24312A]">{signal.name}: </span>
                    <span className="text-[#647067]">{signal.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DCE9DE]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#647067] hover:text-[#24312A] bg-white border border-[#DCE9DE] hover:bg-[#F7FBF7] transition"
          >
            Cancel / Stay Safe
          </button>
          <button
            onClick={() => {
              onConfirmOpen();
              onClose();
            }}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isSuspicious
                ? 'bg-[#D97706] hover:bg-[#b45309]'
                : 'bg-[#2E8B57] hover:bg-[#257347]'
            }`}
          >
            <span>Proceed to Website</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
