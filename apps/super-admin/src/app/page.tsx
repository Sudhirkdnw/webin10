'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import {
  Building2,
  FolderTree,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiRequest('/super-admin/dashboard');
      if (res.success) {
        setData(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const stats = [
    {
      name: 'Total Businesses',
      value: data?.metrics?.totalTenants ?? 0,
      icon: Building2,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
    },
    {
      name: 'Active Tenants',
      value: data?.metrics?.activeTenants ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    },
    {
      name: 'Suspended Tenants',
      value: data?.metrics?.suspendedTenants ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    },
    {
      name: 'Business Verticals',
      value: data?.metrics?.totalCategories ?? 4,
      icon: FolderTree,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
    },
    {
      name: 'Active SaaS Plans',
      value: data?.metrics?.totalPlans ?? 3,
      icon: CreditCard,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Platform Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-tenant business operating system metrics & system status
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.name}
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${s.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.name}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {loading ? '...' : s.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Businesses */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recently Registered Businesses</h2>
              <Link href="/tenants" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading businesses...</div>
            ) : data?.recentTenants?.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentTenants.map((t: any) => (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t.category?.name || 'Unassigned'} • {t._count?.branches || 1} Branch
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                        t.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No businesses registered yet. Click &apos;Businesses&apos; in sidebar to create your first tenant.
              </div>
            )}
          </div>

          {/* Recent Audit Logs */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Immutable Platform Audit Log
              </h2>
              <Link href="/audit-logs" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
                View full audit <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading audit trail...</div>
            ) : data?.recentAuditLogs?.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentAuditLogs.map((log: any) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        By {log.admin?.name || 'System'} ({log.actorType})
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No audit activity logged yet.</div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
