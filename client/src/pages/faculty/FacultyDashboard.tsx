import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  QrCode,
  Users,
  BookOpen,
  CalendarCheck,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadFacultyData();
  }, []);

  const loadFacultyData = async () => {
    try {
      const [subRes, sessRes]: any = await Promise.all([
        api.getFacultySubjects(),
        api.getFacultySessions(),
      ]);

      if (subRes.success) setAssignments(subRes.assignments || []);
      if (sessRes.success) setSessions(sessRes.sessions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-brand-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-charcoal-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-brand-800/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                {user?.facultyProfile?.designation || 'Associate Professor'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                ID: {user?.facultyProfile?.employeeId || 'FAC-CSE-001'}
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.fullName}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Conduct high-integrity classroom attendance with time-limited cryptographic QR codes and live student rosters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/faculty/start-session"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-sm shadow-lg shadow-brand-950/40 transition-all border border-brand-700/50 hover:scale-[1.02]"
            >
              <QrCode className="w-4 h-4" />
              <span>Start New Attendance (QR)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Session Alert (If Any) */}
      {activeSessions.length > 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                Live Attendance Session Ongoing: {activeSessions[0].subject?.name}
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Code: {activeSessions[0].code} • Section: {activeSessions[0].classSection?.name}
              </p>
            </div>
          </div>
          <Link
            to={`/faculty/session/${activeSessions[0].id}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Open Live Board</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Subjects</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-3xl font-extrabold text-slate-900">
              {assignments.length}
            </span>
            <span className="text-xs text-slate-500">Courses</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">B.Tech CSE (AI/ML)</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sessions Conducted</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-3xl font-extrabold text-slate-900">
              {sessions.length}
            </span>
            <span className="text-xs text-slate-500">Classes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Current Academic Term</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Sessions</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-3xl font-extrabold text-brand-900">
              {activeSessions.length}
            </span>
            <span className="text-xs text-slate-500">Live</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Realtime scanning enabled</p>
        </div>
      </div>

      {/* Assigned Subjects Cards */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">Your Assigned Subjects</h2>
          <Link
            to="/faculty/subjects"
            className="text-xs font-semibold text-brand-900 hover:text-brand-950 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-900 border border-brand-200 uppercase">
                    {a.subject.code} • {a.subject.credits} Credits
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                    {a.classSection.name}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 mt-2">
                  {a.subject.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enrolled Students: <strong className="text-slate-800">{a.classSection._count?.enrollments || 5}</strong>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs text-slate-400">{a.academicYear}</span>
                <Link
                  to={`/faculty/start-session?subjectId=${a.subject.id}&sectionId=${a.classSection.id}`}
                  className="px-3 py-1.5 rounded-lg bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Start Attendance</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">Recent Attendance Sessions</h2>
          <Link
            to="/faculty/sessions"
            className="text-xs font-semibold text-brand-900 hover:text-brand-950 flex items-center gap-1"
          >
            <span>All Sessions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.slice(0, 5).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {s.subject?.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                    {s.classSection?.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700 max-w-[200px] truncate">
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
                      className="text-xs font-semibold text-brand-900 hover:text-brand-950 underline"
                    >
                      View Roster
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
