import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Eye,
  Copy,
  Check
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

export interface DemoScenario {
  id: string;
  title: string;
  category: 'Normal HTTPS' | 'Unencrypted HTTP' | 'URL Shortener' | 'Raw IP Host' | 'Punycode Spoof' | 'Brand Impersonation' | 'Userinfo Deception' | 'Destination Mismatch' | 'Dangerous Scheme' | 'Payment URI' | 'Offline Wi-Fi';
  expectedRisk: 'LOW RISK' | 'SUSPICIOUS' | 'HIGH RISK';
  payload: string;
  referenceDomain?: string;
  description: string;
  whatJudgesShouldLookFor: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'safe-wikipedia',
    title: 'Legitimate HTTPS Knowledge Base',
    category: 'Normal HTTPS',
    expectedRisk: 'LOW RISK',
    payload: 'https://www.wikipedia.org/wiki/Computer_security',
    description: 'Clean, verified domain with standard HTTPS encryption and transparent host structure.',
    whatJudgesShouldLookFor: 'Passes transport encryption, no shorteners, low risk score (0/100). Untriggered verified checks visible.',
  },
  {
    id: 'unencrypted-http',
    title: 'Cleartext HTTP Insecure Destination',
    category: 'Unencrypted HTTP',
    expectedRisk: 'LOW RISK',
    payload: 'http://insecure-example.org/account/status',
    description: 'Transmits data in plaintext without TLS encryption. Vulnerable to interception on public Wi-Fi.',
    whatJudgesShouldLookFor: 'Flags unencrypted HTTP (+15 penalty). Explains that HTTPS encrypts transit but does not prove intent.',
  },
  {
    id: 'url-shortener',
    title: 'Masked URL Shortener Service',
    category: 'URL Shortener',
    expectedRisk: 'SUSPICIOUS',
    payload: 'https://bit.ly/3QzL98M',
    description: 'URL shortener concealed in a QR code where human typing length does not matter.',
    whatJudgesShouldLookFor: 'Warns that real destination is hidden behind redirect. Recommends unshortening inspection before clicking.',
  },
  {
    id: 'raw-ip-address',
    title: 'Direct Numerical IP Host Address',
    category: 'Raw IP Host',
    expectedRisk: 'SUSPICIOUS',
    payload: 'http://192.168.1.100/admin-portal/login.php',
    description: 'Direct IP host instead of a registered domain name. Typical of ad-hoc phishing hosts and infected IoT.',
    whatJudgesShouldLookFor: 'Identifies raw IPv4 host (+30 penalty). Explains why legitimate consumer brands use registered domains.',
  },
  {
    id: 'punycode-homoglyph',
    title: 'Punycode Look-Alike Homoglyph Domain',
    category: 'Punycode Spoof',
    expectedRisk: 'SUSPICIOUS',
    payload: 'https://xn--pple-43d.com/login/auth',
    description: 'Internationalized domain name using Cyrillic "а" character to visually spoof Apple.',
    whatJudgesShouldLookFor: 'Detects "xn--" punycode prefix (+25 penalty). Explains homograph alphabet substitution risk.',
  },
  {
    id: 'brand-subdomain-spoof',
    title: 'Deceptive Brand Subdomain Phishing',
    category: 'Brand Impersonation',
    expectedRisk: 'HIGH RISK',
    payload: 'https://login.paypal.com.verify-billing.site/account',
    description: 'Prepends trusted brand name "paypal.com" as subdomains of unrelated registered domain ".site".',
    whatJudgesShouldLookFor: 'Detects brand impersonation (+40 penalty) and excessive subdomain depth (+20 penalty), triggering RED HIGH RISK modal & alarm.',
  },
  {
    id: 'userinfo-at-spoof',
    title: 'Deceptive RFC 3986 Userinfo @ Confusion',
    category: 'Userinfo Deception',
    expectedRisk: 'HIGH RISK',
    payload: 'https://paypal.com@verify-account-security.site/login',
    description: 'Embeds brand name before the "@" character. Browsers discard characters before "@", landing on target site.',
    whatJudgesShouldLookFor: 'Immediately flags userinfo deception (+60 penalty, HIGH RISK). Triggers prominent RED warning popup.',
  },
  {
    id: 'destination-mismatch-quishing',
    title: 'Sticker Swap Quishing (Domain Mismatch)',
    category: 'Destination Mismatch',
    expectedRisk: 'HIGH RISK',
    payload: 'https://fake-chase-portal.com/login',
    referenceDomain: 'chase.com',
    description: 'Simulates physical QR code sticker placed over a Chase Bank ATM poster.',
    whatJudgesShouldLookFor: 'Detects expected domain mismatch (+40 penalty). Warns that poster or flyer may have been tampered with.',
  },
  {
    id: 'upi-merchant-payment',
    title: 'UPI Merchant Payment URI Payload',
    category: 'Payment URI',
    expectedRisk: 'SUSPICIOUS',
    payload: 'upi://pay?pa=coffee.merchant@okaxis&pn=Artisan+Coffee&am=150.00&cu=INR&tn=Espresso+Order',
    description: 'Standard UPI QR payment request for ₹150.00 to merchant coffee.merchant@okaxis.',
    whatJudgesShouldLookFor: 'Correctly identifies payment_uri payload. Shows Payee VPA, payee name, and transaction amount. Reminds user to verify payee in their banking app and never enter UPI PIN to receive money.',
  },
  {
    id: 'dangerous-javascript',
    title: 'High-Risk javascript: URI Execution Payload',
    category: 'Dangerous Scheme',
    expectedRisk: 'HIGH RISK',
    payload: 'javascript:alert(document.cookie)',
    description: 'Non-web execution scheme capable of executing client-side scripts inside certain webviews.',
    whatJudgesShouldLookFor: 'Blocks browser navigation completely. Flags dangerous URI scheme (+75 penalty, HIGH RISK).',
  },
  {
    id: 'wifi-config-payload',
    title: 'Offline Wi-Fi Network Setup',
    category: 'Offline Wi-Fi',
    expectedRisk: 'LOW RISK',
    payload: 'WIFI:S:TrueQR-Guest-WiFi;T:WPA;P:Secur3Passw0rd;;',
    description: 'Standard offline QR code for connecting smartphones to Wi-Fi. Does not point to a web address.',
    whatJudgesShouldLookFor: 'Correctly identifies payload as offline Wi-Fi setup. Does not treat it as a web link.',
  },
];

interface DemoModeViewProps {
  onRunDemo: (payload: string, referenceDomain?: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DemoModeView: React.FC<DemoModeViewProps> = ({ onRunDemo, onShowToast }) => {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(DEMO_SCENARIOS[5]); // Default to brand spoofing
  const [copied, setCopied] = useState(false);

  const handleCopyPayload = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast('Demo payload copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Banner */}
      <div className="rounded-2xl border border-[#DCE9DE] bg-[#F7FBF7] p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2.5 rounded-xl bg-[#EAF7EC] text-[#2E8B57] border border-[#DCE9DE]">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1F5135] tracking-tight">Demonstration Showcase</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#EAF7EC] text-[#15803D] border border-[#DCE9DE] font-semibold">
                Judges Mode
              </span>
            </div>
            <p className="text-xs text-[#647067]">
              Select illustrative QR scenarios to evaluate the real deterministic risk engine and high-risk alarm
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-white border border-[#DCE9DE] text-xs text-[#647067] leading-relaxed">
          <strong className="text-[#1F5135]">Hackathon Note:</strong> All 11 scenarios run through the exact same backend heuristic analysis engine and database persistence pipeline as real camera scans.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenarios Selection Sidebar */}
        <div className="lg:col-span-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#647067] px-1">
            Choose a Showcase Scenario ({DEMO_SCENARIOS.length})
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {DEMO_SCENARIOS.map((scen) => {
              const isSelected = selectedScenario.id === scen.id;
              return (
                <button
                  key={scen.id}
                  onClick={() => setSelectedScenario(scen)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#EAF7EC] border-[#2E8B57] shadow-xs'
                      : 'bg-white border-[#DCE9DE] hover:bg-[#F7FBF7]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-[#1F5135] truncate">{scen.title}</span>
                    <RiskBadge category={scen.expectedRisk} size="sm" showIcon={false} />
                  </div>
                  <span className="text-[11px] font-mono text-[#2E8B57] block truncate font-semibold">
                    {scen.category}
                  </span>
                  <p className="text-[11px] text-[#647067] line-clamp-2 mt-1">
                    {scen.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Scenario Detail & Live Action Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[#DCE9DE] bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#DCE9DE]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#2E8B57] font-semibold">
                  Scenario Details
                </span>
                <h3 className="text-lg font-bold text-[#1F5135] tracking-tight mt-0.5">
                  {selectedScenario.title}
                </h3>
                <p className="text-xs text-[#647067] mt-1">{selectedScenario.description}</p>
              </div>
              <RiskBadge category={selectedScenario.expectedRisk} size="md" />
            </div>

            {/* Target Payload Display */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#647067] mb-1.5">
                <span>Decoded Payload String</span>
                <button
                  onClick={() => handleCopyPayload(selectedScenario.payload)}
                  className="text-[#2E8B57] hover:text-[#1F5135] flex items-center gap-1 font-mono text-[11px] font-semibold"
                >
                  {copied ? <Check size={12} className="text-[#15803D]" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] font-mono text-xs text-[#1F5135] break-all select-all leading-relaxed">
                {selectedScenario.payload}
              </div>
            </div>

            {/* Expected Reference Domain (if scenario has one) */}
            {selectedScenario.referenceDomain && (
              <div className="p-3 rounded-xl bg-[#EAF7EC] border border-[#DCE9DE] text-xs">
                <span className="text-[10px] font-mono uppercase text-[#647067] block mb-0.5">
                  Simulated User Expected Domain:
                </span>
                <span className="font-mono font-bold text-[#1F5135]">
                  {selectedScenario.referenceDomain}
                </span>
              </div>
            )}

            {/* What Judges Should Look For Card */}
            <div className="p-4 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F5135] uppercase tracking-wider">
                <Eye size={14} className="text-[#2E8B57]" />
                <span>What Judges Should Observe in Analysis:</span>
              </div>
              <p className="text-xs text-[#647067] leading-relaxed">
                {selectedScenario.whatJudgesShouldLookFor}
              </p>
            </div>

            {/* Action to Execute Real Analysis */}
            <button
              onClick={() => onRunDemo(selectedScenario.payload, selectedScenario.referenceDomain)}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-[#2E8B57] hover:bg-[#1F5135] shadow-sm transition flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Execute Real Heuristic Analysis</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
