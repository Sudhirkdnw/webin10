'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { CreditCard, Check, Plus } from 'lucide-react';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiRequest('/super-admin/plans?includeInactive=true');
      if (res.success) setPlans(res.data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Plans & Entitlements</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure SaaS tiers, monthly pricing (in INR), customer limits, staff limits and branch entitlements
          </p>
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
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {p.slug}
                    </span>
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
      </div>
    </AdminShell>
  );
}
