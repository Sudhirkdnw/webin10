'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { Network, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    const res = await apiRequest('/super-admin/integrations');
    if (res.success) setIntegrations(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTest = async (provider: string) => {
    setTesting(provider);
    setTestResult(null);
    const res = await apiRequest(`/super-admin/integrations/${provider}/test`, {
      method: 'POST',
    });

    if (res.success) {
      setTestResult({ provider, ...res.data });
      fetchIntegrations();
    } else {
      alert(res.error || 'Test connection failed');
    }
    setTesting(null);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Integrations & Gateways</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Razorpay, Cashfree, and Meta WhatsApp Cloud API credentials, webhook endpoints & live health checks
          </p>
        </div>

        {testResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
            <div>
              <p className="font-semibold">{testResult.message}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                Health Status: {testResult.healthStatus} • Verified at {new Date(testResult.testedAt).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-emerald-700 hover:text-emerald-900 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
              Loading platform integrations...
            </div>
          ) : (
            integrations.map((item) => (
              <div
                key={item.provider}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.type}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        item.healthStatus === 'HEALTHY'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.healthStatus}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">{item.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mb-4">{item.provider}</p>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Environment:</span>
                      <span className="font-semibold">{item.isTestMode ? 'Sandbox / Test' : 'Production (Live)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className={item.isEnabled ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>
                        {item.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleTest(item.provider)}
                    disabled={testing === item.provider}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing === item.provider ? 'animate-spin' : ''}`} />
                    <span>{testing === item.provider ? 'Verifying...' : 'Test Connection'}</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    {item.lastCheckedAt ? `Checked ${new Date(item.lastCheckedAt).toLocaleDateString()}` : 'Not tested'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}
