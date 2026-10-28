import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<{ [key: string]: string }>({
    attendance_threshold_percent: '75',
    qr_default_duration_minutes: '15',
    late_grace_period_mins: '10',
    face_match_threshold: '0.60',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res: any = await api.getSettings();
      if (res.success && res.settings) {
        const map: { [key: string]: string } = {};
        res.settings.forEach((s: any) => {
          map[s.key] = s.value;
        });
        setSettings((prev) => ({ ...prev, ...map }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');

    try {
      await Promise.all([
        api.updateSetting('attendance_threshold_percent', settings.attendance_threshold_percent),
        api.updateSetting('qr_default_duration_minutes', settings.qr_default_duration_minutes),
        api.updateSetting('late_grace_period_mins', settings.late_grace_period_mins),
        api.updateSetting('face_match_threshold', settings.face_match_threshold),
      ]);

      setSuccessMessage('System configuration settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update system settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-800 to-brand-900 text-white flex items-center justify-center shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
              System Configuration Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tune institutional thresholds, QR expiration policies, and AI facial recognition hyperparameters.
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Threshold % */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Minimum Attendance Threshold Percentage (%)
            </label>
            <input
              type="number"
              min={50}
              max={100}
              required
              value={settings.attendance_threshold_percent}
              onChange={(e) =>
                setSettings({ ...settings, attendance_threshold_percent: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Students with overall or subject attendance below this figure will trigger shortage warnings.
            </p>
          </div>

          {/* Late Grace Period */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Late Arrival Grace Period (Minutes)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              required
              value={settings.late_grace_period_mins}
              onChange={(e) =>
                setSettings({ ...settings, late_grace_period_mins: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Students scanning after this window has passed since session start will be marked LATE instead of PRESENT.
            </p>
          </div>

          {/* QR Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Default QR Code Active Duration (Minutes)
            </label>
            <input
              type="number"
              min={1}
              max={180}
              required
              value={settings.qr_default_duration_minutes}
              onChange={(e) =>
                setSettings({ ...settings, qr_default_duration_minutes: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Default validity period configured when faculty starts a lecture session.
            </p>
          </div>

          {/* Face Distance Threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Face Recognition L2 Euclidean Distance Threshold
            </label>
            <input
              type="number"
              step="0.05"
              min={0.2}
              max={1.0}
              required
              value={settings.face_match_threshold}
              onChange={(e) =>
                setSettings({ ...settings, face_match_threshold: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Maximum allowable distance between probe face descriptor and enrolled template (0.60 is standard benchmark).
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-brand-900 hover:bg-brand-950 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save System Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
