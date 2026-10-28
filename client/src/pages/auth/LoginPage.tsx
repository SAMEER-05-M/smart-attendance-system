import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('admin@college.edu');
  const [password, setPassword] = useState<string>('Admin@123');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const queryParams = new URLSearchParams(location.search);
  const sessionExpired = queryParams.get('expired') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.role === 'ADMIN') navigate('/admin/dashboard');
        else if (res.role === 'FACULTY') navigate('/faculty/dashboard');
        else navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setIsSubmitting(true);

    try {
      const res = await login(demoEmail, demoPass);
      if (res.success) {
        if (res.role === 'ADMIN') navigate('/admin/dashboard');
        else if (res.role === 'FACULTY') navigate('/faculty/dashboard');
        else navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-brand-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-800 to-brand-900 text-white shadow-xl shadow-brand-950/60 mb-4 border border-brand-600/40">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Smart Attendance Management System
        </h1>
        <p className="mt-2 text-sm text-brand-200/80 font-medium tracking-wide">
          Smarter Attendance. Better Learning.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-white/20">
          {sessionExpired && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                College Institutional Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-brand-800 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-brand-800 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-brand-900 hover:bg-brand-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-800 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Academic Portal</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demonstration Quick Access Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-brand-700" />
              <span>Evaluation Fast-Login:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@college.edu', 'Admin@123')}
                className="px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-950 text-slate-700 border border-slate-200 transition-all text-center flex flex-col items-center justify-center"
              >
                <span className="font-bold text-slate-900">Admin</span>
                <span className="text-[10px] text-slate-500">Dr. Sharma</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('faculty.ml@college.edu', 'Faculty@123')}
                className="px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-950 text-slate-700 border border-slate-200 transition-all text-center flex flex-col items-center justify-center"
              >
                <span className="font-bold text-slate-900">Faculty</span>
                <span className="text-[10px] text-slate-500">Prof. Sen (ML)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('aarav.23aiml@college.edu', 'Student@123')}
                className="px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-950 text-slate-700 border border-slate-200 transition-all text-center flex flex-col items-center justify-center"
              >
                <span className="font-bold text-slate-900">Student</span>
                <span className="text-[10px] text-slate-500">Aarav (AIML)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer academic note */}
        <p className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Authorization & Biometric Verification Protected</span>
        </p>
      </div>
    </div>
  );
};
