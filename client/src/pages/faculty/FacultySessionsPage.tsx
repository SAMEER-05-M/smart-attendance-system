import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { AttendanceSession } from '../../types/index.js';
import { CalendarCheck, Eye, Plus, Clock } from 'lucide-react';

export const FacultySessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res: any = await api.getFacultySessions();
      if (res.success) setSessions(res.sessions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
            Attendance Session History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse all past and active lecture sessions with student submission statistics.
          </p>
        </div>

        <Link
          to="/faculty/start-session"
          className="px-4 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No attendance sessions created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Subject & Section</th>
                  <th className="py-3 px-4">Lecture Title</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-brand-900">
                      {s.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{s.subject?.name}</span>
                      <span className="text-xs text-slate-500">
                        {s.subject?.code} • {s.classSection?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 max-w-[200px] truncate">
                      {s.title}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(s.sessionDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/faculty/session/${s.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-900 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Board</span>
                      </Link>
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
