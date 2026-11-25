'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import {
  Boxes,
  CheckCircle2,
  XCircle,
  Search,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Power,
  RefreshCw,
  Edit2,
  Sparkles,
  Link2,
} from 'lucide-react';

export default function ModulesPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State
  const [editModule, setEditModule] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadModules = async () => {
    setLoading(true);
    const res = await apiRequest('/super-admin/modules');
    if (res.success) {
      setModules(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadModules();
  }, []);

  const handleToggleActive = async (m: any) => {
    setTogglingId(m.id);
    setStatusMsg(null);
    const nextStatus = !m.isActive;

    try {
      const res = await apiRequest(`/super-admin/modules/${m.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (res.success) {
        setModules((prev) =>
          prev.map((item) => (item.id === m.id ? { ...item, isActive: nextStatus } : item)),
        );
        setStatusMsg({
          type: 'success',
          text: `Module "${m.name}" is now ${nextStatus ? 'ACTIVE globally' : 'DISABLED platform-wide'}.`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || `Failed to update status for ${m.name}`,
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Error communicating with server',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const openEditModal = (m: any) => {
    setEditModule(m);
    setEditName(m.name);
    setEditDescription(m.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModule) return;
    setSavingEdit(true);

    try {
      const res = await apiRequest(`/super-admin/modules/${editModule.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
        }),
      });

      if (res.success) {
        setModules((prev) =>
          prev.map((item) =>
            item.id === editModule.id
              ? { ...item, name: editName.trim(), description: editDescription.trim() }
              : item,
          ),
        );
        setStatusMsg({
          type: 'success',
          text: `Module details updated for "${editName}".`,
        });
        setEditModule(null);
      } else {
        alert(res.error || 'Failed to save module edits');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const activeCount = modules.filter((m) => m.isActive).length;
  const inactiveCount = modules.filter((m) => !m.isActive).length;

  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.key.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'ACTIVE'
        ? m.isActive
        : !m.isActive;

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                Global Platform Control
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                Master 18-Module Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Functional Modules</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Super Admin master kill-switch: decide which business modules remain active globally or suspended across all tenants.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadModules}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Global Kill-Switch Notice */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-indigo-900 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Super Admin Precedence Rule:</span> Turning OFF a module here immediately deactivates it platform-wide for all business tenants, overriding any individual business settings or category defaults.
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-medium shadow-sm transition-all ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Stats & Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Modules ({modules.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterStatus === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active ({activeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterStatus === 'INACTIVE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Disabled ({inactiveCount})</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by module name or key..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Loading platform modules...</span>
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              No modules matched your search filter.
            </div>
          ) : (
            filteredModules.map((m) => {
              const isToggling = togglingId === m.id;

              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                    m.isActive
                      ? 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      : 'border-red-200/80 bg-red-50/20'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon + Status Toggle Switch */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          m.isActive
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                            : 'bg-red-50 border-red-200 text-red-500'
                        }`}
                      >
                        <Boxes className="w-5 h-5" />
                      </div>

                      {/* Interactive On/Off Switch */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold ${
                            m.isActive ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {m.isActive ? 'Active' : 'Disabled'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={m.isActive}
                          disabled={isToggling}
                          onClick={() => handleToggleActive(m)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
                            m.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                          title={`Click to turn ${m.isActive ? 'OFF' : 'ON'} module "${m.name}" globally`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              m.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Module Title & Key */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{m.name}</h3>
                      <button
                        type="button"
                        onClick={() => openEditModal(m)}
                        className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Module Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] font-mono text-indigo-600 font-semibold mb-2">
                      {m.key}
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {m.description || 'Core platform business module'}
                    </p>

                    {/* Dependencies */}
                    {m.dependencies && m.dependencies.length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                        <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Requires:</span>
                        <span className="font-mono text-indigo-700 font-bold">
                          {m.dependencies.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Stats */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      {m.isActive ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Platform Operational
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                          Suspended Globally
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-slate-600">
                      {m._count?.categoryModules ?? 0} Verticals
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Edit Modal */}
        {editModule && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Edit Module Details</h2>
              <p className="text-xs text-slate-500">
                Update display name and description for key: <code className="font-mono text-indigo-600 font-bold">{editModule.key}</code>
              </p>

              <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Module Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditModule(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50"
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
