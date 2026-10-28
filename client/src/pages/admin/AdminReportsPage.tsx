import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Users,
  Search,
  Filter,
} from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'shortage'>('all');
  const [records, setRecords] = useState<any[]>([]);
  const [shortageStudents, setShortageStudents] = useState<any[]>([]);
  const [threshold, setThreshold] = useState<number>(75);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const [allRes, shortRes]: any = await Promise.all([
        api.getAttendanceReport({}),
        api.getShortageReport(),
      ]);

      if (allRes.success) setRecords(allRes.records || []);
      if (shortRes.success) {
        setShortageStudents(shortRes.shortageStudents || []);
        setThreshold(shortRes.threshold || 75);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    api.downloadAttendanceCsv();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
            Institutional Attendance Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            College-wide verified audit data and attendance shortage identification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Master CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'all'
              ? 'border-brand-900 text-brand-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          All Attendance Logs ({records.length})
        </button>
        <button
          onClick={() => setActiveTab('shortage')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'shortage'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Attendance Shortage List ({shortageStudents.length})</span>
        </button>
      </div>

      {/* Tab 1: All Records Table */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No attendance records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student Name & Roll</th>
                    <th className="py-3 px-4">Subject & Section</th>
                    <th className="py-3 px-4">Session Date</th>
                    <th className="py-3 px-4">Faculty In-Charge</th>
                    <th className="py-3 px-4">Verification</th>
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
                        {r.attendanceSession?.facultyProfile?.user?.fullName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
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
      )}

      {/* Tab 2: Shortage List */}
      {activeTab === 'shortage' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between text-xs text-rose-800">
            <span className="font-bold">
              Institutional Shortage Threshold: {threshold}% Mandatory Attendance
            </span>
            <span>These students are liable for academic warning letters or exam debarment</span>
          </div>

          {shortageStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              All students currently meet the minimum {threshold}% attendance threshold!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Attended / Total</th>
                    <th className="py-3 px-4 text-center">Attendance %</th>
                    <th className="py-3 px-4 text-right">Deficit from {threshold}%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shortageStudents.map((st) => (
                    <tr key={st.studentId} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-rose-900">
                        {st.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {st.fullName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {st.department}
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-700">
                        {st.attended} / {st.totalConducted} Sessions
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block text-xs font-extrabold px-3 py-1 rounded-full bg-rose-100 text-rose-800">
                          {st.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-700 text-xs">
                        -{st.deficitPercentage}% deficit
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
