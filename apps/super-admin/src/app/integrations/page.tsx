'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { Network, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw, Settings2, Lock } from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Configure Modal
  const [configItem, setConfigItem] = useState<any | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isTestMode, setIsTestMode] = useState(true);
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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

  const openConfigModal = (item: any) => {
    setConfigItem(item);
    setIsEnabled(item.isEnabled);
    setIsTestMode(item.isTestMode);
    setCreds({});
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configItem) return;
    setSaving(true);

    const res = await apiRequest('/super-admin/integrations', {
      method: 'POST',
      body: JSON.stringify({
        provider: configItem.provider,
        isEnabled,
        isTestMode,
        credentials: creds,
      }),
    });

    if (res.success) {
      setConfigItem(null);
      fetchIntegrations();
    } else {
      alert(res.error || 'Failed to save configuration');
    }
    setSaving(false);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Integrations & Gateways</h1>
          <p className="text-sm text-slate-500 mt-1">
            Centrally manage Razorpay, Cashfree, and Meta WhatsApp Cloud API credentials, webhook endpoints & live health checks
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
                      <span className="font-semibold">{item.isTestMode ? 'Sandbox / Test Mode' : 'Production (Live)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gateway Status:</span>
                      <span className={item.isEnabled ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>
                        {item.isEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openConfigModal(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Configure</span>
                    </button>

                    <button
                      onClick={() => handleTest(item.provider)}
                      disabled={testing === item.provider}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testing === item.provider ? 'animate-spin' : ''}`} />
                      <span>{testing === item.provider ? 'Testing...' : 'Test'}</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {item.lastCheckedAt ? `Tested ${new Date(item.lastCheckedAt).toLocaleDateString()}` : 'Not tested'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Configure Modal */}
        {configItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-slate-900">Configure {configItem.name}</h2>
                <Lock className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Credentials are encrypted and safely stored in secret store.
              </p>

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Enable Gateway</p>
                    <p className="text-[11px] text-slate-400">Allow system to use this provider</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Test / Sandbox Mode</p>
                    <p className="text-[11px] text-slate-400">Use test API keys without real charges</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTestMode}
                    onChange={(e) => setIsTestMode(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                </div>

                {/* Dynamic Credential Inputs based on provider */}
                {configItem.provider === 'RAZORPAY' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Key ID</label>
                      <input
                        type="text"
                        required
                        placeholder="rzp_test_..."
                        value={creds.keyId || ''}
                        onChange={(e) => setCreds({ ...creds, keyId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Key Secret</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={creds.keySecret || ''}
                        onChange={(e) => setCreds({ ...creds, keySecret: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}

                {configItem.provider === 'CASHFREE' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">App ID</label>
                      <input
                        type="text"
                        required
                        placeholder="CF_..."
                        value={creds.appId || ''}
                        onChange={(e) => setCreds({ ...creds, appId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Secret Key</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={creds.secretKey || ''}
                        onChange={(e) => setCreds({ ...creds, secretKey: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}

                {configItem.provider === 'META_WHATSAPP' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number ID</label>
                      <input
                        type="text"
                        required
                        placeholder="103948574..."
                        value={creds.phoneNumberId || ''}
                        onChange={(e) => setCreds({ ...creds, phoneNumberId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">System User Access Token</label>
                      <input
                        type="password"
                        required
                        placeholder="EAA..."
                        value={creds.accessToken || ''}
                        onChange={(e) => setCreds({ ...creds, accessToken: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}

                {configItem.provider !== 'RAZORPAY' && configItem.provider !== 'CASHFREE' && configItem.provider !== 'META_WHATSAPP' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">API Key / Token</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={creds.apiKey || ''}
                      onChange={(e) => setCreds({ ...creds, apiKey: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setConfigItem(null)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save & Verify Gateway'}
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
