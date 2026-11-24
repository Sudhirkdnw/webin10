'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { CreditCard, Check, Plus, Edit2 } from 'lucide-react';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [priceInr, setPriceInr] = useState(499);
  const [maxCustomers, setMaxCustomers] = useState(100);
  const [maxStaff, setMaxStaff] = useState(2);
  const [maxBranches, setMaxBranches] = useState(1);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    const res = await apiRequest('/super-admin/plans?includeInactive=true');
    if (res.success) setPlans(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlanId(null);
    setName('');
    setSlug('');
    setPriceInr(499);
    setMaxCustomers(100);
    setMaxStaff(2);
    setMaxBranches(1);
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlanId(plan.id);
    setName(plan.name);
    setSlug(plan.slug);
    setPriceInr(plan.priceMonthly / 100);
    setMaxCustomers(plan.maxCustomers);
    setMaxStaff(plan.maxStaff);
    setMaxBranches(plan.maxBranches);
    setDescription(plan.description || '');
    setModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const priceMonthly = Math.round(priceInr * 100); // INR to paise

    let res;
    if (editingPlanId) {
      res = await apiRequest(`/super-admin/plans/${editingPlanId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          priceMonthly,
          maxCustomers: Number(maxCustomers),
          maxStaff: Number(maxStaff),
          maxBranches: Number(maxBranches),
          description,
        }),
      });
    } else {
      res = await apiRequest('/super-admin/plans', {
        method: 'POST',
        body: JSON.stringify({
          name,
          slug: slug || undefined,
          priceMonthly,
          maxCustomers: Number(maxCustomers),
          maxStaff: Number(maxStaff),
          maxBranches: Number(maxBranches),
          description,
        }),
      });
    }

    if (res.success) {
      setModalOpen(false);
      fetchPlans();
    } else {
      alert(res.error || 'Failed to save subscription plan');
    }
    setSaving(false);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Plans & Entitlements</h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure SaaS tiers, monthly pricing (in INR), customer limits, staff limits and branch entitlements
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Plan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-slate-400 text-xs">Loading plans...</div>
          ) : (
            plans.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-lg">{p.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {p.slug}
                      </span>
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Edit Plan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-6">{p.description || 'Configurable SaaS tier'}</p>

                  <div className="mb-6">
                    <span className="text-3xl font-extrabold text-slate-900">₹{p.priceMonthly / 100}</span>
                    <span className="text-xs text-slate-400 font-medium"> / month</span>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Up to <strong>{p.maxCustomers.toLocaleString()}</strong> Active Customers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Up to <strong>{p.maxStaff}</strong> Staff / Employee Accounts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Up to <strong>{p.maxBranches}</strong> Physical Branch Locations</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{p._count?.subscriptions || 0} Businesses enrolled</span>
                  <span className="text-emerald-600 font-semibold">Active Plan</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {editingPlanId ? 'Edit Subscription Plan' : 'Create Custom SaaS Plan'}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Define pricing and resource quotas for this subscription tier
              </p>

              <form onSubmit={handleSavePlan} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Plan Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Enterprise Tier"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {!editingPlanId && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Slug (Key)</label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="e.g. enterprise"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Price (₹ INR)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={priceInr}
                      onChange={(e) => setPriceInr(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Customer Limit</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={maxCustomers}
                      onChange={(e) => setMaxCustomers(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Staff Accounts Limit</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={maxStaff}
                      onChange={(e) => setMaxStaff(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Branch Locations Limit</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={maxBranches}
                      onChange={(e) => setMaxBranches(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Plan Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of this tier..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingPlanId ? 'Update Plan' : 'Create Plan'}
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
