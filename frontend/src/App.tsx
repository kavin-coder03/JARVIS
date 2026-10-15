import React, { useState, useEffect } from 'react';
import { NavTab, AnalysisResponse, ReportCreateInput, CommunityThreatAlert } from './types';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { CameraScanner } from './components/scanner/CameraScanner';
import { ImageUploader } from './components/scanner/ImageUploader';
import { ManualInput } from './components/scanner/ManualInput';
import { AnalysisResultView } from './components/analysis/AnalysisResultView';
import { HistoryView } from './components/history/HistoryView';
import { ReportsView } from './components/reports/ReportsView';
import { DemoModeView } from './components/demo/DemoModeView';
import { SettingsView } from './components/settings/SettingsView';
import { HighRiskModal } from './components/common/HighRiskModal';
import { CommunityAlertModal } from './components/common/CommunityAlertModal';
import {
  checkHealth,
  analyzePayload,
  getScanDetail,
  broadcastCommunityAlert,
  getCommunityAlertsList
} from './services/api';
import { communitySocket } from './services/communitySocket';
import {
  isAlarmEnabled,
  playHighRiskAlarm,
  stopHighRiskAlarm
} from './utils/audioAlarm';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [highRiskModalOpen, setHighRiskModalOpen] = useState(false);
  const [alarmSounding, setAlarmSounding] = useState(false);

  // Real-Time Community Alert States across 4 laptops
  const [communityAlerts, setCommunityAlerts] = useState<CommunityThreatAlert[]>([]);
  const [activeCommunityAlert, setActiveCommunityAlert] = useState<CommunityThreatAlert | null>(null);
  const [communityConnected, setCommunityConnected] = useState(false);
  const [communityClientCount, setCommunityClientCount] = useState(1);

  // Settings
  const [historyEnabled, setHistoryEnabled] = useState<boolean>(() => {
    return localStorage.getItem('trueqr_history_enabled') !== 'false';
  });

  const [confirmStrictness, setConfirmStrictness] = useState<'all' | 'suspicious_only'>(() => {
    return (localStorage.getItem('trueqr_confirm_strictness') as any) || 'all';
  });

  // Pre-filled report data
  const [reportInitialData, setReportInitialData] = useState<Partial<ReportCreateInput> | null>(null);

  // Health check on mount & periodic ping
  useEffect(() => {
    const ping = async () => {
      const res = await checkHealth();
      setBackendOnline(res.status === 'healthy');
    };
    ping();
    const interval = setInterval(ping, 10000);
    return () => clearInterval(interval);
  }, []);

  // Persistent Real-Time Community Alert WebSocket listener
  useEffect(() => {
    communitySocket.connect();

    // Subscribe to connection status
    const unsubStatus = communitySocket.subscribeStatus((connected, count) => {
      setCommunityConnected(connected);
      setCommunityClientCount(count);
    });

    // Subscribe to incoming threat alerts broadcasted across the 4 laptops
    const unsubAlerts = communitySocket.subscribeAlerts((alert) => {
      console.warn('[TrueQR App] Real-time community alert received:', alert);
      setCommunityAlerts((prev) => [alert, ...prev.filter((a) => a.report_id !== alert.report_id)]);
      setActiveCommunityAlert(alert);

      // Sound audio alarm on this device if enabled
      if (isAlarmEnabled()) {
        const played = playHighRiskAlarm();
        if (played) {
          setAlarmSounding(true);
        }
      }

      showToast(`🚨 Network Alert: ${alert.hostname || alert.safe_display_target}`, 'error');
    });

    // Fetch initial saved community alerts
    getCommunityAlertsList()
      .then((data) => setCommunityAlerts(data))
      .catch(() => {});

    return () => {
      unsubStatus();
      unsubAlerts();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleHistory = (enabled: boolean) => {
    setHistoryEnabled(enabled);
    localStorage.setItem('trueqr_history_enabled', enabled ? 'true' : 'false');
    showToast(enabled ? 'Scan history persistence enabled' : 'Scan history disabled', 'info');
  };

  const handleSetConfirmStrictness = (val: 'all' | 'suspicious_only') => {
    setConfirmStrictness(val);
    localStorage.setItem('trueqr_confirm_strictness', val);
    showToast(`Confirmation mode: ${val === 'all' ? 'Always Prompt' : 'Suspicious & High Risk Only'}`, 'info');
  };

  // Central analysis handler
  const handlePerformAnalysis = async (
    payload: string,
    sourceType: 'camera' | 'upload' | 'manual' = 'manual',
    referenceDomain?: string
  ) => {
    setIsProcessing(true);
    try {
      const response = await analyzePayload(payload, referenceDomain, sourceType, historyEnabled);
      setActiveAnalysis(response);
      setCurrentTab('results' as any);

      // Trigger High-Risk Red Modal and optional warning alarm
      if (response.risk_category === 'HIGH RISK') {
        setHighRiskModalOpen(true);
        if (isAlarmEnabled()) {
          const played = playHighRiskAlarm();
          if (played) {
            setAlarmSounding(true);
            setTimeout(() => setAlarmSounding(false), 1900);
          }
        }
      }

      showToast('Payload analyzed successfully', 'success');
    } catch (err: any) {
      showToast(`Analysis failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Inspect existing scan from history
  const handleSelectHistoryScan = async (scanId: string) => {
    try {
      const record = await getScanDetail(scanId);
      if (record) {
        // Construct analysis response view
        const adapted: AnalysisResponse = {
          risk_score: record.risk_score,
          risk_category: record.risk_category,
          destination: {
            original_input: record.original_payload,
            normalized_url: record.sanitized_url || record.original_payload,
            payload_type: record.payload_type,
            scheme: record.scheme,
            hostname: record.hostname,
            registered_domain: record.hostname,
            port: record.port,
            query_params_count: 0,
            has_credentials: false,
            is_secure_transport: record.scheme === 'https',
            is_ip_address: false,
            is_shortener: false,
            is_internationalized: false,
          },
          triggered_signals: record.signals || [],
          untriggered_checks: record.untriggered || [],
          verdict_headline: `${record.risk_category} Destination Record`,
          verdict_explanation: `Recorded scan from ${new Date(record.created_at).toLocaleString()}`,
          suggested_action: 'Review the saved signals before opening.',
          security_limitations: 'Saved historical scan record.',
          scan_id: record.id,
          timestamp: record.created_at,
        };
        setActiveAnalysis(adapted);
        setCurrentTab('results' as any);
      }
    } catch (err: any) {
      showToast('Could not load scan details', 'error');
    }
  };

  const handleOpenReportModal = (
    url: string,
    hostname?: string,
    category?: string,
    score?: number
  ) => {
    setReportInitialData({
      url,
      hostname,
      risk_category: category,
      risk_score: score,
      reason: 'phishing',
    });
    setCurrentTab('reports');
  };

  const handleDismissHighRiskModal = () => {
    stopHighRiskAlarm();
    setAlarmSounding(false);
    setHighRiskModalOpen(false);
  };

  const handleReportToCommunity = async () => {
    if (!activeAnalysis) return;
    const reasons = activeAnalysis.triggered_signals.map((s) => s.name);
    try {
      const broadcasted = await broadcastCommunityAlert({
        url: activeAnalysis.destination.normalized_url,
        hostname: activeAnalysis.destination.hostname || undefined,
        risk_level: activeAnalysis.risk_category,
        risk_score: activeAnalysis.risk_score,
        reasons: reasons.length > 0 ? reasons : ['High-Risk Deceptive QR Destination'],
        reporter_client_id: communitySocket.getDeviceId(),
        notes: `Flagged destination: ${activeAnalysis.destination.hostname || 'Unspecified Host'}`
      });
      setCommunityAlerts((prev) => [broadcasted, ...prev.filter((a) => a.report_id !== broadcasted.report_id)]);
      showToast('Threat broadcasted to all connected laptops!', 'success');
    } catch (err: any) {
      showToast(`Broadcast failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#24312A] antialiased">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          stopHighRiskAlarm();
          setAlarmSounding(false);
          setCurrentTab(tab);
        }}
        backendOnline={backendOnline}
        communityConnected={communityConnected}
        communityClientCount={communityClientCount}
        communityAlertCount={communityAlerts.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => {
              stopHighRiskAlarm();
              setAlarmSounding(false);
              setCurrentTab(tab);
            }}
            onSelectScan={handleSelectHistoryScan}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'scan' && (
          <div className="space-y-4">
            <div className="text-center max-w-md mx-auto space-y-1 mb-2">
              <h2 className="text-xl font-bold text-[#1F5135] tracking-tight">Camera QR Scanner</h2>
              <p className="text-xs text-[#647067]">
                Point your camera at any physical QR code or sticker
              </p>
            </div>
            <CameraScanner
              onScanSuccess={(payload) => handlePerformAnalysis(payload, 'camera')}
              onSwitchToUpload={() => setCurrentTab('upload')}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {currentTab === 'upload' && (
          <div className="space-y-4">
            <div className="text-center max-w-md mx-auto space-y-1 mb-2">
              <h2 className="text-xl font-bold text-[#1F5135] tracking-tight">Upload QR Code Image</h2>
              <p className="text-xs text-[#647067]">
                Upload screenshots, photos, or downloaded QR codes
              </p>
            </div>
            <ImageUploader
              onScanSuccess={(payload) => handlePerformAnalysis(payload, 'upload')}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {currentTab === 'manual' && (
          <div className="space-y-4">
            <div className="text-center max-w-md mx-auto space-y-1 mb-2">
              <h2 className="text-xl font-bold text-[#1F5135] tracking-tight">Inspect URL or Payload</h2>
              <p className="text-xs text-[#647067]">
                Direct heuristic structural analysis with optional Expected Domain guard
              </p>
            </div>
            <ManualInput
              onAnalyze={(payload, refDomain) => handlePerformAnalysis(payload, 'manual', refDomain)}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {(currentTab as any) === 'results' && activeAnalysis && (
          <AnalysisResultView
            result={activeAnalysis}
            onScanAnother={() => setCurrentTab('scan')}
            onOpenReportModal={handleOpenReportModal}
            onShowToast={showToast}
            onReportToCommunity={handleReportToCommunity}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            onSelectScan={handleSelectHistoryScan}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            onShowToast={showToast}
            initialReportData={reportInitialData}
            onClearInitialReportData={() => setReportInitialData(null)}
            communityAlerts={communityAlerts}
          />
        )}

        {currentTab === 'demo' && (
          <DemoModeView
            onRunDemo={(payload, refDomain) => handlePerformAnalysis(payload, 'manual', refDomain)}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            onShowToast={showToast}
            historyEnabled={historyEnabled}
            onToggleHistory={handleToggleHistory}
            confirmStrictness={confirmStrictness}
            onSetConfirmStrictness={handleSetConfirmStrictness}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Red High-Risk Warning Popup Modal */}
      {activeAnalysis && (
        <HighRiskModal
          isOpen={highRiskModalOpen}
          onClose={handleDismissHighRiskModal}
          destinationUrl={activeAnalysis.destination.normalized_url}
          hostname={activeAnalysis.destination.hostname || ''}
          riskScore={activeAnalysis.risk_score}
          triggeredSignals={activeAnalysis.triggered_signals}
          onViewDetails={handleDismissHighRiskModal}
          onConfirmContinueAnyway={() => {
            const url = activeAnalysis.destination.normalized_url;
            if (url.startsWith('http://') || url.startsWith('https://')) {
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          }}
          alarmActive={alarmSounding}
          onStopAlarm={() => {
            stopHighRiskAlarm();
            setAlarmSounding(false);
          }}
          onReportToCommunity={handleReportToCommunity}
        />
      )}

      {/* Real-time Network Broadcast Threat Alert Modal across 4 Laptops */}
      <CommunityAlertModal
        alert={activeCommunityAlert}
        onClose={() => {
          stopHighRiskAlarm();
          setAlarmSounding(false);
          setActiveCommunityAlert(null);
        }}
        onViewReports={() => {
          stopHighRiskAlarm();
          setAlarmSounding(false);
          setActiveCommunityAlert(null);
          setCurrentTab('reports');
        }}
        alarmActive={alarmSounding}
        onStopAlarm={() => {
          stopHighRiskAlarm();
          setAlarmSounding(false);
        }}
      />

      {/* Toast Feedback Alerts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
