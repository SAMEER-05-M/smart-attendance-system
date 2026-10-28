import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { NotificationItem } from '../../types/index.js';
import {
  Bell,
  LogOut,
  User,
  Shield,
  Menu,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Polling every 20s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res: any = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      // silently ignore background polling errors
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-brand-900 text-white border-brand-800';
      case 'FACULTY':
        return 'bg-slate-900 text-amber-300 border-slate-700';
      case 'STUDENT':
        return 'bg-zinc-800 text-emerald-400 border-zinc-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Left Side: Toggle button & breadcrumb / page context */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-800"
            title="Toggle Sidebar Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <span className="text-xs font-semibold tracking-wider text-brand-900 uppercase">
              Academic Portal
            </span>
            <div className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <span>B.Tech CSE (AI/ML)</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                AY 2026-27 Active
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Notifications, Profile, Role */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-800"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-semibold text-slate-800 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-brand-50 text-brand-900 font-semibold px-2 py-0.5 rounded-full border border-brand-200">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-brand-800 hover:text-brand-950 font-medium hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                          !n.isRead ? 'bg-brand-50/30' : ''
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {n.type === 'SUCCESS' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                          {n.type === 'ALERT' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                          {n.type === 'WARNING' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                          {n.type === 'INFO' && <Info className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium text-slate-900 ${!n.isRead ? 'font-semibold' : ''}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Info */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-800"
            >
              <div className="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center font-heading font-semibold text-xs border border-brand-800 shadow-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold text-slate-900 truncate max-w-[140px]">
                  {user?.fullName}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(user?.role || '')}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(user?.role || '')}`}>
                      Role: {user?.role}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-4 py-2 text-xs text-slate-500">
                    {user?.role === 'STUDENT' && (
                      <p>Roll No: <span className="font-semibold text-slate-700">{user?.studentProfile?.rollNumber}</span></p>
                    )}
                    {user?.role === 'FACULTY' && (
                      <p>Faculty ID: <span className="font-semibold text-slate-700">{user?.facultyProfile?.employeeId}</span></p>
                    )}
                    {user?.role === 'ADMIN' && (
                      <p className="flex items-center gap-1 text-brand-900 font-semibold"><Shield className="w-3.5 h-3.5" /> Full System Admin</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
