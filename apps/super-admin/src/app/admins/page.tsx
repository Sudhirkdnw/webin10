'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { Users2, Plus, ShieldCheck, Lock } from 'lucide-react';

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin (Full Platform Control)' },
  { value: 'PLATFORM_SUPPORT', label: 'Platform Support (Customer assistance)' },
  { value: 'PLATFORM_FINANCE', label: 'Platform Finance (Billing & subscriptions)' },
  { value: 'PLATFORM_OPERATIONS', label: 'Platform Operations (Infra & settings)' },
  { value: 'PLATFORM_ANALYST', label: 'Platform Analyst (Read-only analytics)' },
];

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SUPER_ADMIN');
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    const res = await apiRequest('/super-admin/admins');
    if (res.success) setAdmins(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiRequest('/super-admin/admins', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });

    if (res.success) {
      setModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchAdmins();
    } else {
      alert(res.error || 'Failed to create platform administrator');
    }
    setSaving(false);
  };

  const handleToggleActive = async (admin: any) => {
    const res = await apiRequest(`/super-admin/admins/${admin.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !admin.isActive }),
    });

    if (res.success) {
      fetchAdmins();
    } else {
      alert(res.error || 'Failed to update administrator status');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Team & Admins</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage platform-level identity, roles (Owner, Support, Finance, Ops), and security access
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Platform Admin</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Admin Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Platform Role</th>
                <th className="px-6 py-3.5">MFA Status</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">Loading administrators...</td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">No administrators found.</td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-semibold text-slate-900">{a.name}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600">{a.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {a.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {a.mfaEnabled ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Enforced
                        </span>
                      ) : (
                        <span className="text-slate-400">Optional</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          a.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {a.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {a.role !== 'PLATFORM_OWNER' && (
                        <button
                          onClick={() => handleToggleActive(a)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                            a.isActive
                              ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {a.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Add Platform Administrator</h2>
              <p className="text-xs text-slate-500 mb-4">
                Grants centralized access to manage tenants, pricing, and system policies
              </p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@webin10.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Temporary Password (min 8 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Platform Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
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
                    {saving ? 'Creating...' : 'Create Admin'}
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
