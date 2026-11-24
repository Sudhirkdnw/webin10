'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { Boxes, CheckCircle2 } from 'lucide-react';

export default function ModulesPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiRequest('/super-admin/modules');
      if (res.success) setModules(res.data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Functional Modules</h1>
          <p className="text-sm text-slate-500 mt-1">
            Registered domain capabilities (CRM, Billing, Attendance, Automation, etc.) managed across business verticals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading ? (
            <div className="col-span-4 py-12 text-center text-slate-400 text-xs">Loading modules...</div>
          ) : (
            modules.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-3">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{m.name}</h3>
                <p className="text-[11px] font-mono text-slate-400 mb-3">{m.key}</p>
                <p className="text-xs text-slate-500">{m.description || 'Core platform business module'}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                  <span>{m._count?.categoryModules || 0} Verticals</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}
