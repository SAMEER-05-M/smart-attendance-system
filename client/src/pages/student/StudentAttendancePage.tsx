import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StudentAttendanceSummary } from '../../types/index.js';
import { BookOpen, AlertTriangle, CheckCircle, Award, TrendingUp } from 'lucide-react';

export const StudentAttendancePage: React.FC = () => {
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const res: any = await api.getStudentSummary();
      if (res.success) setSummary(res.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const threshold = summary?.threshold || 75;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
          Subject-Wise Attendance Breakdown
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete breakdown of your attendance percentage, conducted lectures, and shortages per subject.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {summary?.subjectBreakdown.map((item) => {
          const isShortage = item.percentage < threshold && item.conducted > 0;
          const isWarning = item.percentage >= threshold && item.percentage < threshold + 5;

          return (
            <div
              key={item.subject.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-900 border border-brand-200 uppercase">
                      {item.subject.code} • {item.subject.credits} Credits
                    </span>
                    <h2 className="font-heading text-lg font-bold text-slate-900 mt-2">
                      {item.subject.name}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-lg font-black px-3 py-1 rounded-xl inline-block ${
                        isShortage
                          ? 'bg-rose-100 text-rose-800'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 mt-4 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isShortage ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>

                {/* Detailed stats */}
                <div className="grid grid-cols-4 gap-2 mt-5 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
                    <p className="font-heading text-base font-bold text-slate-800">{item.conducted}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <p className="text-[10px] uppercase font-bold text-emerald-700">Present</p>
                    <p className="font-heading text-base font-bold text-emerald-700">{item.attended}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
                    <p className="text-[10px] uppercase font-bold text-amber-700">Late</p>
                    <p className="font-heading text-base font-bold text-amber-700">{item.late}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
                    <p className="text-[10px] uppercase font-bold text-rose-700">Absent</p>
                    <p className="font-heading text-base font-bold text-rose-700">{item.absent}</p>
                  </div>
                </div>
              </div>

              {/* Status footer message */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                {isShortage ? (
                  <p className="text-rose-600 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Shortage alert: You need to attend upcoming sessions to clear 75%.</span>
                  </p>
                ) : (
                  <p className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>In good academic standing for this subject.</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
