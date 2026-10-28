import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  QrCode,
  ScanFace,
  FileSpreadsheet,
  FileCheck2,
  Settings,
  History,
  ShieldAlert,
  ClipboardList,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCloseMobile }) => {
  const { user } = useAuth();
  const role = user?.role;

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/faculty', label: 'Faculty', icon: Users },
    { to: '/admin/academics', label: 'Courses & Subjects', icon: BookOpen },
    { to: '/admin/sections', label: 'Class Sections', icon: Layers },
    { to: '/admin/reports', label: 'Attendance Reports', icon: FileSpreadsheet },
    { to: '/admin/corrections', label: 'Correction Requests', icon: FileCheck2 },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: History },
    { to: '/admin/settings', label: 'System Settings', icon: Settings },
  ];

  const facultyLinks = [
    { to: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/faculty/subjects', label: 'My Subjects', icon: BookOpen },
    { to: '/faculty/start-session', label: 'Start Attendance (QR)', icon: QrCode },
    { to: '/faculty/sessions', label: 'Session History', icon: CalendarCheck },
    { to: '/faculty/reports', label: 'Attendance Reports', icon: FileSpreadsheet },
    { to: '/faculty/corrections', label: 'Correction Requests', icon: FileCheck2 },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/scan', label: 'Scan QR Attendance', icon: QrCode },
    { to: '/student/face-attendance', label: 'AI Face Attendance', icon: ScanFace },
    { to: '/student/attendance', label: 'Subject Attendance', icon: ClipboardList },
    { to: '/student/history', label: 'Attendance History', icon: History },
    { to: '/student/corrections', label: 'Correction Requests', icon: FileCheck2 },
    { to: '/student/profile', label: 'Student Profile', icon: GraduationCap },
  ];

  const navLinks = role === 'ADMIN' ? adminLinks : role === 'FACULTY' ? facultyLinks : studentLinks;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 bg-charcoal-900 text-slate-200 flex flex-col transition-all duration-300 ease-in-out border-r border-charcoal-800 shadow-xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-charcoal-800 bg-charcoal-950">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center text-white font-heading font-black shadow-lg shadow-brand-950/50 flex-shrink-0 border border-brand-600/40">
            <span className="text-xl tracking-tighter">S</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                SAMS
                <span className="text-[10px] bg-brand-800/80 text-brand-200 px-1.5 py-0.2 rounded font-semibold tracking-wide uppercase border border-brand-600/30">
                  v1.0
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                Smart Attendance System
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2">
          {!collapsed && (
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              {role} Menu
            </p>
          )}
        </div>

        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-900 text-white shadow-md shadow-brand-950/30 border border-brand-700/50'
                    : 'text-slate-400 hover:text-white hover:bg-charcoal-800/80'
                }`
              }
              title={collapsed ? link.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-charcoal-800 bg-charcoal-950/60">
          <div className="p-3 rounded-xl bg-charcoal-800/50 border border-charcoal-700/40 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-slate-400 leading-tight">
              <span className="font-semibold text-slate-200 block mb-0.5">AI/ML Attendance</span>
              Camera QR & Biometrics ready for evaluation.
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
