import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api.js';
import { AttendanceSession, RosterItem } from '../../types/index.js';
import {
  QrCode,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  StopCircle,
  Edit3,
} from 'lucide-react';

export const LiveSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [manualModalStudent, setManualModalStudent] = useState<RosterItem | null>(null);
  const [modalStatus, setModalStatus] = useState<string>('PRESENT');
  const [modalReason, setModalReason] = useState<string>('Faculty in-class roll call confirmation');

  useEffect(() => {
    if (id) {
      loadSessionDetails();
      const pollInterval = setInterval(loadSessionDetails, 4000); // Poll roster every 4s
      return () => clearInterval(pollInterval);
    }
  }, [id]);

  useEffect(() => {
    if (!session?.qrTokenExpiresAt || session.status !== 'ACTIVE') return;

    const timer = setInterval(() => {
      const remainingMs = new Date(session.qrTokenExpiresAt).getTime() - Date.now();
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
      setTimeLeft(remainingSec);
      if (remainingSec <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const loadSessionDetails = async () => {
    if (!id) return;
    try {
      const res: any = await api.getSessionDetails(id);
      if (res.success) {
        setSession(res.session);
        setRoster(res.roster || []);
        setStats(res.stats || null);

        const remainingMs = new Date(res.session.qrTokenExpiresAt).getTime() - Date.now();
        setTimeLeft(Math.max(0, Math.floor(remainingMs / 1000)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!id || !window.confirm('Are you sure you want to close this attendance session? Unmarked students will be marked ABSENT.')) return;
    try {
      const res: any = await api.closeSession(id);
      if (res.success) {
        loadSessionDetails();
      }
    } catch (e: any) {
      alert(e.message || 'Failed to close session');
    }
  };

  const handleCopyToken = () => {
    if (session?.qrToken) {
      navigator.clipboard.writeText(session.qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleManualMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualModalStudent || !id) return;

    try {
      if (manualModalStudent.attendanceRecordId) {
        // Record exists: update with reason
        await api.correctAttendance(manualModalStudent.attendanceRecordId, {
          status: modalStatus,
          reason: modalReason,
        });
      } else {
        // Mark new
        await api.markAttendanceManual({
          sessionId: id,
          studentProfileId: manualModalStudent.studentProfileId,
          status: modalStatus,
          remarks: modalReason,
        });
      }
      setManualModalStudent(null);
      loadSessionDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance');
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading && !session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isExpired = timeLeft <= 0 || session?.status !== 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-900 border border-brand-200">
              {session?.code}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                session?.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              ● {session?.status}
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
            {session?.subject.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {session?.title} • {session?.classSection.name} ({session?.classSection.academicYear})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSessionDetails}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Live Roster"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {session?.status === 'ACTIVE' && (
            <button
              onClick={handleCloseSession}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <StopCircle className="w-4 h-4" />
              <span>Close Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: QR Code & Live Attendance Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Live Dynamic QR Code & Expiry Timer */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
          <h2 className="font-heading font-bold text-base text-slate-900 mb-1">
            Live Class Attendance QR
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Students must scan this code using their camera
          </p>

          {/* QR Code Container with High Contrast & Safe Padding */}
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md relative group">
            {session?.qrToken && (
              <QRCodeSVG
                value={session.qrToken}
                size={220}
                level="H"
                includeMargin={true}
                className={isExpired ? 'opacity-20 grayscale' : 'transition-transform duration-300'}
              />
            )}

            {isExpired && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <span className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-lg uppercase tracking-wider">
                  Session Closed / Expired
                </span>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  QR Token is no longer accepted by server
                </p>
              </div>
            )}
          </div>

          {/* Countdown Clock Display */}
          <div className="mt-5 w-full max-w-xs">
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isExpired
                  ? 'bg-slate-50 border-slate-200 text-slate-500'
                  : timeLeft < 60
                  ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isExpired ? 'Expired' : 'Time Remaining:'}
                </span>
              </div>
              <span className="font-heading font-black text-xl tracking-tight">
                {isExpired ? '00:00' : formatCountdown(timeLeft)}
              </span>
            </div>
          </div>

          {/* Copy Token Button for Fast Evaluation */}
          <div className="mt-4 w-full max-w-xs">
            <button
              onClick={handleCopyToken}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Token Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Token for Student Test</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 mt-1">
              (Use this if evaluating across multiple tabs on the same computer)
            </p>
          </div>
        </div>

        {/* Right Column (7 Cols): Live Attendance Stats & Student Roster */}
        <div className="lg:col-span-7 space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Enrolled</p>
              <p className="font-heading text-xl font-bold text-slate-900">{stats?.totalEnrolled || 0}</p>
            </div>
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/60 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-emerald-700">Present</p>
              <p className="font-heading text-xl font-bold text-emerald-700">{stats?.present || 0}</p>
            </div>
            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/60 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-amber-700">Late</p>
              <p className="font-heading text-xl font-bold text-amber-700">{stats?.late || 0}</p>
            </div>
            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200/60 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-rose-700">Unmarked/Absent</p>
              <p className="font-heading text-xl font-bold text-rose-700">
                {(stats?.unmarked || 0) + (stats?.absent || 0)}
              </p>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900">Enrolled Student Roster</h3>
                <p className="text-[11px] text-slate-400">Auto-refreshes in real-time as students scan</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {stats?.present + stats?.late} / {stats?.totalEnrolled} Verified
              </span>
            </div>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Verification</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((student) => (
                    <tr key={student.studentProfileId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                        {student.rollNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {student.fullName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {student.verificationMethod ? (
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {student.verificationMethod.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : student.status === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : student.status === 'EXCUSED'
                              ? 'bg-blue-100 text-blue-800'
                              : student.status === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setManualModalStudent(student);
                            setModalStatus(student.status === 'UNMARKED' ? 'PRESENT' : student.status);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-brand-50 hover:text-brand-900 text-slate-700 font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Mark</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Mark / Correction Modal */}
      {manualModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-heading font-bold text-base text-slate-900 mb-1">
              Mark Attendance: {manualModalStudent.fullName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Roll No: {manualModalStudent.rollNumber} • Current Status: {manualModalStudent.status}
            </p>

            <form onSubmit={handleManualMark} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Attendance Status
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-800"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="EXCUSED">EXCUSED</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reason / Remarks (Mandatory for Audit Trail)
                </label>
                <textarea
                  required
                  rows={2}
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="e.g. Verified by faculty in classroom / medical excuse submitted"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualModalStudent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-brand-900 hover:bg-brand-950 text-white rounded-xl shadow"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
