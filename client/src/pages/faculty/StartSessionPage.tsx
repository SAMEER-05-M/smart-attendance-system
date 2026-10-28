import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { QrCode, Clock, BookOpen, Layers, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export const StartSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [title, setTitle] = useState<string>('Lecture: Deep Learning & Neural Networks');
  const [topic, setTopic] = useState<string>('Vanishing Gradient, Residual Learning, PyTorch Training');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const res: any = await api.getFacultySubjects();
      if (res.success && res.assignments.length > 0) {
        setAssignments(res.assignments);

        const paramSub = searchParams.get('subjectId');
        const paramSec = searchParams.get('sectionId');

        if (paramSub && paramSec) {
          setSelectedSubjectId(paramSub);
          setSelectedSectionId(paramSec);
        } else {
          setSelectedSubjectId(res.assignments[0].subject.id);
          setSelectedSectionId(res.assignments[0].classSection.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const [subId, secId] = val.split('__');
    setSelectedSubjectId(subId);
    setSelectedSectionId(secId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res: any = await api.createSession({
        subjectId: selectedSubjectId,
        classSectionId: selectedSectionId,
        title,
        lectureTopic: topic,
        durationMinutes: Number(durationMinutes),
      });

      if (res.success && res.session?.id) {
        navigate(`/faculty/session/${res.session.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start attendance session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-800 to-brand-900 text-white flex items-center justify-center shadow-md">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
              Start Live Attendance Session
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate a time-limited dynamic QR code for students to scan in class.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subject & Section Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Subject & Class Section
            </label>
            <select
              value={`${selectedSubjectId}__${selectedSectionId}`}
              onChange={handleAssignmentChange}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-800 bg-white"
            >
              {assignments.map((a) => (
                <option key={a.id} value={`${a.subject.id}__${a.classSection.id}`}>
                  {a.subject.name} ({a.subject.code}) — {a.classSection.name} ({a.academicYear})
                </option>
              ))}
            </select>
          </div>

          {/* Session Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Session / Lecture Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lecture 14: Convolutional Neural Networks"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Lecture Topics Covered (Optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Filters, Stride, Padding, PyTorch Conv2d"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>

          {/* Duration in Minutes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              QR Code Validity Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 30].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    durationMinutes === mins
                      ? 'bg-brand-900 text-white border-brand-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mins} Minutes
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Token automatically expires on server after this countdown.</span>
            </p>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting || !selectedSubjectId}
              className="w-full py-3 px-4 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-bold text-sm shadow-md shadow-brand-950/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Generate QR Code & Open Live Attendance Board</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
