import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  SwitchCamera,
  AlertTriangle,
  Upload,
  Lock,
  Loader2,
  CheckCircle2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { decodeFrame } from '../../services/qrDecoder';
import { isAlarmEnabled, setAlarmEnabled, testAlarmSound } from '../../utils/audioAlarm';

export type ScannerState =
  | 'idle'
  | 'requesting_permission'
  | 'initializing'
  | 'scanning'
  | 'processing'
  | 'success'
  | 'error';

interface CameraScannerProps {
  onScanSuccess: (payload: string, sourceType: 'camera') => void;
  onSwitchToUpload: () => void;
  isProcessing: boolean;
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanSuccess,
  onSwitchToUpload,
  isProcessing: externalProcessing,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isLockedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Explicit state management
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [alarmActive, setAlarmActive] = useState<boolean>(() => isAlarmEnabled());

  // Keep ref updated
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopCameraTracks();
    };
  }, []);

  // Update device list when permissions are available
  const updateDeviceList = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}${d.label.toLowerCase().includes('back') ? ' (Rear)' : ''}`,
        }));
      if (isMountedRef.current) {
        setAvailableDevices(videoInputs);
      }
    } catch (e) {
      console.warn('Could not enumerate video devices:', e);
    }
  }, []);

  // Stop media stream tracks
  const stopCameraTracks = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Stop scanner entirely
  const handleStopScanner = useCallback(() => {
    stopCameraTracks();
    isLockedRef.current = false;
    setScannerState('idle');
    setErrorMessage(null);
  }, [stopCameraTracks]);

  // Frame processing loop
  const runScanLoop = useCallback(() => {
    const loop = async () => {
      if (!isMountedRef.current || scannerState !== 'scanning') return;

      if (isLockedRef.current || externalProcessing) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= video.HAVE_CURRENT_DATA) {
        try {
          const payload = await decodeFrame(video, canvas);
          if (payload && !isLockedRef.current) {
            isLockedRef.current = true;
            setScannerState('processing');
            stopCameraTracks();
            onScanSuccess(payload, 'camera');
            return;
          }
        } catch (err) {
          console.warn('Frame decode error:', err);
        }
      }

      if (isMountedRef.current && scannerState === 'scanning') {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [scannerState, externalProcessing, stopCameraTracks, onScanSuccess]);

  // Start the camera
  const handleStartScanner = useCallback(async () => {
    if (scannerState === 'requesting_permission' || scannerState === 'initializing') {
      return;
    }

    stopCameraTracks();
    setErrorMessage(null);
    isLockedRef.current = false;

    // Check secure context requirement
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setScannerState('error');
      setErrorMessage(
        'Camera access requires a secure context (HTTPS or localhost). Please navigate using HTTPS.'
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerState('error');
      setErrorMessage(
        'Your browser does not support the camera video stream API. Please try a modern browser or use image upload.'
      );
      return;
    }

    setScannerState('requesting_permission');

    try {
      // Build constraints
      let videoConstraints: MediaTrackConstraints = {};

      if (selectedDeviceId) {
        videoConstraints.deviceId = { exact: selectedDeviceId };
      } else {
        // Ideal facingMode for mobile
        videoConstraints.facingMode = { ideal: facingMode };
      }

      // Sensible resolution without hard overconstraining
      videoConstraints.width = { ideal: 1280 };
      videoConstraints.height = { ideal: 720 };

      if (!isMountedRef.current) return;
      setScannerState('initializing');

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch (err: any) {
        // If ideal constraints failed (e.g. OverconstrainedError), fallback to bare video
        console.warn('Detailed constraints failed, falling back to basic video:', err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      setScannerState('scanning');
      updateDeviceList();
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      if (!isMountedRef.current) return;

      setScannerState('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Camera access was denied. Please grant camera permission in your browser or site settings.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera hardware was detected on your device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage(
          'Camera is already in use by another application or tab. Please close other camera apps and retry.'
        );
      } else {
        setErrorMessage(`Camera initialization error: ${err.message || 'Unknown error'}`);
      }
    }
  }, [scannerState, selectedDeviceId, facingMode, stopCameraTracks, updateDeviceList]);

  // Handle camera switch (flip)
  const handleToggleFacingMode = () => {
    setSelectedDeviceId('');
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (scannerState === 'scanning') {
      stopCameraTracks();
      setTimeout(() => {
        handleStartScanner();
      }, 100);
    }
  };

  // Handle specific device selection
  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (scannerState === 'scanning') {
      stopCameraTracks();
      setTimeout(() => {
        handleStartScanner();
      }, 100);
    }
  };

  // Run scanning loop whenever in 'scanning' state
  useEffect(() => {
    if (scannerState === 'scanning') {
      runScanLoop();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scannerState, runScanLoop]);

  const handleToggleAlarm = () => {
    const next = !alarmActive;
    setAlarmActive(next);
    setAlarmEnabled(next);
    if (next) {
      testAlarmSound();
    }
  };

  const isScanningActive = scannerState === 'scanning';
  const isInitializing =
    scannerState === 'requesting_permission' || scannerState === 'initializing';
  const isProcessingNow = scannerState === 'processing' || externalProcessing;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Scanner Card */}
      <div className="rounded-2xl border border-[#DCE9DE] bg-white p-5 sm:p-6 shadow-sm space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#DCE9DE]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF7EC] text-[#2E8B57] flex items-center justify-center">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F5135]">Live Camera Scanner</h3>
              <p className="text-[11px] text-[#647067]">Hardware-accelerated QR decoder</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Alarm Sound Toggle Button */}
            <button
              onClick={handleToggleAlarm}
              className={`p-2 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                alarmActive
                  ? 'bg-[#EAF7EC] text-[#2E8B57] border-[#DCE9DE] hover:bg-[#d8eedb]'
                  : 'bg-white text-[#647067] border-[#DCE9DE] hover:text-[#24312A]'
              }`}
              title={alarmActive ? 'Warning sound active for High-Risk QRs' : 'Warning sound muted'}
            >
              {alarmActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="hidden sm:inline font-medium">Alarm: {alarmActive ? 'ON' : 'OFF'}</span>
            </button>

            {isScanningActive ? (
              <button
                onClick={handleStopScanner}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626]/30 hover:bg-[#fee2e2] transition flex items-center gap-1.5"
              >
                <CameraOff size={14} />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={handleStartScanner}
                disabled={isInitializing}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#2E8B57] hover:bg-[#257347] transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isInitializing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    <span>Start Scanner</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Camera Selector Dropdown (When multiple cameras exist) */}
        {availableDevices.length > 1 && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] text-xs">
            <span className="text-[#647067] font-medium shrink-0 flex items-center gap-1">
              <SwitchCamera size={13} className="text-[#2E8B57]" />
              <span>Camera:</span>
            </span>
            <select
              value={selectedDeviceId}
              onChange={(e) => handleSelectDevice(e.target.value)}
              className="bg-white border border-[#DCE9DE] rounded-lg px-2.5 py-1 text-xs text-[#24312A] font-medium focus:outline-none focus:border-[#2E8B57] w-full max-w-xs truncate"
            >
              <option value="">Default ({facingMode === 'environment' ? 'Rear' : 'Front'})</option>
              {availableDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleToggleFacingMode}
              className="p-1.5 rounded-lg bg-white border border-[#DCE9DE] text-[#647067] hover:text-[#2E8B57] hover:border-[#2E8B57] shrink-0"
              title="Flip between front and rear"
            >
              <SwitchCamera size={14} />
            </button>
          </div>
        )}

        {/* Viewfinder Frame */}
        <div className="relative aspect-[4/3] w-full bg-[#111827] rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isScanningActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Active Reticle Target */}
          {isScanningActive && !isProcessingNow && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-[#2E8B57]/60 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                {/* 4 Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#2E8B57] rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#2E8B57] rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#2E8B57] rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#2E8B57] rounded-br-lg" />

                {/* Animated Green Laser Sweep */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#2E8B57] to-transparent shadow-[0_0_10px_#2E8B57] animate-scan-laser" />

                <div className="absolute -bottom-9 inset-x-0 text-center">
                  <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-black/80 text-white backdrop-blur-sm border border-white/10">
                    Align QR code inside reticle
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Idle State Prompt */}
          {scannerState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#F7FBF7]">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF7EC] text-[#2E8B57] flex items-center justify-center border border-[#DCE9DE] shadow-sm">
                <Camera size={28} />
              </div>
              <div className="space-y-1 max-w-xs">
                <h4 className="text-sm font-bold text-[#1F5135]">Camera Ready</h4>
                <p className="text-xs text-[#647067] leading-relaxed">
                  Click Start Scanner to activate your device camera. Video frames are decoded locally in your browser.
                </p>
              </div>
              <button
                onClick={handleStartScanner}
                className="mt-1 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2E8B57] hover:bg-[#257347] transition shadow-sm active:scale-95 flex items-center gap-2"
              >
                <Camera size={15} />
                <span>Start Scanner</span>
              </button>
            </div>
          )}

          {/* Initializing State */}
          {isInitializing && (
            <div className="absolute inset-0 bg-[#F7FBF7] flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Loader2 size={32} className="text-[#2E8B57] animate-spin" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#1F5135]">Requesting Camera Access...</h4>
                <p className="text-xs text-[#647067]">
                  Please allow camera permission in your browser prompt
                </p>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessingNow && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <div className="w-10 h-10 border-3 border-[#2E8B57] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-white">Inspecting QR Destination...</p>
              <p className="text-xs text-slate-300 font-mono">Running deterministic heuristic checks</p>
            </div>
          )}

          {/* Error / Denial State */}
          {scannerState === 'error' && (
            <div className="absolute inset-0 bg-[#FEF2F2] flex flex-col items-center justify-center p-6 text-center space-y-3 border border-[#DC2626]/20">
              <div className="w-12 h-12 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center">
                <AlertTriangle size={26} />
              </div>
              <div className="max-w-xs space-y-1">
                <h4 className="text-sm font-bold text-[#DC2626]">Camera Unavailable</h4>
                <p className="text-xs text-[#647067] leading-relaxed">{errorMessage}</p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleStartScanner}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2E8B57] hover:bg-[#257347] transition flex items-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>Retry Camera</span>
                </button>
                <button
                  onClick={onSwitchToUpload}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#1F5135] bg-white border border-[#DCE9DE] hover:bg-[#F7FBF7] transition flex items-center gap-1.5"
                >
                  <Upload size={13} />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Safety Info */}
        <div className="p-3 rounded-xl bg-[#F7FBF7] border border-[#DCE9DE] flex items-center justify-between text-xs text-[#647067]">
          <div className="flex items-center gap-1.5">
            <Lock size={13} className="text-[#2E8B57]" />
            <span>Client-side video stream. Zero remote server recording.</span>
          </div>
          <button
            onClick={onSwitchToUpload}
            className="text-[#2E8B57] hover:text-[#1F5135] font-semibold underline underline-offset-2 flex items-center gap-1 shrink-0"
          >
            <Upload size={12} />
            <span>Upload file instead</span>
          </button>
        </div>
      </div>
    </div>
  );
};
