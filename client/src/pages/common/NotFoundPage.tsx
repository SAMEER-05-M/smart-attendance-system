import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl border border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">
          Page Not Found (404)
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          The requested URL path does not exist in the Smart Attendance Management System.
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs transition-all shadow"
          >
            <Home className="w-4 h-4" />
            <span>Go to Portal Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
