import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../services/api.js';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const ScanQrPage: React.FC = () => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    record?: any;
  } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setCameraError(null);
    setScanResult(null);

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraError('No camera devices detected. You can enter the QR token manually below.');
        return;
      }

      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleTokenSubmission(decodedText);
          stopScanner();
        },
        () => {
          // Frame scan error ignored
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError('Unable to access camera. Please check browser permissions or use the manual code option.');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current?.clear();
          setIsScanning(false);
        })
        .catch(() => setIsScanning(false));
    }
  };

  const handleTokenSubmission = async (token: string) => {
    if (!token.trim()) return;
    setIsLoading(true);
    setScanResult(null);

    try {
      const res = await api.verifyQrToken(token.trim());
      setScanResult({
        success: true,
        message: res.message || 'Attendance marked successfully!',
        record: res.record,
      });
      setManualToken('');
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || 'Failed to verify QR token.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-900 text-white flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
              Scan Class QR Attendance
            </h1>
            <p className="text-xs text-slate-500">
              Point your camera at the faculty's live session QR code to submit attendance.
            </p>
          </div>
        </div>
      </div>

      {/* Main Scanner Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        {/* Scanner Viewport */}
        <div className="flex flex-col items-center">
          <div
            id="qr-reader-container"
            className="w-full max-w-sm aspect-square bg-slate-900 rounded-2xl overflow-hidden relative border-2 border-slate-300 flex items-center justify-center shadow-inner"
          >
            {!isScanning && (
              <div className="text-center p-6 text-slate-400">
                <Camera className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                <p className="text-sm font-medium text-slate-200">Camera preview inactive</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click the button below to enable camera scanning
                </p>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 max-w-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Scanner Controls */}
          <div className="mt-4 flex gap-3">
            {!isScanning ? (
              <button
                onClick={startScanner}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-sm flex items-center gap-2 shadow-md shadow-brand-950/20 transition-all hover:scale-[1.02]"
              >
                <Camera className="w-4 h-4" />
                <span>Launch Camera Scanner</span>
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-semibold text-sm flex items-center gap-2 transition-all"
              >
                <span>Stop Camera</span>
              </button>
            )}
          </div>
        </div>

        {/* Attendance Result Feedback */}
        {scanResult && (
          <div
            className={`mt-6 p-4 rounded-xl border flex items-start gap-3 animate-in fade-in ${
              scanResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {scanResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="text-sm font-bold">
                {scanResult.success ? 'Attendance Recorded Successfully!' : 'Attendance Submission Failed'}
              </h3>
              <p className="text-xs mt-0.5">{scanResult.message}</p>
              {scanResult.record && (
                <div className="mt-2 text-xs bg-white/70 p-2.5 rounded-lg border border-emerald-200/60 text-slate-800 space-y-1">
                  <p><strong>Subject:</strong> {scanResult.record.subject}</p>
                  <p><strong>Lecture:</strong> {scanResult.record.sessionTitle}</p>
                  <p><strong>Status:</strong> <span className="font-bold text-emerald-700">{scanResult.record.status}</span></p>
                  <p><strong>Marked At:</strong> {new Date(scanResult.record.markedAt).toLocaleTimeString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Code Input Fallback */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Manual Token Entry (Evaluation Fallback)
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            In lab environments or multi-tab browser demonstrations where webcams cannot be shared, paste or type the active session token here:
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTokenSubmission(manualToken);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="e.g. sams_live_token_..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
            <button
              type="submit"
              disabled={isLoading || !manualToken.trim()}
              className="px-5 py-2 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Verify</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
