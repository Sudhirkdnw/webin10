'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { Sliders, History, RotateCcw, Plus, Clock } from 'lucide-react';

export default function ConfigurationsPage() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editReason, setEditReason] = useState('');
  const [saving, setSaving] = useState(false);

  // History / Rollback Modal
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rollingBack, setRollingBack] = useState<number | null>(null);

  const fetchDefinitions = async () => {
    setLoading(true);
    const res = await apiRequest('/super-admin/configurations');
    if (res.success) setDefinitions(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDefinitions();
  }, []);

  const handleSave = async (key: string) => {
    setSaving(true);
    const res = await apiRequest(`/super-admin/configurations/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({
        value: editValue,
        reason: editReason || 'Updated via Super Admin Panel',
      }),
    });

    if (res.success) {
      setSelectedKey(null);
      setEditValue('');
      setEditReason('');
      fetchDefinitions();
    } else {
      alert(res.error || 'Failed to update configuration');
    }
    setSaving(false);
  };

  const openHistoryModal = async (key: string) => {
    setHistoryKey(key);
    setLoadingHistory(true);
    const res = await apiRequest(`/super-admin/configurations/${key}/versions`);
    if (res.success) {
      setVersions(res.data || []);
    }
    setLoadingHistory(false);
  };

  const handleRollback = async (key: string, version: number) => {
    if (!confirm(`Are you sure you want to rollback ${key} to version ${version}?`)) return;

    setRollingBack(version);
    const res = await apiRequest(`/super-admin/configurations/${key}/rollback`, {
      method: 'POST',
      body: JSON.stringify({
        version,
        reason: `Administrative 1-click rollback to version ${version}`,
      }),
    });

    if (res.success) {
      setHistoryKey(null);
      fetchDefinitions();
    } else {
      alert(res.error || 'Rollback failed');
    }
    setRollingBack(null);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dynamic Configuration Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Centrally manage platform defaults, branding, timezones, and system policies with version history and rollback
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Setting Name / Key</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Effective Value</th>
                <th className="px-6 py-3.5">Version</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs">Loading configurations...</td>
                </tr>
              ) : definitions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No dynamic configurations registered yet.
                  </td>
                </tr>
              ) : (
                definitions.map((def) => {
                  const currentVal = def.values?.[0]?.value ?? def.defaultValue;
                  const version = def.values?.[0]?.version ?? 1;

                  return (
                    <tr key={def.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{def.name}</div>
                        <div className="text-xs text-indigo-600 font-mono">{def.key}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {def.dataType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700 max-w-xs truncate">
                        {currentVal}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">v{version}</td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => openHistoryModal(def.key)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1"
                          title="View Audit Version History"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedKey(def.key);
                            setEditValue(currentVal);
                          }}
                          className="px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {selectedKey && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Update Configuration</h2>
              <p className="text-xs font-mono text-indigo-600 mb-4">{selectedKey}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">New Value</label>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Audit Reason for Change</label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="e.g. Updated support phone number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    onClick={() => setSelectedKey(null)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(selectedKey)}
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save & Increment Version'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Version History & Rollback Modal */}
        {historyKey && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-slate-900">Audit Version History</h2>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xs font-mono text-indigo-600 mb-4">{historyKey}</p>

              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading version history...</div>
              ) : versions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No previous versions recorded.</div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {versions.map((v) => (
                    <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                          v{v.version}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(v.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-slate-700 font-mono bg-white p-2 rounded border border-slate-100 mb-2 truncate">
                        {v.value}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 italic max-w-xs truncate">
                          &quot;{v.reason || 'No description'}&quot;
                        </span>

                        <button
                          onClick={() => handleRollback(historyKey, v.version)}
                          disabled={rollingBack === v.version}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{rollingBack === v.version ? 'Rolling back...' : 'Rollback'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHistoryKey(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
