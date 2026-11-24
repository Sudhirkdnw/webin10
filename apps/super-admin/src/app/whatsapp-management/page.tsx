'use client';

import React, { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin-shell';
import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Send,
  Users,
  CreditCard,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Ban,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  Clock,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { getApiBaseUrl, apiRequest } from '@/lib/api';

export default function SuperAdminWhatsAppManagement() {
  const API_BASE = getApiBaseUrl();
  const [activeTab, setActiveTab] = useState<'tenants' | 'automations' | 'broadcast' | 'templates' | 'logs'>('tenants');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalTenants: 0,
    enabledTenants: 0,
    totalMessagesSent: 0,
    deliverySuccessRate: '100%',
    totalCreditsInCirculation: 0,
  });
  const [tenants, setTenants] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Logs State
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Credits Modal State
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [creditAdjustment, setCreditAdjustment] = useState<string>('500');
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Broadcast Modal / Form State
  const [broadcastName, setBroadcastName] = useState('');
  const [selectedTemplateCode, setSelectedTemplateCode] = useState('platform_tenant_welcome');
  const [targetFilter, setTargetFilter] = useState('ALL');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAllData();
    loadAdminLogs();
  }, []);

  async function loadAdminLogs(status = logStatusFilter, search = logSearchQuery) {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== 'ALL') params.append('status', status);
      if (search) params.append('search', search);
      params.append('limit', '50');

      const res = await fetch(`${API_BASE}/whatsapp/admin/logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAdminLogs(data.data.logs || []);
        setTotalLogsCount(data.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load admin logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }

  const [pruning, setPruning] = useState(false);

  async function handlePruneLogs() {
    if (!confirm('Are you sure you want to purge all platform logs (WhatsApp delivery logs, audit logs, stale sessions) older than 5 days?')) {
      return;
    }
    setPruning(true);
    try {
      const res = await apiRequest('/super-admin/maintenance/prune-logs', {
        method: 'POST',
        body: JSON.stringify({ days: 5 }),
      });
      if (res.success) {
        alert(
          `Log Purge Complete!\nDeleted: ${res.data.deleted.whatsAppLogs} WhatsApp logs, ${res.data.deleted.auditLogs} Audit logs, ${res.data.deleted.staleSessions} stale sessions.`
        );
        loadAdminLogs();
      } else {
        alert(res.error || 'Failed to prune logs');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setPruning(false);
    }
  }

  const [syncingTemplates, setSyncingTemplates] = useState(false);

  async function handleSyncTemplates() {
    setSyncingTemplates(true);
    try {
      const res = await apiRequest('/whatsapp/admin/templates/sync', {
        method: 'POST',
      });
      if (res.success) {
        alert(
          `Meta Templates Synced Successfully!\nTotal templates found on Meta: ${res.data.totalTemplatesFromMeta}\nUpdated in Webin10: ${res.data.syncedCount}`
        );
        loadAllData();
      } else {
        alert(res.error || 'Failed to sync templates from Meta');
      }
    } catch (e: any) {
      alert(`Error syncing templates: ${e.message}`);
    } finally {
      setSyncingTemplates(false);
    }
  }

  async function loadAllData() {
    setLoading(true);
    try {
      const [statsRes, tenantsRes, autoRes, tmplRes] = await Promise.all([
        fetch(`${API_BASE}/whatsapp/admin/stats`),
        fetch(`${API_BASE}/whatsapp/admin/tenants`),
        fetch(`${API_BASE}/whatsapp/admin/automations`),
        fetch(`${API_BASE}/whatsapp/templates`),
      ]);

      const [statsData, tenantsData, autoData, tmplData] = await Promise.all([
        statsRes.json(),
        tenantsRes.json(),
        autoRes.json(),
        tmplRes.json(),
      ]);

      if (statsData.success) setStats(statsData.data);
      if (tenantsData.success) setTenants(tenantsData.data);
      if (autoData.success) setAutomations(autoData.data);
      if (tmplData.success) setTemplates(tmplData.data);
    } catch (err) {
      console.error('Failed to load WhatsApp admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleTenantAccess(tenantId: string, currentEnabled: boolean) {
    try {
      const res = await fetch(`${API_BASE}/whatsapp/admin/tenants/${tenantId}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          type: 'success',
          text: `WhatsApp access ${!currentEnabled ? 'ENABLED' : 'DISABLED'} for business.`,
        });
        loadAllData();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update tenant access' });
    }
  }

  async function handleToggleBlockTenant(tenantId: string, currentBlocked: boolean) {
    const reason = !currentBlocked ? prompt('Reason for blocking WhatsApp messaging:') : null;
    if (!currentBlocked && reason === null) return;

    try {
      const res = await fetch(`${API_BASE}/whatsapp/admin/tenants/${tenantId}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBlocked: !currentBlocked,
          blockReason: reason || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          type: 'success',
          text: `Business ${!currentBlocked ? 'BLOCKED' : 'UNBLOCKED'} from sending WhatsApp messages.`,
        });
        loadAllData();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update block state' });
    }
  }

  async function handleRechargeCredits(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTenant) return;

    const amount = Number(creditAdjustment);
    if (isNaN(amount) || amount === 0) {
      alert('Please enter a valid credit amount');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/whatsapp/admin/tenants/${selectedTenant.tenantId}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditsAdjustment: amount }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          type: 'success',
          text: `Successfully added ₹${amount} credits to ${selectedTenant.name}.`,
        });
        setShowCreditModal(false);
        setSelectedTenant(null);
        loadAllData();
      }
    } catch (err) {
      alert('Failed to recharge credits');
    }
  }

  async function handleTogglePlatformAutomation(ruleId: string, currentEnabled: boolean) {
    try {
      const res = await fetch(`${API_BASE}/whatsapp/admin/automations/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setAutomations((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: !currentEnabled } : r))
        );
        setStatusMsg({ type: 'success', text: 'Platform automation rule updated.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update rule' });
    }
  }

  async function handleSendPlatformBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastName.trim()) {
      alert('Enter broadcast name');
      return;
    }

    setIsBroadcasting(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`${API_BASE}/whatsapp/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: broadcastName,
          templateCode: selectedTemplateCode,
          targetFilter,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          type: 'success',
          text: `Platform broadcast "${broadcastName}" dispatched successfully to ${data.data.sentCount} business owners!`,
        });
        setBroadcastName('');
        loadAllData();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to dispatch broadcast' });
    } finally {
      setIsBroadcasting(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                WhatsApp Messaging & Access Governance
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Control which businesses can send WhatsApp messages, allocate credits, and manage platform-wide automations
              </p>
            </div>
          </div>

          <button
            onClick={loadAllData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>
        </div>

        {/* Status Alert */}
        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Businesses Enabled</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {stats.enabledTenants} <span className="text-xs font-normal text-slate-400">/ {stats.totalTenants}</span>
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Full Super Admin Control</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Platform Messages Sent</span>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalMessagesSent}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">All businesses combined</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Delivery Success Rate</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.deliverySuccessRate}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Meta Cloud API Gateway</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Credits in Circulation</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ₹{Number(stats.totalCreditsInCirculation).toFixed(2)}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Prepaid Tenant Wallets</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto">
          {[
            { id: 'tenants', label: 'Business Access & Credits', icon: Users, count: tenants.length },
            { id: 'automations', label: 'Platform Automations (To Businesses)', icon: Zap, count: automations.length },
            { id: 'broadcast', label: 'Broadcast to All Businesses', icon: Send },
            { id: 'templates', label: 'Templates Catalogue', icon: Layers, count: templates.length },
            { id: 'logs', label: 'Delivery Logs & Audit', icon: MessageSquare, count: totalLogsCount },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: BUSINESS ACCESS & CREDITS CONTROL */}
        {activeTab === 'tenants' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Tenant Access Gatekeeping</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Super Admin has authority to enable, disable, block, or allocate credits for any registered business.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Business / Tenant</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Owner Phone</th>
                    <th className="py-3 px-4 text-center">Service Access</th>
                    <th className="py-3 px-4 text-center">Credits Balance</th>
                    <th className="py-3 px-4 text-center">Campaigns</th>
                    <th className="py-3 px-4 text-center">Total Sent</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {tenants.map((t) => (
                    <tr key={t.tenantId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{t.name}</p>
                        <span className="text-[11px] font-mono text-slate-400">{t.slug}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{t.phone}</td>
                      <td className="py-3 px-4 text-center">
                        {t.whatsApp.isBlocked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            BLOCKED BY ADMIN
                          </span>
                        ) : t.whatsApp.isEnabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ENABLED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            DISABLED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-900 font-mono">
                          ₹{Number(t.whatsApp.creditsBalance).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">{t.whatsApp.totalCampaigns}</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600">
                        {t.whatsApp.totalMessagesSent}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTenant(t);
                              setShowCreditModal(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                          >
                            + Credits
                          </button>

                          <button
                            onClick={() => handleToggleTenantAccess(t.tenantId, t.whatsApp.isEnabled)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                              t.whatsApp.isEnabled
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            }`}
                          >
                            {t.whatsApp.isEnabled ? 'Disable' : 'Enable'}
                          </button>

                          <button
                            onClick={() => handleToggleBlockTenant(t.tenantId, t.whatsApp.isBlocked)}
                            className={`p-1 text-[11px] font-bold rounded-lg ${
                              t.whatsApp.isBlocked
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-rose-600 hover:bg-rose-50'
                            }`}
                            title={t.whatsApp.isBlocked ? 'Unblock Tenant' : 'Block Tenant'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PLATFORM AUTOMATIONS */}
        {activeTab === 'automations' && (
          <div className="space-y-6">
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 flex items-start gap-3">
              <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-indigo-950 text-sm">
                  Platform-Wide WhatsApp Automations (Super Admin &rarr; Businesses)
                </h4>
                <p className="text-xs text-indigo-800 mt-1">
                  These automated triggers send official Webin10 notifications to registered business owners when their workspace activates, platform subscription approaches expiry, or invoices are generated.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automations.map((rule) => (
                <div
                  key={rule.id}
                  className={`border rounded-2xl p-5 transition-all bg-white ${
                    rule.isEnabled ? 'border-indigo-300 shadow-xs' : 'border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          rule.isEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{rule.name}</h4>
                        <span className="text-[11px] font-mono text-slate-500">Template: {rule.templateCode}</span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.isEnabled}
                        onChange={() => handleTogglePlatformAutomation(rule.id, rule.isEnabled)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Timing: {rule.triggerTiming === 0 ? 'Instant Trigger' : `${Math.abs(rule.triggerTiming)} days before SaaS expiry`}
                    </span>
                    <span className="text-indigo-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {rule.isEnabled ? 'Active in Background' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BROADCAST TO ALL BUSINESSES */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Send Platform Announcement to Businesses</h3>
              <p className="text-xs text-slate-500 mt-1">
                Broadcast an official WhatsApp message to all registered business owners across Webin10.
              </p>
            </div>

            <form onSubmit={handleSendPlatformBroadcast} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Broadcast Title</label>
                <input
                  type="text"
                  required
                  value={broadcastName}
                  onChange={(e) => setBroadcastName(e.target.value)}
                  placeholder="e.g. Scheduled System Upgrade Announcement"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Businesses</label>
                <select
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-600"
                >
                  <option value="ALL">All Registered Businesses ({tenants.length})</option>
                  <option value="ACTIVE_TENANTS">Active Subscriptions Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Meta Template</label>
                <select
                  value={selectedTemplateCode}
                  onChange={(e) => setSelectedTemplateCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-600 font-medium"
                >
                  {templates
                    .filter((t) => t.code.startsWith('platform_') || t.isSystemDefault)
                    .map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.name} [{t.code}]
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isBroadcasting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Broadcast...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch WhatsApp Broadcast</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: TEMPLATES CATALOGUE */}
        {activeTab === 'templates' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">System & Platform WhatsApp Templates</h3>
                <p className="text-xs text-slate-500 mt-0.5">Approved Meta Cloud API templates available across Webin10</p>
              </div>

              <button
                onClick={handleSyncTemplates}
                disabled={syncingTemplates}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
                title="Fetch and sync newly created templates from Meta WhatsApp Manager"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingTemplates ? 'animate-spin' : ''}`} />
                <span>{syncingTemplates ? 'Syncing with Meta...' : 'Sync Templates from Meta'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Template Name</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Message Body Preview</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {templates.map((tmpl) => (
                    <tr key={tmpl.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{tmpl.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{tmpl.code}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {tmpl.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md truncate text-slate-600">{tmpl.bodyText}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {tmpl.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PLATFORM MESSAGE LOGS & FAILURE AUDIT */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">Platform Message Logs & Delivery Reports</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Auto-Retention: 5 Days Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time audit log of all messages dispatched across broadcasts, automations, and tenant campaigns.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search phone or name..."
                  value={logSearchQuery}
                  onChange={(e) => {
                    setLogSearchQuery(e.target.value);
                    loadAdminLogs(logStatusFilter, e.target.value);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />

                {/* Status Pills */}
                {['ALL', 'DELIVERED', 'FAILED', 'SENT'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setLogStatusFilter(st);
                      loadAdminLogs(st, logSearchQuery);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      logStatusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}

                <button
                  onClick={() => loadAdminLogs()}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Refresh Logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={handlePruneLogs}
                  disabled={pruning}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-semibold transition-colors disabled:opacity-50"
                  title="Purge logs older than 5 days immediately"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>{pruning ? 'Purging...' : 'Purge >5d Logs'}</span>
                </button>
              </div>
            </div>

            {loadingLogs ? (
              <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                Loading message audit logs...
              </div>
            ) : adminLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No message logs found matching criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Sender / Workspace</th>
                      <th className="py-3 px-4">Message Content Preview</th>
                      <th className="py-3 px-4 text-center">Status & Delivery Report</th>
                      <th className="py-3 px-4 text-right">Sent Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {adminLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{log.recipientName}</p>
                          <p className="text-[11px] font-mono text-slate-500">{log.recipientPhone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {log.tenantName}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-sm truncate text-slate-600" title={log.content}>
                          {log.content}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {log.status === 'DELIVERED' || log.status === 'READ' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              DELIVERED
                            </span>
                          ) : log.status === 'FAILED' ? (
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                FAILED
                              </span>
                              {log.errorMessage && (
                                <span className="text-[10px] text-rose-600 max-w-xs truncate mt-0.5 font-normal" title={log.errorMessage}>
                                  {log.errorMessage}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              <Clock className="w-3 h-3 text-blue-600" />
                              {log.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleString([], {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* RECHARGE CREDITS MODAL */}
        {showCreditModal && selectedTenant && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 text-sm">Add WhatsApp Credits</h3>
                <button onClick={() => setShowCreditModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">&times;</button>
              </div>

              <form onSubmit={handleRechargeCredits} className="p-6 space-y-4">
                <p className="text-xs text-slate-600">
                  Allocate prepaid messaging credits to <strong>{selectedTenant.name}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Adjustment (₹)</label>
                  <input
                    type="number"
                    value={creditAdjustment}
                    onChange={(e) => setCreditAdjustment(e.target.value)}
                    placeholder="500"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Use positive numbers to add credits (e.g. 500) or negative to deduct (e.g. -100).
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreditModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm"
                  >
                    Confirm Recharge
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
