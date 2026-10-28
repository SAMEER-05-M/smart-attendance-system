import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../../services/api.js';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  AlertTriangle,
  TrendingUp,
  History,
  Shield,
  FileCheck2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res: any = await api.getAdminStats();
      if (res.success) setStats(res.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-brand-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-charcoal-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-900/80 border border-brand-700/40 text-brand-200 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Academic Administrator Portal</span>
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional Attendance Overview
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Real-time biometric and QR attendance metrics, threshold monitoring, and college audit analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/reports"
            className="px-4 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-md transition-all border border-brand-700/50"
          >
            Generate College Reports
          </Link>
          <Link
            to="/admin/corrections"
            className="px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-white font-semibold text-xs transition-all border border-charcoal-600/50"
          >
            Review Correction Requests
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase">Students</p>
            <GraduationCap className="w-4 h-4 text-brand-900" />
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 mt-2">
            {stats?.totalStudents || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Enrolled & Active</p>
        </div>

        {/* Total Faculty */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase">Faculty</p>
            <Users className="w-4 h-4 text-brand-900" />
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 mt-2">
            {stats?.totalFaculty || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Professors & Instructors</p>
        </div>

        {/* Total Subjects */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase">Subjects</p>
            <BookOpen className="w-4 h-4 text-brand-900" />
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 mt-2">
            {stats?.totalSubjects || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Active Curriculum</p>
        </div>

        {/* Classes Conducted */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase">Sessions</p>
            <CalendarCheck className="w-4 h-4 text-brand-900" />
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 mt-2">
            {stats?.totalSessions || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Conducted to Date</p>
        </div>

        {/* Today's Attendance % */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase">Today's Avg</p>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-heading text-2xl font-black text-emerald-700 mt-2">
            {stats?.todayPercentage || 92.4}%
          </p>
          <p className="text-[10px] text-slate-400 mt-1">College-wide rate</p>
        </div>

        {/* Shortage Count */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase">Shortage Alert</p>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="font-heading text-2xl font-black text-rose-600 mt-2">
            {stats?.studentsBelowThreshold || 0}
          </p>
          <p className="text-[10px] text-rose-700/80 mt-1 font-semibold">&lt; {stats?.threshold || 75}% threshold</p>
        </div>
      </div>

      {/* Analytics Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Trend (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">
                Weekly Attendance Trend
              </h2>
              <p className="text-xs text-slate-500">Student presence rates over the last 7 days</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Database Aggregation
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.weeklyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#be123c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#be123c" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="attendanceRate" name="Attendance %" stroke="#be123c" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-Wise Performance Bar Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">
                Subject Attendance Rates
              </h2>
              <p className="text-xs text-slate-500">Comparison across departmental courses</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.subjectStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="rate" name="Attendance %" fill="#881337" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent System Activity / Audit Feed */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-brand-900" />
              <span>Real-Time Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-500">Recent security, attendance, and login events</p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-brand-900 hover:text-brand-950 underline"
          >
            Full Audit Log
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentActivity?.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {log.user?.fullName || 'System Event'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono text-[10px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium">
                    {log.entity} {log.entityId ? `(#${log.entityId.slice(0, 8)})` : ''}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-mono">
                    {log.ipAddress || '127.0.0.1'}
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
