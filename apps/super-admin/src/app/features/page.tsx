'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { Flag, Plus } from 'lucide-react';

export default function FeaturesPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);

  const fetchFlags = async () => {
    setLoading(true);
    const res = await apiRequest('/super-admin/features');
    if (res.success) setFlags(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flag: any) => {
    const res = await apiRequest(`/super-admin/features/${flag.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isEnabled: !flag.isEnabled }),
    });

    if (res.success) fetchFlags();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/super-admin/features', {
      method: 'POST',
      body: JSON.stringify({ key, name, description, isEnabled }),
    });

    if (res.success) {
      setModalOpen(false);
      setKey('');
      setName('');
      setDescription('');
      fetchFlags();
    } else {
      alert(res.error || 'Failed to create feature flag');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Feature Flags & Tenant Overrides</h1>
            <p className="text-sm text-slate-500 mt-1">
              Toggle platform-wide capabilities (QR Attendance, AI Assistant, Bulk SMS) or override per tenant
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Feature Flag</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Feature Name</th>
                <th className="px-6 py-3.5">Key</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Tenant Overrides</th>
                <th className="px-6 py-3.5 text-right">Global Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs">Loading feature flags...</td>
                </tr>
              ) : flags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs">No feature flags registered yet.</td>
                </tr>
              ) : (
                flags.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-semibold text-slate-900">{f.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-600">{f.key}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{f.description || 'Configurable feature'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{f._count?.overrides || 0} Overrides</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggle(f)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                          f.isEnabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {f.isEnabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Create Feature Flag</h2>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Key (e.g. qr_attendance)</label>
                  <input
                    type="text"
                    required
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Feature Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="flag-enabled"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <label htmlFor="flag-enabled" className="text-xs text-slate-700">Enable globally by default</label>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg">Create Flag</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
