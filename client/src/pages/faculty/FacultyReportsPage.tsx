import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck2,
} from 'lucide-react';

export const FacultyReportsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    loadReport();
  }, [selectedSubjectId]);

  const loadSubjects = async () => {
    try {
      const res: any = await api.getFacultySubjects();
      if (res.success && res.assignments.length > 0) {
        setSubjects(res.assignments);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.getAttendanceReport({
        subjectId: selectedSubjectId || undefined,
      });

      if (res.success) {
        setRecords(res.records || []);
        setSummary(res.summary || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    api.downloadAttendanceCsv(selectedSubjectId || undefined);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
            Attendance Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Query real-time attendance logs across your assigned classes and download verified CSV files.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="">All Assigned Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.subject.id}>
                {s.subject.name} ({s.classSection.name})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metrics Bar */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Entries</p>
            <p className="font-heading text-2xl font-bold text-slate-900 mt-1">{summary.totalRecords}</p>
          </div>
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/70 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold text-emerald-700">Present</p>
            <p className="font-heading text-2xl font-bold text-emerald-700 mt-1">{summary.present}</p>
          </div>
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/70 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold text-amber-700">Late</p>
            <p className="font-heading text-2xl font-bold text-amber-700 mt-1">{summary.late}</p>
          </div>
          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/70 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold text-blue-700">Excused</p>
            <p className="font-heading text-2xl font-bold text-blue-700 mt-1">{summary.excused}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Effective Rate</p>
            <p className="font-heading text-2xl font-bold text-brand-900 mt-1">
              {summary.effectivePresentRate}%
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No attendance records logged for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Subject & Section</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
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
                      <span className="font-medium text-slate-800 block">
                        {r.attendanceSession?.subject?.name}
                      </span>
                      <span className="text-slate-400">
                        {r.attendanceSession?.classSection?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(r.markedAt).toLocaleDateString()} at{' '}
                      {new Date(r.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {r.verificationMethod.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
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
