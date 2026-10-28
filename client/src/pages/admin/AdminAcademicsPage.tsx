import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { BookOpen, Layers, GraduationCap, Building2 } from 'lucide-react';

export const AdminAcademicsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAcademics();
  }, []);

  const loadAcademics = async () => {
    try {
      const res = await api.getAcademicsData();
      setData(res);
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

  const departments = data?.departments?.departments || [];
  const courses = data?.courses?.courses || [];
  const subjects = data?.subjects?.subjects || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
          Academic Structure
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Departments, academic degree programs, and curriculum subject allocations.
        </p>
      </div>

      {/* Departments */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-900" />
          <span>Academic Departments</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((d: any) => (
            <div key={d.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-900 border border-brand-200 uppercase">
                {d.code}
              </span>
              <h3 className="font-heading font-bold text-base text-slate-900 mt-1">{d.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{d.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Degree Programs */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-brand-900" />
          <span>Degree Courses</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c: any) => (
            <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-900 border border-brand-200 uppercase">
                {c.code}
              </span>
              <h3 className="font-heading font-bold text-base text-slate-900 mt-1">{c.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Duration: {c.totalSemesters} Semesters (4 Years) • Dept: {c.department?.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Curriculum Subjects */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-900" />
          <span>Active Subjects & Assigned Faculty</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Subject Code</th>
                <th className="py-3 px-4">Subject Title</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assigned Instructors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-brand-900">
                    {s.code}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {s.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-bold text-slate-700">
                    {s.credits}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    Sem {s.semester}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {s.department?.code}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700">
                    <div className="space-y-0.5">
                      {s.assignments?.map((a: any) => (
                        <span
                          key={a.id}
                          className="inline-block text-[10px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded mr-1"
                        >
                          {a.facultyProfile.user.fullName} ({a.classSection.name})
                        </span>
                      ))}
                    </div>
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
