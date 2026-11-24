'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { ShieldCheck, Plus, Clock, AlertTriangle, Building2, ShieldAlert } from 'lucide-react';

export default function SupportPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [reason, setReason] = useState('');
  const [durationHours, setDurationHours] = useState(2);
  const [saving, setSaving] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const [rRes, tRes] = await Promise.all([
      apiRequest('/super-admin/support/requests'),
      apiRequest('/super-admin/tenants?limit=100'),
    ]);

    if (rRes.success) setRequests(rRes.data || []);
    if (tRes.success && tRes.data.items) {
      setTenants(tRes.data.items);
      if (tRes.data.items.length > 0) setTenantId(tRes.data.items[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiRequest('/super-admin/support/requests', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        reason,
        durationHours: Number(durationHours),
      }),
    });

    if (res.success) {
      setModalOpen(false);
      setReason('');
      fetchRequests();
    } else {
      alert(res.error || 'Failed to request support session');
    }
    setSaving(false);
  };

  const handleRevoke = async (id: string) => {
    const res = await apiRequest(`/super-admin/support/requests/${id}/revoke`, {
      method: 'POST',
    });

    if (res.success) {
      fetchRequests();
    } else {
      alert(res.error || 'Failed to revoke support session');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Privileged Support Access</h1>
            <p className="text-sm text-slate-500 mt-1">
              Time-limited, audited support sessions with tenant justification (Required by Section 7.10)
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Request Support Session</span>
          </button>
        </div>

        {/* Active Sessions Overview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Business Workspace</th>
                <th className="px-6 py-3.5">Authorized Admin</th>
                <th className="px-6 py-3.5">Audit Justification</th>
                <th className="px-6 py-3.5">Valid Until</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    Loading support sessions...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No support access sessions recorded. Access is strictly audited.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isExpired = r.expiresAt && new Date(r.expiresAt) < new Date();
                  const effectiveStatus = isExpired && r.status === 'APPROVED' ? 'EXPIRED' : r.status;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{r.tenant?.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{r.tenant?.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-medium text-slate-800">{r.admin?.name}</div>
                        <div className="text-slate-400">{r.admin?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-sm truncate">
                        {r.reason}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {r.expiresAt ? new Date(r.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            effectiveStatus === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : effectiveStatus === 'REVOKED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {effectiveStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {effectiveStatus === 'APPROVED' && (
                          <button
                            onClick={() => handleRevoke(r.id)}
                            className="px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                          >
                            Revoke Session
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Request Privileged Support Session</h2>
              <p className="text-xs text-slate-500 mb-4">
                Direct access to business workspaces requires a recorded reason and expires automatically
              </p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Business Tenant</label>
                  <select
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Session Duration (Hours)</label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours (Default)</option>
                    <option value={4}>4 Hours</option>
                    <option value={8}>8 Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mandatory Audit Justification</label>
                  <textarea
                    rows={3}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Investigating customer WhatsApp reminder delivery issue for Ticket #1042"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Authorizing...' : 'Authorize Support Session'}
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
