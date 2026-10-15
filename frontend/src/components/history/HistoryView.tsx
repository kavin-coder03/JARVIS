import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Trash2,
  Download,
  ArrowUpDown,
  AlertOctagon,
  Camera,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { HistoryItem } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import {
  getHistoryList,
  deleteScanRecord,
  clearAllHistory,
  getExportUrl,
} from '../../services/api';

interface HistoryViewProps {
  onSelectScan: (scanId: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectScan, onShowToast }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [clearModalOpen, setClearModalOpen] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getHistoryList(searchQuery, categoryFilter, sortOrder);
      setItems(data.items);
      setTotalCount(data.totalCount);
    } catch (err: any) {
      onShowToast(`Failed to load history: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [categoryFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const ok = await deleteScanRecord(id);
      if (ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        setTotalCount((prev) => Math.max(0, prev - 1));
        onShowToast('Scan record deleted', 'success');
      }
    } catch (err: any) {
      onShowToast('Failed to delete scan record', 'error');
    }
  };

  const handleConfirmClear = async () => {
    try {
      const ok = await clearAllHistory();
      if (ok) {
        setItems([]);
        setTotalCount(0);
        setClearModalOpen(false);
        onShowToast('All scan history cleared', 'success');
      }
    } catch (err: any) {
      onShowToast('Failed to clear history', 'error');
    }
  };

  const getSourceIcon = (type: string) => {
    if (type === 'camera') return <Camera size={13} className="text-[#2E8B57]" />;
    if (type === 'upload') return <Upload size={13} className="text-[#2E8B57]" />;
    return <LinkIcon size={13} className="text-[#2E8B57]" />;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header & Controls Card */}
      <div className="rounded-2xl border border-[#DCE9DE] bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE9DE]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#EAF7EC] text-[#2E8B57] border border-[#DCE9DE]">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1F5135] tracking-tight">Scan History Log</h2>
              <p className="text-xs text-[#647067]">
                {totalCount} stored scan {totalCount === 1 ? 'record' : 'records'} in local SQLite database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <a
              href={getExportUrl('csv')}
              download
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1F5135] hover:bg-[#EAF7EC] bg-[#F7FBF7] transition flex items-center gap-1.5 border border-[#DCE9DE]"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </a>

            <a
              href={getExportUrl('json')}
              download
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1F5135] hover:bg-[#EAF7EC] bg-[#F7FBF7] transition flex items-center gap-1.5 border border-[#DCE9DE]"
            >
              <Download size={13} />
              <span>JSON</span>
            </a>

            {items.length > 0 && (
              <button
                onClick={() => setClearModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-red-100 bg-[#FEF2F2] transition flex items-center gap-1.5 border border-red-200 ml-auto sm:ml-0 active:scale-95"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647067]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by hostname, registered domain, or payload..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] text-xs text-[#24312A] placeholder:text-[#647067] focus:border-[#2E8B57] focus:outline-none transition font-mono"
            />
          </form>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'LOW RISK', 'SUSPICIOUS', 'HIGH RISK'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-[#EAF7EC] text-[#1F5135] border border-[#2E8B57]'
                    : 'text-[#647067] hover:text-[#1F5135] bg-[#F7FBF7] border border-[#DCE9DE]'
                }`}
              >
                {cat}
              </button>
            ))}

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-1.5 rounded-lg text-[#647067] hover:text-[#1F5135] bg-[#F7FBF7] border border-[#DCE9DE] ml-1 transition"
              title={`Sort by ${sortOrder === 'desc' ? 'Oldest first' : 'Newest first'}`}
            >
              <ArrowUpDown size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* History Items List */}
      {isLoading ? (
        <div className="rounded-2xl border border-[#DCE9DE] bg-white p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#647067]">Loading scan history...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[#DCE9DE] bg-white p-12 text-center space-y-3">
          <div className="p-3 rounded-2xl bg-[#EAF7EC] text-[#2E8B57] w-fit mx-auto">
            <History size={28} />
          </div>
          <h3 className="text-sm font-bold text-[#1F5135]">No Scan Records Found</h3>
          <p className="text-xs text-[#647067] max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'ALL'
              ? 'No records match your active search or risk category filters.'
              : 'Scan or inspect your first QR code using the camera or image upload to populate history.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectScan(item.id)}
              className="group rounded-xl border border-[#DCE9DE] bg-white hover:bg-[#F7FBF7] p-4 transition-all duration-150 cursor-pointer hover:border-[#2E8B57] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5">
                  <RiskBadge category={item.risk_category} size="sm" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1F5135] font-mono truncate">
                      {item.hostname || item.sanitized_url || item.original_payload}
                    </span>
                    <span className="text-[11px] font-mono text-[#647067] bg-[#F7FBF7] px-2 py-0.2 rounded border border-[#DCE9DE]">
                      Score: {item.risk_score}
                    </span>
                  </div>
                  <p className="text-xs text-[#647067] font-mono truncate max-w-lg">
                    {item.sanitized_url || item.original_payload}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs text-[#647067] font-mono self-end sm:self-center">
                <div className="flex items-center gap-1 text-[11px]">
                  {getSourceIcon(item.source_type)}
                  <span className="capitalize">{item.source_type}</span>
                </div>
                <span>•</span>
                <span className="text-[11px]">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                </span>

                <button
                  onClick={(e) => handleDeleteItem(e, item.id)}
                  className="p-1.5 text-[#647067] hover:text-[#DC2626] hover:bg-red-50 rounded-lg transition"
                  title="Delete record"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <AlertOctagon size={24} />
              <h3 className="text-base font-bold text-[#1F5135]">Clear All Scan History?</h3>
            </div>
            <p className="text-xs text-[#647067] leading-relaxed">
              This will permanently delete all {totalCount} stored scan records from your local SQLite database. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setClearModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#647067] hover:text-[#1F5135] bg-[#F7FBF7] hover:bg-[#EAF7EC] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-red-700 shadow-sm transition active:scale-95"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
