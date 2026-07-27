import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, AlertTriangle, Activity, Eye, ChevronDown, ChevronUp, X } from 'lucide-react';
import api from '../lib/api.ts';

interface ActivityLog {
  id: number;
  userId: number | null;
  userName: string | null;
  userRole: string | null;
  action: string;
  entity: string | null;
  entityId: number | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  path: string | null;
  method: string | null;
  timestamp: string;
}

interface ErrorLog {
  id: number;
  userId: number | null;
  userName: string | null;
  level: string;
  message: string;
  stack: string | null;
  context: any;
  ipAddress: string | null;
  url: string | null;
  timestamp: string;
}

type Tab = 'activity' | 'errors';

export default function SystemLogsPage() {
  const [tab, setTab] = useState<Tab>('activity');
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => { fetchData(); }, [tab, actionFilter, levelFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'activity') {
        const params: Record<string, string> = { limit: '200' };
        if (actionFilter) params.action = actionFilter;
        const qs = new URLSearchParams(params).toString();
        const res = await api.get(`/logs/activity${qs ? `?${qs}` : ''}`);
        setActivities(Array.isArray(res.data) ? res.data : []);
      } else {
        const params: Record<string, string> = { limit: '200' };
        if (levelFilter) params.level = levelFilter;
        const qs = new URLSearchParams(params).toString();
        const res = await api.get(`/logs/errors${qs ? `?${qs}` : ''}`);
        setErrors(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filteredActivities = activities.filter(a =>
    !search || a.userName?.toLowerCase().includes(search.toLowerCase()) || a.action?.toLowerCase().includes(search.toLowerCase()) || a.path?.toLowerCase().includes(search.toLowerCase()) || a.ipAddress?.includes(search)
  );
  const filteredErrors = errors.filter(e =>
    !search || e.message?.toLowerCase().includes(search.toLowerCase()) || e.userName?.toLowerCase().includes(search.toLowerCase()) || e.ipAddress?.includes(search)
  );

  const formatTime = (ts: string) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const actionBadge = (action: string) => {
    const colors: Record<string, string> = {
      page_view: 'bg-blue-50 text-blue-600', read: 'bg-blue-50 text-blue-600',
      create: 'bg-green-50 text-green-700', update: 'bg-amber-50 text-amber-700',
      delete: 'bg-red-50 text-red-700', login: 'bg-purple-50 text-purple-700',
      logout: 'bg-neutral-100 text-neutral-600',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[action] || 'bg-neutral-100 text-neutral-600'}`}>{action}</span>;
  };

  const levelBadge = (level: string) => {
    const colors: Record<string, string> = {
      error: 'bg-red-50 text-red-700', warning: 'bg-amber-50 text-amber-700',
      critical: 'bg-red-100 text-red-800', info: 'bg-blue-50 text-blue-600',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[level] || 'bg-neutral-100 text-neutral-600'}`}>{level}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-neutral-500 mt-1">Monitor activity and errors across the system</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-neutral-200">
        <button onClick={() => setTab('activity')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'activity' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}>
          <Activity className="w-4 h-4 inline mr-1.5" />Activity Logs
        </button>
        <button onClick={() => setTab('errors')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'errors' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}>
          <AlertTriangle className="w-4 h-4 inline mr-1.5" />Error Logs
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder={tab === 'activity' ? 'Search user, action, path, or IP...' : 'Search message, user, or IP...'} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
        </div>
        {tab === 'activity' ? (
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
            <option value="">All Actions</option>
            <option value="page_view">Page View</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="read">Read</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
        ) : (
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
            <option value="">All Levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="info">Info</option>
          </select>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'activity' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50">
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">Time</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">User</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">Action</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">Entity</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">Path</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">IP Address</th>
                  <th className="text-right px-5 py-3 font-semibold text-neutral-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filteredActivities.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-neutral-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No activity logs recorded yet</p>
                  </td></tr>
                ) : filteredActivities.map(a => (
                  <React.Fragment key={a.id}>
                    <tr className="hover:bg-neutral-50/50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                      <td className="px-5 py-3 text-neutral-500 text-xs whitespace-nowrap">{formatTime(a.timestamp)}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium">{a.userName || 'system'}</div>
                        {a.userRole && <div className="text-xs text-neutral-400">{a.userRole}</div>}
                      </td>
                      <td className="px-5 py-3">{actionBadge(a.action)}</td>
                      <td className="px-5 py-3 text-neutral-600">{a.entity || '—'}{a.entityId ? ` #${a.entityId}` : ''}</td>
                      <td className="px-5 py-3">
                        <code className="text-xs text-neutral-500 font-mono">{a.path || '—'}</code>
                        {a.method && <span className="ml-1 text-[10px] text-neutral-400">({a.method})</span>}
                      </td>
                      <td className="px-5 py-3">
                        <code className="text-xs text-neutral-500 font-mono">{a.ipAddress || '—'}</code>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {a.details ? (
                          <button className="text-neutral-400 hover:text-neutral-600">{expandedId === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                        ) : '—'}
                      </td>
                    </tr>
                    {expandedId === a.id && a.details && (
                      <tr key={`detail-${a.id}`}>
                        <td colSpan={7} className="px-5 py-3 bg-neutral-50/50">
                          <div className="max-h-40 overflow-auto">
                            <pre className="text-xs text-neutral-600 font-mono whitespace-pre-wrap">{typeof a.details === 'string' ? a.details : JSON.stringify(a.details, null, 2)}</pre>
                          </div>
                          {a.userAgent && <p className="text-xs text-neutral-400 mt-2 border-t border-neutral-200 pt-2 truncate">{a.userAgent}</p>}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50">
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">Time</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">Level</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">Message</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">User</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">IP</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">URL</th>
                  <th className="text-right px-5 py-3 font-semibold text-neutral-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filteredErrors.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-neutral-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No errors recorded yet</p>
                  </td></tr>
                ) : filteredErrors.map(e => (
                  <React.Fragment key={e.id}>
                    <tr className="hover:bg-neutral-50/50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
                      <td className="px-5 py-3 text-neutral-500 text-xs whitespace-nowrap">{formatTime(e.timestamp)}</td>
                      <td className="px-5 py-3">{levelBadge(e.level)}</td>
                      <td className="px-5 py-3 text-neutral-700 max-w-xs truncate">{e.message}</td>
                      <td className="px-5 py-3 text-neutral-600">{e.userName || '—'}</td>
                      <td className="px-5 py-3"><code className="text-xs text-neutral-500 font-mono">{e.ipAddress || '—'}</code></td>
                      <td className="px-5 py-3"><code className="text-xs text-neutral-500 font-mono">{e.url || '—'}</code></td>
                      <td className="px-5 py-3 text-right">
                        {(e.stack || e.context) ? (
                          <button className="text-neutral-400 hover:text-neutral-600">{expandedId === e.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                        ) : '—'}
                      </td>
                    </tr>
                    {expandedId === e.id && (e.stack || e.context) && (
                      <tr key={`detail-${e.id}`}>
                        <td colSpan={7} className="px-5 py-3 bg-neutral-50/50">
                          {e.stack && (
                            <>
                              <p className="text-xs font-semibold text-neutral-500 mb-1">Stack Trace</p>
                              <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap bg-red-50 p-3 rounded-lg mb-3 max-h-40 overflow-auto">{e.stack}</pre>
                            </>
                          )}
                          {e.context && (
                            <>
                              <p className="text-xs font-semibold text-neutral-500 mb-1">Context</p>
                              <pre className="text-xs text-neutral-600 font-mono whitespace-pre-wrap max-h-40 overflow-auto">{typeof e.context === 'string' ? e.context : JSON.stringify(e.context, null, 2)}</pre>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="text-xs text-neutral-400 text-center">
        Logs are retained in the database. Critical errors are also emailed to the system developer if SMTP is configured.
      </p>
    </div>
  );
}
