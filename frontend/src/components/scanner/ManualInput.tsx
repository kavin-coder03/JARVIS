import React, { useState } from 'react';
import { Link as LinkIcon, ArrowRight, Sparkles, CreditCard } from 'lucide-react';

interface ManualInputProps {
  onAnalyze: (payload: string, referenceDomain?: string) => void;
  isProcessing: boolean;
}

export const ManualInput: React.FC<ManualInputProps> = ({ onAnalyze, isProcessing }) => {
  const [urlInput, setUrlInput] = useState('');
  const [expectedDomain, setExpectedDomain] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = urlInput.trim();
    if (!trimmed) {
      setValidationError('Please enter a URL or QR payload to inspect.');
      return;
    }

    onAnalyze(trimmed, expectedDomain.trim() || undefined);
  };

  const handleQuickFill = (sampleUrl: string, sampleExpected?: string) => {
    setUrlInput(sampleUrl);
    setExpectedDomain(sampleExpected || '');
    setValidationError(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <div className="rounded-2xl border border-[#DCE9DE] bg-white p-5 sm:p-6 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE9DE]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF7EC] text-[#2E8B57] flex items-center justify-center">
              <LinkIcon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F5135]">Manual URL & Payload Inspection</h3>
              <p className="text-[11px] text-[#647067]">Direct deterministic heuristic analysis</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#2E8B57] bg-[#EAF7EC] px-2 py-0.5 rounded border border-[#DCE9DE]">
            Instant
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url-input" className="block text-xs font-bold text-[#1F5135] uppercase tracking-wider mb-1.5">
              Target URL or QR Payload <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              id="url-input"
              rows={3}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. https://example.com/login, upi://pay?pa=merchant@bank, or raw text"
              className="w-full rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] p-3 text-xs sm:text-sm text-[#24312A] font-mono placeholder:text-[#647067] focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] focus:outline-none transition"
            />
            {validationError && (
              <p className="mt-1 text-xs text-[#DC2626] font-medium">{validationError}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="expected-domain-input" className="block text-xs font-bold text-[#1F5135] uppercase tracking-wider">
                Expected Domain Reference <span className="text-[#647067] font-normal lowercase">(optional)</span>
              </label>
              <span className="text-[11px] text-[#2E8B57] font-medium">Sticker Swap Check</span>
            </div>
            <input
              id="expected-domain-input"
              type="text"
              value={expectedDomain}
              onChange={(e) => setExpectedDomain(e.target.value)}
              placeholder="e.g. paypal.com or chase.com"
              className="w-full rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] px-3.5 py-2 text-xs sm:text-sm text-[#24312A] font-mono placeholder:text-[#647067] focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] focus:outline-none transition"
            />
            <p className="mt-1 text-[11px] text-[#647067]">
              Enter the domain you expected from a flyer or poster. TrueQR flags mismatched destinations.
            </p>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#2E8B57] hover:bg-[#257347] transition flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing Destination...</span>
              </>
            ) : (
              <>
                <span>Inspect Destination</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Quick Samples */}
        <div className="pt-3 border-t border-[#DCE9DE]">
          <p className="text-[11px] font-bold text-[#647067] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#2E8B57]" />
            <span>Try Quick Test Samples:</span>
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('https://www.wikipedia.org/wiki/Computer_security')}
              className="px-2.5 py-1 rounded-lg bg-[#EAF7EC] text-[#15803D] hover:bg-[#d8eedb] border border-[#DCE9DE] font-mono transition text-[11px] font-medium"
            >
              Wikipedia (Safe)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('https://bit.ly/3QzL98M')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 text-[#D97706] hover:bg-amber-100 border border-amber-200 font-mono transition text-[11px] font-medium"
            >
              Bit.ly Shortener
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickFill('https://login.paypal.com.verify-billing.site/account', 'paypal.com')
              }
              className="px-2.5 py-1 rounded-lg bg-[#FEF2F2] text-[#DC2626] hover:bg-[#fee2e2] border border-[#DC2626]/30 font-mono transition text-[11px] font-medium"
            >
              Paypal Subdomain Spoof
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickFill('upi://pay?pa=merchant@okaxis&pn=CampusStore&am=250.00&cu=INR')
              }
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-mono transition text-[11px] font-medium flex items-center gap-1"
            >
              <CreditCard size={12} />
              <span>UPI Payment URI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
