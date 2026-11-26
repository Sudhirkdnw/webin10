'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { CreditCard, Check, Plus, Edit2, Trash2, Calendar, Sparkles, Sliders } from 'lucide-react';

interface CustomQuota {
  name: string;
  value: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewBillingCycle, setViewBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [priceInr, setPriceInr] = useState(499);
  const [priceAnnualInr, setPriceAnnualInr] = useState<number | string>(4990);
  const [maxCustomers, setMaxCustomers] = useState(100);
  const [maxStaff, setMaxStaff] = useState(2);
  const [maxBranches, setMaxBranches] = useState(1);
  const [description, setDescription] = useState('');
  const [customQuotas, setCustomQuotas] = useState<CustomQuota[]>([]);
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
    setPriceAnnualInr(4990);
    setMaxCustomers(100);
    setMaxStaff(2);
    setMaxBranches(1);
    setDescription('');
    setCustomQuotas([
      { name: 'Support', value: '24x7 Dedicated' }
    ]);
    setModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlanId(plan.id);
    setName(plan.name);
    setSlug(plan.slug);
    setPriceInr(plan.priceMonthly / 100);
    setPriceAnnualInr(
      plan.priceAnnual ? plan.priceAnnual / 100 : Math.round((plan.priceMonthly / 100) * 10)
    );
    setMaxCustomers(plan.maxCustomers);
    setMaxStaff(plan.maxStaff);
    setMaxBranches(plan.maxBranches);
    setDescription(plan.description || '');
    setCustomQuotas(
      Array.isArray(plan.customQuotas)
        ? plan.customQuotas
        : typeof plan.customQuotas === 'object' && plan.customQuotas !== null
        ? Object.entries(plan.customQuotas).map(([name, value]) => ({ name, value: String(value) }))
        : []
    );
    setModalOpen(true);
  };

  const handleAddQuota = () => {
    setCustomQuotas([...customQuotas, { name: '', value: '' }]);
  };

  const handleRemoveQuota = (index: number) => {
    setCustomQuotas(customQuotas.filter((_, i) => i !== index));
  };

  const handleQuotaChange = (index: number, field: 'name' | 'value', val: string) => {
    const updated = [...customQuotas];
    updated[index][field] = val;
    setCustomQuotas(updated);
  };

  const handleMonthlyPriceChange = (val: number) => {
    setPriceInr(val);
    // If annual price is empty or equal to previous 10x, auto suggest 10x (2 months free)
    if (!editingPlanId) {
      setPriceAnnualInr(Math.round(val * 10));
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const priceMonthly = Math.round(Number(priceInr) * 100); // INR to paise
    const priceAnnual = priceAnnualInr !== '' ? Math.round(Number(priceAnnualInr) * 100) : undefined;

    // Filter valid custom quotas
    const cleanQuotas = customQuotas
      .filter((q) => q.name.trim() !== '')
      .map((q) => ({ name: q.name.trim(), value: q.value.trim() }));

    const payload = {
      name,
      priceMonthly,
      priceAnnual,
      maxCustomers: Number(maxCustomers),
      maxStaff: Number(maxStaff),
      maxBranches: Number(maxBranches),
      description,
      customQuotas: cleanQuotas,
    };

    let res;
    if (editingPlanId) {
      res = await apiRequest(`/super-admin/plans/${editingPlanId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      res = await apiRequest('/super-admin/plans', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          slug: slug || undefined,
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
              Configure SaaS tiers with Monthly & Annual pricing, standard quotas, and dynamic custom features (e.g. 24x7 Support, WhatsApp credits).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Billing Cycle Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setViewBillingCycle('MONTHLY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewBillingCycle === 'MONTHLY'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Rates
              </button>
              <button
                type="button"
                onClick={() => setViewBillingCycle('ANNUAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewBillingCycle === 'ANNUAL'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Rates</span>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.2 rounded font-bold">Save 17%</span>
              </button>
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Plan</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-slate-400 text-xs">Loading plans...</div>
          ) : (
            plans.map((p) => {
              const monthlyInr = p.priceMonthly / 100;
              const annualInr = p.priceAnnual ? p.priceAnnual / 100 : Math.round(monthlyInr * 10);
              const isAnnualView = viewBillingCycle === 'ANNUAL';
              const displayPrice = isAnnualView ? annualInr : monthlyInr;

              const customQuotasList = Array.isArray(p.customQuotas)
                ? p.customQuotas
                : typeof p.customQuotas === 'object' && p.customQuotas !== null
                ? Object.entries(p.customQuotas).map(([name, value]) => ({ name, value: String(value) }))
                : [];

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all"
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
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 min-h-[32px]">{p.description || 'Configurable SaaS tier'}</p>

                    {/* Price Display */}
                    <div className="mb-5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-900">
                          ₹{displayPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {isAnnualView ? ' / year' : ' / month'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        {isAnnualView ? (
                          <span>Equiv. ₹{Math.round(annualInr / 12).toLocaleString('en-IN')} / mo (2 mos free)</span>
                        ) : (
                          <span>Annual rate: ₹{annualInr.toLocaleString('en-IN')} / yr</span>
                        )}
                        <span className="text-emerald-600 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {isAnnualView ? 'Billed Yearly' : 'Billed Monthly'}
                        </span>
                      </div>
                    </div>

                    {/* Entitlements / Quotas */}
                    <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
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

                      {/* Dynamic Custom Quotas */}
                      {customQuotasList.map((cq: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>
                            <strong className="text-slate-800">{cq.name}:</strong>{' '}
                            <span className="text-indigo-600 font-medium">{cq.value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>{p._count?.subscriptions || 0} Businesses enrolled</span>
                    <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Active Plan
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create / Edit Modal with Monthly/Yearly and Dynamic Custom Quotas */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingPlanId ? 'Edit Subscription Plan' : 'Create Custom SaaS Plan'}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                  {editingPlanId ? 'Update Tier' : 'New Tier'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Define pricing cycles, standard resource limits, and arbitrary dynamic custom quotas/features.
              </p>

              <form onSubmit={handleSavePlan} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Plan Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Enterprise Tier"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Slug (Key) *</label>
                    <input
                      type="text"
                      disabled={!!editingPlanId}
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. enterprise"
                      className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        editingPlanId ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Monthly Price (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={priceInr}
                      onChange={(e) => handleMonthlyPriceChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-700">
                        Yearly Price (₹ INR)
                      </label>
                      <button
                        type="button"
                        onClick={() => setPriceAnnualInr(Math.round(priceInr * 10))}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold"
                        title="Auto-calculate with 2 months free discount"
                      >
                        Auto (10 mo.)
                      </button>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={priceAnnualInr}
                      onChange={(e) => setPriceAnnualInr(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={`e.g. ${priceInr * 10}`}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Customer Limit *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={maxCustomers}
                      onChange={(e) => setMaxCustomers(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Staff Accounts Limit *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={maxStaff}
                      onChange={(e) => setMaxStaff(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Branch Locations Limit *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={maxBranches}
                      onChange={(e) => setMaxBranches(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Dynamic Custom Quotas / Features Section */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Dynamic Custom Quotas & Limits
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Add any custom fields (e.g. Support: 24x7 SLA, WhatsApp: 5000/mo, Storage: 50GB)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuota}
                      className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 font-semibold px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Field</span>
                    </button>
                  </div>

                  {customQuotas.length === 0 ? (
                    <div className="text-center py-3 bg-white rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                      No custom fields added yet. Click &quot;+ Add Field&quot; to add Support, Storage, or WhatsApp limits.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {customQuotas.map((quota, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Field Name (e.g. Support SLA)"
                            value={quota.name}
                            onChange={(e) => handleQuotaChange(idx, 'name', e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. 24x7 Dedicated)"
                            value={quota.value}
                            onChange={(e) => handleQuotaChange(idx, 'value', e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveQuota(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove field"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Quick add:</span>
                    <button
                      type="button"
                      onClick={() => setCustomQuotas([...customQuotas, { name: 'Support', value: '24x7 Dedicated Call & Chat' }])}
                      className="text-[10px] bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-2 py-0.5 rounded-full border border-slate-200 transition-colors"
                    >
                      + 24x7 Support
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomQuotas([...customQuotas, { name: 'WhatsApp Marketing', value: '5,000 / month' }])}
                      className="text-[10px] bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-2 py-0.5 rounded-full border border-slate-200 transition-colors"
                    >
                      + WhatsApp Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomQuotas([...customQuotas, { name: 'Cloud Storage', value: '50 GB' }])}
                      className="text-[10px] bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-2 py-0.5 rounded-full border border-slate-200 transition-colors"
                    >
                      + Cloud Storage
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Plan Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of this tier..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors"
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
