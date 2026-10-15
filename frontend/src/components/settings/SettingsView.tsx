import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Trash2,
  Sliders,
  Volume2,
  VolumeX,
  Play
} from 'lucide-react';
import { clearAllHistory } from '../../services/api';
import {
  isAlarmEnabled,
  setAlarmEnabled,
  testAlarmSound,
  stopHighRiskAlarm
} from '../../utils/audioAlarm';

interface SettingsViewProps {
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  historyEnabled: boolean;
  onToggleHistory: (enabled: boolean) => void;
  confirmStrictness: 'all' | 'suspicious_only';
  onSetConfirmStrictness: (val: 'all' | 'suspicious_only') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onShowToast,
  historyEnabled,
  onToggleHistory,
  confirmStrictness,
  onSetConfirmStrictness,
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const [alarmActive, setAlarmActive] = useState<boolean>(true);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    setAlarmActive(isAlarmEnabled());
  }, []);

  const handleToggleAlarm = (enabled: boolean) => {
    setAlarmEnabled(enabled);
    setAlarmActive(enabled);
    if (!enabled) {
      stopHighRiskAlarm();
    }
    onShowToast(
      enabled ? 'High-risk warning alarm enabled' : 'High-risk warning alarm muted',
      'info'
    );
  };

  const handleTestSound = async () => {
    setIsPlayingTest(true);
    try {
      await testAlarmSound();
      onShowToast('Playing short test alarm sound', 'info');
    } catch {
      onShowToast('Audio playback blocked or unavailable in this browser context', 'error');
    } finally {
      setTimeout(() => setIsPlayingTest(false), 1200);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to delete all local scan history records?')) {
      return;
    }
    setIsClearing(true);
    try {
      await clearAllHistory();
      onShowToast('Local scan history cleared successfully.', 'success');
    } catch (err: any) {
      onShowToast('Failed to clear history', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="rounded-2xl border border-[#DCE9DE] bg-[#F7FBF7] p-6 shadow-xs flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-[#EAF7EC] text-[#2E8B57] border border-[#DCE9DE]">
          <SettingsIcon size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1F5135] tracking-tight">Application Settings & Privacy</h2>
          <p className="text-xs text-[#647067]">
            Control audio alarms, local storage, safety confirmations, and view deterministic engine rules
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Preferences Card */}
        <div className="rounded-2xl border border-[#DCE9DE] bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCE9DE]">
            <Sliders size={18} className="text-[#2E8B57]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F5135]">
              Audio & Safeguards
            </h3>
          </div>

          {/* High-Risk Warning Alarm Setting */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#1F5135] flex items-center gap-1.5">
                  {alarmActive ? (
                    <Volume2 size={15} className="text-[#DC2626]" />
                  ) : (
                    <VolumeX size={15} className="text-[#647067]" />
                  )}
                  <span>High-Risk Alarm: {alarmActive ? 'ON' : 'OFF'}</span>
                </span>
                <span className="text-[11px] text-[#647067] leading-relaxed block mt-0.5">
                  A short warning sound plays when TrueQR detects a high-risk destination.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={alarmActive}
                  onChange={(e) => handleToggleAlarm(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DC2626]"></div>
              </label>
            </div>

            {/* Test Alarm Sound Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#647067]">Verify audio tone output:</span>
              <button
                type="button"
                onClick={handleTestSound}
                disabled={isPlayingTest}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1F5135] bg-[#EAF7EC] hover:bg-[#DCE9DE] border border-[#DCE9DE] transition flex items-center gap-1.5 active:scale-95"
              >
                <Play size={12} className={isPlayingTest ? 'animate-spin' : ''} />
                <span>{isPlayingTest ? 'Playing...' : 'Test Warning Sound'}</span>
              </button>
            </div>
          </div>

          {/* History Persistence Toggle */}
          <div className="pt-3 border-t border-[#DCE9DE] flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#1F5135] block">Persist Scan History</span>
              <span className="text-[11px] text-[#647067] leading-relaxed block mt-0.5">
                Automatically store recent scans in the local SQLite database for review.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={historyEnabled}
                onChange={(e) => onToggleHistory(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E8B57]"></div>
            </label>
          </div>

          {/* Safety Confirmation Strictness */}
          <div className="space-y-2 pt-3 border-t border-[#DCE9DE]">
            <span className="text-xs font-bold text-[#1F5135] block">Safety Barrier Prompt</span>
            <span className="text-[11px] text-[#647067] leading-relaxed block">
              When should TrueQR present the explicit confirmation screen before external navigation?
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onSetConfirmStrictness('all')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                  confirmStrictness === 'all'
                    ? 'bg-[#EAF7EC] border-[#2E8B57] text-[#1F5135]'
                    : 'bg-[#F7FBF7] border-[#DCE9DE] text-[#647067] hover:text-[#1F5135]'
                }`}
              >
                Always Prompt (Max Safe)
              </button>
              <button
                type="button"
                onClick={() => onSetConfirmStrictness('suspicious_only')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                  confirmStrictness === 'suspicious_only'
                    ? 'bg-[#EAF7EC] border-[#2E8B57] text-[#1F5135]'
                    : 'bg-[#F7FBF7] border-[#DCE9DE] text-[#647067] hover:text-[#1F5135]'
                }`}
              >
                Suspicious & High Risk Only
              </button>
            </div>
          </div>

          {/* Clear Data Action */}
          <div className="pt-3 border-t border-[#DCE9DE] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#1F5135] block">Erase Scan History</span>
              <span className="text-[11px] text-[#647067] block mt-0.5">
                Permanently purge all stored scans.
              </span>
            </div>
            <button
              onClick={handleClearHistory}
              disabled={isClearing}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-red-100 border border-red-200 transition flex items-center gap-1.5 active:scale-95"
            >
              <Trash2 size={13} />
              <span>{isClearing ? 'Clearing...' : 'Clear All'}</span>
            </button>
          </div>
        </div>

        {/* Heuristic Scoring Model Transparency Card */}
        <div className="rounded-2xl border border-[#DCE9DE] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCE9DE]">
            <Shield size={18} className="text-[#2E8B57]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F5135]">
              Heuristic Scoring Rules
            </h3>
          </div>

          <p className="text-xs text-[#647067] leading-relaxed">
            TrueQR evaluates destination structures deterministically using transparent rules without sending link data to opaque external servers:
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#EAF7EC] border border-[#DCE9DE] flex items-center justify-between">
              <span className="text-[#15803D] font-bold">0 – 24: LOW RISK</span>
              <span className="text-[#647067] text-[11px]">No major warning indicators</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <span className="text-[#D97706] font-bold">25 – 59: SUSPICIOUS</span>
              <span className="text-[#647067] text-[11px]">Unencrypted, shortener, raw IP</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-red-200 flex items-center justify-between">
              <span className="text-[#DC2626] font-bold">60 – 100: HIGH RISK</span>
              <span className="text-[#647067] text-[11px]">Spoofing, @ userinfo, mismatch</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] text-[11px] text-[#647067]">
            <strong className="text-[#1F5135]">Important Note:</strong> Rule-based heuristic scoring is NOT machine learning and does NOT guarantee that an unflagged link is safe. Attackers can compromise legitimate domains.
          </div>
        </div>
      </div>

      {/* Honest Capability Roadmap & Privacy Commitments */}
      <div className="rounded-2xl border border-[#DCE9DE] bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F5135]">
          Architecture & Privacy Guarantees
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F5135]">Heuristic URL Engine</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#EAF7EC] text-[#15803D] font-bold">Active</span>
            </div>
            <p className="text-[11px] text-[#647067]">Deterministic checks, shortener list, punycode, UPI, & IP detection.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F5135]">SQLite Persistence</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#EAF7EC] text-[#15803D] font-bold">Active</span>
            </div>
            <p className="text-[11px] text-[#647067]">Local history logging, search, filtering, CSV/JSON export, and reports.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F5135]">Global Threat Sync</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-[#647067]">Planned</span>
            </div>
            <p className="text-[11px] text-[#647067]">Cross-device community threat feed (requires auth & verified backend).</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F5135]">Safe Sandbox Preview</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-[#647067]">Planned</span>
            </div>
            <p className="text-[11px] text-[#647067]">Isolated headless browser screenshots behind strict egress firewall.</p>
          </div>
        </div>

        <div className="pt-2 text-xs text-[#647067] flex items-center justify-between border-t border-[#DCE9DE]">
          <span>Zero telemetry • Zero advertising cookies • Client-side camera processing</span>
          <span className="font-mono text-[#2E8B57] font-semibold">TrueQR v1.1.0</span>
        </div>
      </div>
    </div>
  );
};
