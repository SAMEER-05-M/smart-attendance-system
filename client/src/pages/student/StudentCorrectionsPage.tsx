import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { CorrectionRequest, AttendanceRecord } from '../../types/index.js';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';

export const StudentCorrectionsPage: React.FC = () => {
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [requestedStatus, setRequestedStatus] = useState<string>('EXCUSED');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [corrRes, recRes]: any = await Promise.all([
        api.getStudentCorrections(),
        api.getStudentAttendance(),
      ]);

      if (corrRes.success) setRequests(corrRes.requests || []);
      if (recRes.success) {
        setRecords(recRes.records || []);
        if (recRes.records.length > 0) {
          setSelectedSessionId(recRes.records[0].attendanceSession.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || reason.length < 10) {
      setAlert({
        type: 'error',
        message: 'Please select a session and provide a detailed reason (minimum 10 characters).',
      });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const res: any = await api.submitCorrectionRequest({
        attendanceSessionId: selectedSessionId,
        requestedStatus,
        reason,
      });

      if (res.success) {
        setAlert({
          type: 'success',
          message: 'Correction request submitted for administrative review.',
        });
        setReason('');
        loadData();
      }
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to submit correction request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
          Attendance Correction Requests
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit formal grievances for missed or misattributed sessions with mandatory justification for HoD/Faculty review.
        </p>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
            alert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Submission Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-base text-slate-900 mb-4">
          Submit New Correction Request
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Class Session
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
              >
                {records.map((r) => (
                  <option key={r.id} value={r.attendanceSession.id}>
                    {r.attendanceSession.subject.code}: {r.attendanceSession.title} (
                    {new Date(r.markedAt).toLocaleDateString()} - Current: {r.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Requested Resolution Status
              </label>
              <select
                value={requestedStatus}
                onChange={(e) => setRequestedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
              >
                <option value="EXCUSED">EXCUSED (Medical / College Event Duty)</option>
                <option value="PRESENT">PRESENT (QR Scan / Network Glitch)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Detailed Reason & Supporting Circumstances
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attended National Hackathon representing college or submitted medical certificate to department head..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">Minimum 10 characters required.</p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* History of Requests */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-base text-slate-900 mb-4">
          Your Past Requests
        </h2>

        {requests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No correction requests submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-900 border border-brand-200 uppercase">
                      {req.attendanceSession?.subject?.code}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-900">
                      {req.attendanceSession?.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    <strong>Reason:</strong> {req.reason}
                  </p>
                  {req.reviewNotes && (
                    <p className="text-xs text-slate-800 mt-1 font-medium bg-white p-2 rounded-lg border border-slate-200">
                      <strong>Review Note:</strong> {req.reviewNotes}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Submitted: {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
