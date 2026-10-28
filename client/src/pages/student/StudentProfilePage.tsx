import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { GraduationCap, Mail, ShieldCheck, Calendar, BookOpen, Layers } from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const profile = user?.studentProfile;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
          Student Academic Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Institutional identity and enrolled degree credentials.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-900 text-white flex items-center justify-center font-heading font-black text-2xl shadow-lg shadow-brand-950/20">
            {user?.fullName?.charAt(0) || 'S'}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="font-heading text-xl font-bold text-slate-900">{user?.fullName}</h2>
            <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-900 border border-brand-200">
                Roll No: {profile?.rollNumber}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Active Student
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase">Department</p>
            <p className="font-semibold text-sm text-slate-800 mt-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-800" />
              <span>Computer Science and Engineering</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase">Degree & Specialization</p>
            <p className="font-semibold text-sm text-slate-800 mt-1 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-brand-800" />
              <span>B.Tech in CSE (Artificial Intelligence & ML)</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase">Academic Year & Semester</p>
            <p className="font-semibold text-sm text-slate-800 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-800" />
              <span>AY 2026-27 • Semester 6</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase">Biometric Face Enrollment</p>
            <p className="font-semibold text-sm text-slate-800 mt-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{profile?.faceEnrolled ? 'Enrolled (128-D Vector)' : 'Not Enrolled'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
