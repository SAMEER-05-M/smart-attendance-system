import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { AttendanceRecord } from '../../types/index.js';
import { QrCode, ScanFace, Users, Filter, Clock } from 'lucide-react';

export const AttendanceHistoryPage: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const res: any = await api.getStudentAttendance();
      if (res.success) setRecords(res.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = records.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
            Attendance Record History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete verifiable log of every class attendance timestamp and authentication method.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No records match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Session Code & Title</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {r.attendanceSession?.subject?.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        {r.attendanceSession?.subject?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-mono text-slate-400 block">{r.attendanceSession?.code}</span>
                      <span className="font-medium text-slate-800">{r.attendanceSession?.title}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {r.attendanceSession?.facultyProfile?.user?.fullName || 'Faculty'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(r.markedAt).toLocaleDateString()} at{' '}
                      {new Date(r.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {r.verificationMethod === 'QR_SCAN' && <QrCode className="w-3 h-3 text-brand-900" />}
                        {r.verificationMethod === 'FACE_VERIFIED' && <ScanFace className="w-3 h-3 text-indigo-600" />}
                        {r.verificationMethod === 'MANUAL_FACULTY' && <Users className="w-3 h-3 text-slate-600" />}
                        <span>{r.verificationMethod.replace(/_/g, ' ')}</span>
                      </span>
                      {r.correctedAt && (
                        <span className="block text-[10px] text-amber-700 font-semibold mt-0.5">
                          ✓ Corrected by Faculty
                        </span>
                      )}
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
