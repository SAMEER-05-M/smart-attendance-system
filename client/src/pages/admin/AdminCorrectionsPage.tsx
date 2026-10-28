import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { FileCheck2, CheckCircle2, XCircle, Clock, Check, X, RefreshCw } from 'lucide-react';

export const AdminCorrectionsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeModalRequest, setActiveModalRequest] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('Approved after verifying with department head.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadCorrections();
  }, []);

  const loadCorrections = async () => {
    try {
      const res: any = await api.getAllCorrections();
      if (res.success) setRequests(res.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!activeModalRequest) return;
    setIsSubmitting(true);
    try {
      const res: any = await api.reviewCorrection(activeModalRequest.id, {
        status,
        reviewNotes,
      });

      if (res.success) {
        setActiveModalRequest(null);
        loadCorrections();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
          Attendance Grievance & Correction Requests
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review, approve, or reject student attendance modification petitions with authoritative database synchronization.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No correction requests pending.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Subject & Session</th>
                  <th className="py-3 px-4">Requested Status</th>
                  <th className="py-3 px-4">Reason Given</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {r.studentProfile?.user?.fullName}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {r.studentProfile?.rollNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-semibold text-slate-800 block">
                        {r.attendanceSession?.subject?.name}
                      </span>
                      <span className="text-slate-400">
                        {r.attendanceSession?.title}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {r.requestedStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                      <p className="line-clamp-2">{r.reason}</p>
                      {r.reviewNotes && (
                        <p className="mt-1 text-[10px] text-slate-500 font-medium">
                          Note: {r.reviewNotes}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setActiveModalRequest(r);
                            setReviewNotes('Approved after verifying with faculty records.');
                          }}
                          className="px-3 py-1 rounded-lg bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-sm transition-all"
                        >
                          Review & Decide
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {activeModalRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-heading font-bold text-base text-slate-900 mb-1">
              Review Correction: {activeModalRequest.studentProfile?.user?.fullName}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Roll No: {activeModalRequest.studentProfile?.rollNumber} • Requested:{' '}
              <strong className="text-brand-900">{activeModalRequest.requestedStatus}</strong>
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 mb-4">
              <span className="font-semibold block text-slate-500 text-[10px] uppercase">
                Student Reason:
              </span>
              <p className="mt-0.5">{activeModalRequest.reason}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Official Decision Remarks
                </label>
                <textarea
                  required
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-800"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalRequest(null)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleReview('REJECTED')}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow transition-all flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleReview('APPROVED')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow transition-all flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Update DB</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
