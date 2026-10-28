import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { StudentAttendanceSummary, AttendanceRecord } from '../../types/index.js';
import {
  QrCode,
  ScanFace,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, recRes]: any = await Promise.all([
        api.getStudentSummary(),
        api.getStudentAttendance(),
      ]);

      if (sumRes.success) setSummary(sumRes.summary);
      if (recRes.success) setRecentRecords(recRes.records.slice(0, 6));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading student attendance data...</p>
        </div>
      </div>
    );
  }

  const overallPct = summary?.overallPercentage || 0;
  const threshold = summary?.threshold || 75;
  const isShortage = overallPct < threshold && (summary?.totalConducted || 0) > 0;
  const isWarning = overallPct >= threshold && overallPct < threshold + 5;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-brand-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-charcoal-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-brand-800/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-900/80 border border-brand-700/40 text-brand-200">
                Roll No: {user?.studentProfile?.rollNumber || '23AIML001'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                Sem {user?.studentProfile?.currentSemester || 6}
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Track your real-time attendance status, scan class QR codes, and verify your biometric records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/student/scan"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-sm shadow-lg shadow-brand-950/40 transition-all border border-brand-700/50 hover:scale-[1.02]"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Class QR</span>
            </Link>
            <Link
              to="/student/face-attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-white font-semibold text-sm transition-all border border-charcoal-600/50 hover:scale-[1.02]"
            >
              <ScanFace className="w-4 h-4 text-brand-400" />
              <span>AI Face Attendance</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Attendance Shortage Alert Banner (If Applicable) */}
      {isShortage && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-xl shadow-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-rose-900">Attendance Shortage Warning</h3>
            <p className="text-xs text-rose-700 mt-0.5">
              Your overall attendance is currently <span className="font-bold">{overallPct}%</span>, which is below the mandatory college threshold of <span className="font-bold">{threshold}%</span>. Please ensure regular attendance to avoid examination debarment.
            </p>
          </div>
          <Link
            to="/student/corrections"
            className="text-xs font-semibold text-rose-800 underline hover:text-rose-950 whitespace-nowrap"
          >
            Request Correction
          </Link>
        </div>
      )}

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Percentage Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Attendance</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading text-3xl font-extrabold text-slate-900">
                {overallPct}%
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isShortage
                    ? 'bg-rose-100 text-rose-800'
                    : isWarning
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isShortage ? 'Shortage' : isWarning ? 'Warning' : 'Good Standing'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Threshold: {threshold}% minimum</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center relative">
            <TrendingUp className={`w-6 h-6 ${isShortage ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
        </div>

        {/* Conducted Classes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Classes Conducted</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-3xl font-extrabold text-slate-900">
              {summary?.totalConducted || 0}
            </span>
            <span className="text-xs text-slate-500">Sessions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Semester 6 lectures</p>
        </div>

        {/* Attended Classes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes Attended</p>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-3xl font-extrabold text-emerald-600">
              {summary?.totalAttended || 0}
            </span>
            <span className="text-xs text-slate-500">
              ({summary?.totalLate || 0} marked late)
            </span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">Full credit awarded</p>
        </div>

        {/* Missed / Absent */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes Missed</p>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-3xl font-extrabold text-rose-600">
              {summary?.totalAbsent || 0}
            </span>
            <span className="text-xs text-slate-500">
              ({summary?.totalExcused || 0} excused)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Unexcused absences</p>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Subject-Wise Attendance</h2>
            <p className="text-xs text-slate-500">Calculated from verified server database session logs</p>
          </div>
          <Link
            to="/student/attendance"
            className="text-xs font-semibold text-brand-900 hover:text-brand-950 flex items-center gap-1"
          >
            <span>View Full Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary?.subjectBreakdown.map((item) => {
            const isSubjShortage = item.percentage < threshold && item.conducted > 0;
            return (
              <div
                key={item.subject.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-900 border border-brand-200 uppercase tracking-wider">
                        {item.subject.code}
                      </span>
                      <h3 className="font-semibold text-sm text-slate-900 mt-1">{item.subject.name}</h3>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isSubjShortage
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isSubjShortage ? 'bg-rose-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                  <span>
                    Attended: <strong className="text-slate-700">{item.attended}</strong> / {item.conducted}
                  </span>
                  <span>
                    Missed: <strong className="text-rose-600">{item.absent}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Attendance Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Recent Attendance Logs</h2>
            <p className="text-xs text-slate-500">Your recent verified class entries</p>
          </div>
          <Link
            to="/student/history"
            className="text-xs font-semibold text-brand-900 hover:text-brand-950 flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No attendance records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Session Title</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {r.attendanceSession?.subject?.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        {r.attendanceSession?.subject?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 max-w-[200px] truncate">
                      {r.attendanceSession?.title}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(r.markedAt).toLocaleDateString()} at{' '}
                      {new Date(r.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {r.verificationMethod === 'QR_SCAN' && <QrCode className="w-3 h-3 text-brand-800" />}
                        {r.verificationMethod === 'FACE_VERIFIED' && <ScanFace className="w-3 h-3 text-indigo-600" />}
                        <span>{r.verificationMethod.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          r.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'EXCUSED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
