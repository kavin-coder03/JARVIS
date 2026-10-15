import React from 'react';
import { Shield, Lock, Eye, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[#DCE9DE] bg-[#F7FBF7] text-[#647067] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#EAF7EC] text-[#2E8B57] border border-[#DCE9DE]">
              <Shield size={18} />
            </div>
            <span className="font-extrabold text-[#1F5135] tracking-tight">
              True<span className="text-[#2E8B57]">QR</span>
            </span>
          </div>
          <p className="text-xs text-[#647067] leading-relaxed">
            The QR Destination Safety Assistant. Scan. Inspect. Decide. Adding an understandable safety checkpoint between scanning a QR code and opening its destination.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-[#647067]">
            <span>College Hackathon Edition</span>
            <span>•</span>
            <span>v1.1.0</span>
          </div>
        </div>

        {/* Security Principles */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F5135]">
            Core Safeguard Principles
          </h4>
          <ul className="text-xs space-y-2 text-[#647067]">
            <li className="flex items-start gap-2">
              <Lock size={14} className="text-[#2E8B57] shrink-0 mt-0.5" />
              <span>Never automatically navigates or executes decoded payloads without user consent.</span>
            </li>
            <li className="flex items-start gap-2">
              <Eye size={14} className="text-[#2E8B57] shrink-0 mt-0.5" />
              <span>Full transparency: triggered risk indicators are explained in plain language.</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield size={14} className="text-[#2E8B57] shrink-0 mt-0.5" />
              <span>Privacy conscious: camera frames stay on-device; zero third-party advertising trackers.</span>
            </li>
          </ul>
        </div>

        {/* Security Limitation Disclaimer */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F5135] flex items-center gap-1.5">
            <AlertCircle size={14} className="text-[#D97706]" />
            <span>Honest Security Notice</span>
          </h4>
          <div className="p-3 rounded-xl bg-white border border-[#DCE9DE] text-[11px] leading-relaxed text-[#647067]">
            TrueQR analyzes structural indicators deterministically. A <strong>LOW RISK</strong> verdict does not guarantee that a destination website is completely safe. Attackers can compromise legitimate websites. Always practice defensive browsing.
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#DCE9DE] flex flex-col sm:flex-row items-center justify-between text-xs text-[#647067]">
        <p>© 2026 TrueQR Safety Assistant. Built for Security, Reliability & Consent.</p>
        <p className="mt-2 sm:mt-0 font-mono text-[#2E8B57] font-semibold">Status: Local Heuristic Engine Active</p>
      </div>
    </footer>
  );
};
