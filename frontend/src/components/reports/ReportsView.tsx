import React, { useState, useEffect } from 'react';
import {
  Flag,
  Plus,
  Trash2,
  Clock,
  Send,
  X,
  Lock,
  Radio,
  Laptop,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { ReportItem, ReportCreateInput, CommunityThreatAlert } from '../../types';
import { getReportsList, submitReport, deleteReportRecord } from '../../services/api';

interface ReportsViewProps {
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialReportData?: Partial<ReportCreateInput> | null;
  onClearInitialReportData?: () => void;
  communityAlerts?: CommunityThreatAlert[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  onShowToast,
  initialReportData,
  onClearInitialReportData,
  communityAlerts = [],
}) => {
  const [activeTab, setActiveTab] = useState<'community' | 'local'>('community');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [url, setUrl] = useState('');
  const [hostname, setHostname] = useState('');
  const [riskCategory, setRiskCategory] = useState('HIGH RISK');
  const [riskScore, setRiskScore] = useState<number>(75);
  const [reason, setReason] = useState('phishing');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await getReportsList();
      setReports(data);
    } catch (err: any) {
      onShowToast(`Failed to fetch reports: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (initialReportData && initialReportData.url) {
      setUrl(initialReportData.url);
      setHostname(initialReportData.hostname || '');
      setRiskCategory(initialReportData.risk_category || 'HIGH RISK');
      setRiskScore(initialReportData.risk_score ?? 75);
      setReason(initialReportData.reason || 'phishing');
      setNotes(initialReportData.notes || '');
      setModalOpen(true);
      if (onClearInitialReportData) onClearInitialReportData();
    }
  }, [initialReportData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!url.trim()) {
      setFormError('Please provide the destination URL to report.');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: ReportCreateInput = {
        url: url.trim(),
        hostname: hostname.trim() || undefined,
        risk_category: riskCategory,
        risk_score: riskScore,
        reason,
        notes: notes.trim() || undefined,
      };

      const created = await submitReport(input);
      setReports((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setModalOpen(false);
      resetForm();
      onShowToast('Suspicious destination report recorded.', 'success');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      const ok = await deleteReportRecord(reportId);
      if (ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        onShowToast('Report removed', 'success');
      }
    } catch (err: any) {
      onShowToast('Failed to delete report', 'error');
    }
  };

  const resetForm = () => {
    setUrl('');
    setHostname('');
    setRiskCategory('HIGH RISK');
    setRiskScore(75);
    setReason('phishing');
    setNotes('');
    setFormError(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header Card */}
      <div className="rounded-2xl border border-[#DCE9DE] bg-white p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-red-50 text-[#DC2626] border border-red-200">
            <Flag size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1F5135] tracking-tight">
              Suspicious Destination Reports
            </h2>
            <p className="text-xs text-[#647067]">
              Community and user-flagged malicious QR targets stored locally in SQLite
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-red-700 shadow-sm transition flex items-center gap-2 active:scale-95"
          >
            <Plus size={15} />
            <span>Submit Manual Report</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DCE9DE] pb-1">
        <button
          onClick={() => setActiveTab('community')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'community'
              ? 'bg-[#FEF2F2] text-[#DC2626] border border-red-200 shadow-xs'
              : 'text-[#647067] hover:text-[#1F5135] hover:bg-[#F7FBF7]'
          }`}
        >
          <Radio size={14} className={activeTab === 'community' ? 'animate-pulse' : ''} />
          <span>Live Community Threats ({communityAlerts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('local')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'local'
              ? 'bg-[#EAF7EC] text-[#1F5135] border border-[#DCE9DE] shadow-xs'
              : 'text-[#647067] hover:text-[#1F5135] hover:bg-[#F7FBF7]'
          }`}
        >
          <Flag size={14} />
          <span>Saved Reports Archive ({reports.length})</span>
        </button>
      </div>

      {/* Community Alerts Feed */}
      {activeTab === 'community' && (
        <div className="space-y-3">
          {communityAlerts.length === 0 ? (
            <div className="rounded-2xl border border-[#DCE9DE] bg-white p-12 text-center space-y-3">
              <div className="p-3 rounded-2xl bg-red-50 text-[#DC2626] w-fit mx-auto border border-red-100">
                <Radio size={28} />
              </div>
              <h3 className="text-sm font-bold text-[#1F5135]">No Live Community Alerts Yet</h3>
              <p className="text-xs text-[#647067] max-w-sm mx-auto">
                When any laptop on the network scans a high-risk QR and clicks "Report to Community", the alert broadcasts here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {communityAlerts.map((alert, idx) => (
                <div
                  key={alert.report_id || idx}
                  className="rounded-xl border-2 border-red-200 bg-[#FEF2F2]/70 p-4 space-y-3 shadow-xs hover:border-[#DC2626] transition animate-in fade-in duration-150"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-red-200 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider bg-[#DC2626] text-white">
                        {alert.risk_level || 'HIGH RISK'}
                      </span>
                      <span className="text-xs font-bold text-[#991B1B] font-mono">
                        {alert.safe_display_target || alert.hostname || 'Suspicious Target'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#7F1D1D] font-mono">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold">
                        <Laptop size={13} className="text-[#DC2626]" />
                        <span>Origin: {alert.reporter_client_id}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-[#647067]">
                        <Clock size={12} />
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-[#7F1D1D] break-all select-all font-medium bg-white p-2.5 rounded-lg border border-red-200">
                    {alert.destination}
                  </div>

                  {alert.reasons && alert.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {alert.reasons.map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white text-[#991B1B] border border-red-200 flex items-center gap-1"
                        >
                          <AlertTriangle size={11} className="text-[#DC2626]" />
                          <span>{r}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports List */}
      {activeTab === 'local' && (
        <>
          {isLoading ? (
            <div className="rounded-2xl border border-[#DCE9DE] bg-white p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-[#647067]">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-2xl border border-[#DCE9DE] bg-white p-12 text-center space-y-3">
              <div className="p-3 rounded-2xl bg-red-50 text-[#DC2626] w-fit mx-auto border border-red-100">
                <Flag size={28} />
              </div>
              <h3 className="text-sm font-bold text-[#1F5135]">No Reports Filed Yet</h3>
              <p className="text-xs text-[#647067] max-w-sm mx-auto">
                When you inspect a deceptive QR code, you can file a report with notes to document the attack vector.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="rounded-xl border border-[#DCE9DE] bg-white p-4 space-y-3 shadow-xs hover:border-[#2E8B57] transition"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#DCE9DE] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider bg-[#FEF2F2] border border-red-200 text-[#DC2626]">
                    {rep.reason}
                  </span>
                  <span className="text-xs font-bold text-[#1F5135] font-mono">
                    {rep.hostname || 'Unspecified Host'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#647067] font-mono">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock size={12} />
                    <span>{rep.created_at ? new Date(rep.created_at).toLocaleString() : ''}</span>
                  </span>
                  <button
                    onClick={() => handleDelete(rep.id)}
                    className="p-1 text-[#647067] hover:text-[#DC2626] hover:bg-red-50 rounded transition"
                    title="Delete report"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="text-xs font-mono text-[#1F5135] break-all select-all font-medium">
                {rep.url}
              </div>

              {rep.notes && (
                <div className="p-2.5 rounded-lg bg-[#F7FBF7] border border-[#DCE9DE] text-xs text-[#647067]">
                  <span className="text-[10px] font-mono text-[#1F5135] font-bold block mb-0.5 uppercase tracking-wider">
                    Investigator Notes:
                  </span>
                  <p className="leading-relaxed">{rep.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )}

      {/* Submit Report Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-[#647067] hover:text-[#1F5135] p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FEF2F2] text-[#DC2626] border border-red-200">
                <Flag size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1F5135]">Report Suspicious Destination</h3>
                <p className="text-xs text-[#647067]">
                  Document a deceptive QR code, quishing sticker, or phishing link
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#1F5135] uppercase tracking-wider mb-1">
                  Destination URL <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://malicious-example.xyz/login"
                  className="w-full rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] px-3.5 py-2 text-xs text-[#24312A] font-mono focus:border-[#DC2626] focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F5135] uppercase tracking-wider mb-1">
                  Primary Threat Reason <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] px-3 py-2 text-xs text-[#24312A] focus:border-[#DC2626] focus:outline-none"
                >
                  <option value="phishing">Suspected Phishing / Credential Theft</option>
                  <option value="impersonation">Brand Impersonation / Deceptive Subdomain</option>
                  <option value="suspicious_redirect">Concealed URL Shortener / Redirect</option>
                  <option value="malware">Malware / Suspicious App Download</option>
                  <option value="scam">Physical QR Sticker Tampering / Quishing</option>
                  <option value="other">Other Suspicious Signal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F5135] uppercase tracking-wider mb-1">
                  Context / Notes <span className="text-[#647067] font-normal">(Optional, max 1000 chars)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  maxLength={1000}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Found on parking meter sticker in downtown garage, claimed to be payment portal..."
                  className="w-full rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] p-3 text-xs text-[#24312A] placeholder:text-[#647067] focus:border-[#DC2626] focus:outline-none"
                />
              </div>

              {formError && (
                <p className="text-xs text-[#DC2626] bg-[#FEF2F2] p-2.5 rounded-lg border border-red-200">
                  {formError}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-[#DCE9DE] text-[11px] text-[#647067]">
                <span className="flex items-center gap-1">
                  <Lock size={12} /> Stored locally in SQLite
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#647067] hover:text-[#1F5135] bg-[#F7FBF7] border border-[#DCE9DE]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-red-700 shadow-sm transition flex items-center gap-1.5 active:scale-95"
                  >
                    {isSubmitting ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Submit Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
