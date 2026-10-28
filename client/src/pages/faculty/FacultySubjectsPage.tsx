import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { BookOpen, QrCode, Users, Layers } from 'lucide-react';

export const FacultySubjectsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res: any = await api.getFacultySubjects();
      if (res.success) setAssignments(res.assignments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
          My Assigned Subjects
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Courses and class sections assigned to your faculty profile for Academic Term 2026-27.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-brand-50 text-brand-900 border border-brand-200 uppercase">
                  {a.subject.code} • {a.subject.credits} Credits
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                  {a.classSection.name}
                </span>
              </div>

              <h2 className="font-heading font-bold text-lg text-slate-900 mt-3">
                {a.subject.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Course: <strong>{a.classSection.course?.name || 'B.Tech CSE (AI/ML)'}</strong>
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Academic Year</span>
                  <span className="font-medium text-slate-800">{a.academicYear}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Enrolled Students</span>
                  <span className="font-medium text-slate-800">{a.classSection._count?.enrollments || 5} Students</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
              <Link
                to={`/faculty/start-session?subjectId=${a.subject.id}&sectionId=${a.classSection.id}`}
                className="px-4 py-2 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Start Attendance Session</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
