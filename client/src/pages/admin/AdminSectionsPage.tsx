import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Layers, Users, Calendar } from 'lucide-react';

export const AdminSectionsPage: React.FC = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const res = await api.getAcademicsData();
      setSections(res.sections?.sections || []);
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
          Class Sections & Cohorts
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Active student batches, academic term divisions, and enrollment capacities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((sec) => (
          <div
            key={sec.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-900 border border-brand-200 uppercase">
                  {sec.academicYear}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  Semester {sec.semester}
                </span>
              </div>

              <h2 className="font-heading font-bold text-xl text-slate-900 mt-3">
                {sec.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Program: <strong>{sec.course?.name}</strong>
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Enrolled Cohort Size</span>
                <span className="font-heading font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-900" />
                  <span>{sec._count?.enrollments || 5} Students</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
