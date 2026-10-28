import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { History, Shield, Search, RefreshCw } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.getAuditLogs();
      if (res.success) setLogs(res.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
            System Security & Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete cryptographic audit trail of user logins, attendance markings, corrections, and administrative actions.
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
          title="Refresh Audit Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by action, user, entity, or keyword..."
          className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleDateString()} {new Date(l.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      {l.user?.fullName || 'System Automated'}
                      {l.user?.role && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          [{l.user.role}]
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px]">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700">
                      {l.entity}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 max-w-sm truncate">
                      {l.details || '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {l.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
