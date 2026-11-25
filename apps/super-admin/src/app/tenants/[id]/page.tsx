'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Calendar,
  Users,
  GitBranch,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Flag,
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export default function TenantDetailPage() {
  const routeParams = useParams();
  const router = useRouter();
  const tenantId = (routeParams?.id as string) || '';

  const [tenant, setTenant] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'branches' | 'staff' | 'features'>('profile');

  // Modals
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState('growth');
  const [durationDays, setDurationDays] = useState(30);
  const [savingPlan, setSavingPlan] = useState(false);

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [savingSuspend, setSavingSuspend] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [tRes, qRes, fRes, pRes] = await Promise.all([
      apiRequest(`/super-admin/tenants/${tenantId}`),
      apiRequest(`/super-admin/subscriptions/quota/${tenantId}`),
      apiRequest(`/super-admin/features/tenant/${tenantId}`),
      apiRequest('/super-admin/plans'),
    ]);

    if (tRes.success) setTenant(tRes.data);
    if (qRes.success) setQuota(qRes.data);
    if (fRes.success) setFeatures(fRes.data || []);
    if (pRes.success) setPlans(pRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlan(true);
    const res = await apiRequest('/super-admin/subscriptions/assign', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        planSlug: selectedPlanSlug,
        durationDays: Number(durationDays),
        status: 'ACTIVE',
      }),
    });

    if (res.success) {
      setPlanModalOpen(false);
      loadData();
    } else {
      alert(res.error || 'Failed to assign plan');
    }
    setSavingPlan(false);
  };

  const handleToggleSuspend = async () => {
    const isSuspending = tenant?.status === 'ACTIVE';
    const endpoint = `/super-admin/tenants/${tenantId}/${isSuspending ? 'suspend' : 'activate'}`;
    const body = isSuspending ? JSON.stringify({ reason: suspendReason || 'Manual administrative action' }) : undefined;

    setSavingSuspend(true);
    const res = await apiRequest(endpoint, {
      method: 'POST',
      body,
    });

    if (res.success) {
      setSuspendModalOpen(false);
      setSuspendReason('');
      loadData();
    } else {
      alert(res.error || 'Action failed');
    }
    setSavingSuspend(false);
  };

  const handleFeatureToggle = async (flagKey: string, currentVal: boolean) => {
    // Find flagId from features
    const allFlagsRes = await apiRequest('/super-admin/features');
    if (!allFlagsRes.success) return;
    const flagRecord = allFlagsRes.data.find((f: any) => f.key === flagKey);
    if (!flagRecord) return;

    const res = await apiRequest('/super-admin/features/override', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        flagId: flagRecord.id,
        isEnabled: !currentVal,
      }),
    });

    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to toggle override');
    }
  };

  const handleDeleteTenant = async () => {
    if (!tenant) return;
    const confirmName = window.prompt(
      `⚠️ PERMANENT DELETION WARNING\n\nDeleting "${tenant.name}" will permanently erase all its workspaces, branches, staff accounts, customers, WhatsApp campaigns, and logs.\n\nTo confirm, type "${tenant.name}" below:`
    );

    if (confirmName !== tenant.name) {
      if (confirmName !== null) {
        alert('Deletion cancelled: The name entered did not match.');
      }
      return;
    }

    const res = await apiRequest(`/super-admin/tenants/${tenantId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      alert(`Tenant "${tenant.name}" has been permanently deleted.`);
      router.push('/tenants');
    } else {
      alert(res.error || 'Failed to delete tenant');
    }
  };

  const [impersonating, setImpersonating] = useState(false);

  const handleImpersonate = async () => {
    setImpersonating(true);
    try {
      const res = await apiRequest(`/super-admin/support/impersonate/${tenantId}`, {
        method: 'POST',
      });
      if (res.success && res.data.redirectUrl) {
        window.open(res.data.redirectUrl, '_blank');
      } else {
        alert(res.error || 'Failed to start impersonation session');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setImpersonating(false);
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="py-24 text-center text-xs text-slate-400">Loading business workspace details...</div>
      </AdminShell>
    );
  }

  if (!tenant) {
    return (
      <AdminShell>
        <div className="py-24 text-center text-slate-500">
          <p className="font-semibold text-sm">Tenant not found</p>
          <Link href="/tenants" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
            ← Return to businesses
          </Link>
        </div>
      </AdminShell>
    );
  }

  const activeSub = tenant.subscriptions?.[0];

  return (
    <AdminShell>
      <div className="space-y-6 max-w-6xl">
        {/* Back navigation */}
        <Link href="/tenants" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Businesses
        </Link>

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-xl shrink-0">
              {tenant.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{tenant.name}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    tenant.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {tenant.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span className="font-mono text-slate-400">{tenant.slug}</span>
                <span>•</span>
                <span className="text-indigo-600 font-semibold">{tenant.category?.name || 'Vertical'}</span>
                <span>•</span>
                <span>Registered {new Date(tenant.createdAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleImpersonate}
              disabled={impersonating}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              title="Launch Business Admin as this tenant in Ghost/Support Mode"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{impersonating ? 'Launching...' : 'Login As Business'}</span>
            </button>

            <button
              onClick={() => setPlanModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Change / Extend Plan</span>
            </button>

            <button
              onClick={() => setSuspendModalOpen(true)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                tenant.status === 'ACTIVE'
                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {tenant.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
            </button>

            <button
              onClick={handleDeleteTenant}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              title="Permanently Delete Business Tenant"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Business</span>
            </button>
          </div>
        </div>

        {/* Quota KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Active Plan</span>
              <CreditCard className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">{activeSub?.plan?.name || 'No Plan'}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Status: <span className="font-semibold text-emerald-600">{activeSub?.status || 'N/A'}</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Physical Branches</span>
              <GitBranch className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">
              {quota?.usage?.branches?.current || 1} / {quota?.usage?.branches?.limit || 1}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Within Plan Quota</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Staff Accounts</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">
              {quota?.usage?.staff?.current || 1} / {quota?.usage?.staff?.limit || 2}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Within Plan Quota</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Customer Capacity</span>
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">
              Limit: {quota?.usage?.customers?.limit || 100}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Active Customers</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 flex gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Business Profile
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'branches'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Branches ({tenant.branches?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'staff'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Staff & Members ({tenant.members?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'features'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Feature Overrides ({features.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Legal & Contact Profile</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Legal Name</span>
                <span className="font-semibold text-slate-800">{tenant.profile?.legalName || tenant.name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">GSTIN / Tax ID</span>
                <span className="font-semibold text-slate-800">{tenant.profile?.taxId || 'Not provided'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Primary Contact Phone</span>
                <span className="font-semibold text-slate-800">{tenant.profile?.phone || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Primary Email</span>
                <span className="font-semibold text-slate-800">{tenant.profile?.email || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                <span className="text-slate-400 block mb-0.5">Registered Address</span>
                <span className="font-semibold text-slate-800">{tenant.profile?.address || 'Main branch location'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Branch Name</th>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tenant.branches?.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-semibold text-slate-900">{b.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{b.code || 'MAIN'}</td>
                    <td className="px-6 py-4 text-slate-600">{b.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {b.isMain ? (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold text-[10px]">
                          HEADQUARTERS (MAIN)
                        </span>
                      ) : (
                        <span className="text-slate-500">Secondary Branch</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-emerald-600 font-semibold">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Staff Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Mobile</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tenant.members?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-semibold text-slate-900">{m.user?.name}</td>
                    <td className="px-6 py-4 text-slate-600">{m.user?.email || '—'}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono">{m.user?.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[11px]">
                        {m.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 font-mono">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Effective Tenant Feature Overrides</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Override platform default feature flags specifically for this tenant
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {features.map((f) => (
                <div key={f.key} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{f.name}</span>
                    <span className="text-[10px] font-mono text-indigo-600 ml-2">({f.key})</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Source: {f.source}</p>
                  </div>

                  <button
                    onClick={() => handleFeatureToggle(f.key, f.isEnabled)}
                    className={`px-3 py-1 rounded-full font-semibold border transition-colors ${
                      f.isEnabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {f.isEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Plan Modal */}
        {planModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Assign or Extend SaaS Plan</h2>
              <p className="text-xs text-slate-500 mb-4">
                Update subscription tier, duration and limits for {tenant.name}
              </p>

              <form onSubmit={handleAssignPlan} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Subscription Plan</label>
                  <select
                    value={selectedPlanSlug}
                    onChange={(e) => setSelectedPlanSlug(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    {plans.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name} (₹{p.priceMonthly / 100}/mo) — Up to {p.maxCustomers} customers
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Duration (in Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setPlanModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPlan}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {savingPlan ? 'Assigning...' : 'Confirm Plan Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Suspend Confirmation Modal */}
        {suspendModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {tenant.status === 'ACTIVE' ? 'Suspend Tenant Account' : 'Re-activate Tenant Account'}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                {tenant.status === 'ACTIVE'
                  ? 'Suspending prevents all tenant staff and customer logins while strictly preserving all data.'
                  : 'Re-activating immediately restores all logins and automated workflows.'}
              </p>

              {tenant.status === 'ACTIVE' && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mandatory Audit Reason</label>
                  <textarea
                    rows={3}
                    required
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="e.g. Non-payment after repeated reminders or terms violation"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSuspendModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingSuspend}
                  onClick={handleToggleSuspend}
                  className={`px-4 py-2 text-sm text-white rounded-lg ${
                    tenant.status === 'ACTIVE' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {savingSuspend ? 'Processing...' : tenant.status === 'ACTIVE' ? 'Confirm Suspension' : 'Confirm Activation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
