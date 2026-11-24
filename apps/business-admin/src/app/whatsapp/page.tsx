'use client';

import React, { useState, useEffect } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  MessageSquare,
  Send,
  Zap,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  PhoneCall,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Sliders,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  CheckCheck,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

const API_BASE = 'http://localhost:4000/api/v1';
const DEMO_TENANT_ID = '1ccc2ab5-30fa-40a4-abc6-557bc6495b8a';

export default function WhatsAppHubPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'automations' | 'logs' | 'connection'>('campaigns');
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [audienceCounts, setAudienceCounts] = useState<any>({ total: 0, active: 0, expired: 0, feeDue: 0, leads: 0 });

  // Create Campaign Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplateCode, setSelectedTemplateCode] = useState('festival_offer_blast');
  const [selectedSegment, setSelectedSegment] = useState('ALL_ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [accRes, tmplRes, campRes, autoRes, logsRes, custRes] = await Promise.all([
        fetch(`${API_BASE}/whatsapp/accounts/${DEMO_TENANT_ID}`),
        fetch(`${API_BASE}/whatsapp/templates`),
        fetch(`${API_BASE}/whatsapp/campaigns/${DEMO_TENANT_ID}`),
        fetch(`${API_BASE}/whatsapp/automations/${DEMO_TENANT_ID}`),
        fetch(`${API_BASE}/whatsapp/logs/${DEMO_TENANT_ID}?limit=25`),
        fetch(`${API_BASE}/whatsapp/customers/${DEMO_TENANT_ID}`),
      ]);

      const [accData, tmplData, campData, autoData, logsData, custData] = await Promise.all([
        accRes.json(),
        tmplRes.json(),
        campRes.json(),
        autoRes.json(),
        logsRes.json(),
        custRes.json(),
      ]);

      if (accData.success) setAccount(accData.data);
      if (tmplData.success) setTemplates(tmplData.data);
      if (campData.success) setCampaigns(campData.data);
      if (autoData.success) setAutomations(autoData.data);
      if (logsData.success) setLogs(logsData.data);
      if (custData.success && custData.data.counts) setAudienceCounts(custData.data.counts);
    } catch (err: any) {
      console.error('Failed to load WhatsApp data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleAutomation(ruleId: string, currentEnabled: boolean) {
    try {
      const res = await fetch(`${API_BASE}/whatsapp/automations/${DEMO_TENANT_ID}/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setAutomations((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: !currentEnabled } : r))
        );
        setStatusMsg({ type: 'success', text: `Automation rule updated successfully.` });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Failed to update automation rule' });
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!campaignName.trim()) {
      alert('Please enter a campaign name');
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`${API_BASE}/whatsapp/campaigns/${DEMO_TENANT_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          templateCode: selectedTemplateCode,
          targetSegment: selectedSegment,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.message || 'Failed to dispatch campaign');
      }

      setStatusMsg({
        type: 'success',
        text: `Campaign "${campaignName}" dispatched successfully to ${data.data.totalCount} recipients!`,
      });
      setShowCreateModal(false);
      setCampaignName('');
      loadAllData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedTemplate = templates.find((t) => t.code === selectedTemplateCode);

  return (
    <BusinessShell>
      <div className="space-y-6">
        {/* HEADER SECTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">WhatsApp Marketing & Automation</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  {account?.status || 'CONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Official Meta Cloud API Sender: <span className="font-semibold text-slate-700">{account?.displayPhoneNumber || '+91 7070799200'}</span> &bull; Quality Rating: <span className="text-emerald-600 font-semibold">{account?.qualityRating || 'HIGH'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
              <span className="text-[11px] text-slate-500 block font-medium">Credits Available</span>
              <span className="text-sm font-bold text-slate-900">₹{account?.creditsBalance ? Number(account.creditsBalance).toFixed(2) : '500.00'}</span>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Bulk Campaign</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION ALERT */}
        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600">
              &times;
            </button>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-200 space-x-1 sm:space-x-4 overflow-x-auto">
          {[
            { id: 'campaigns', label: 'Bulk Broadcasts', icon: Send, count: campaigns.length },
            { id: 'automations', label: 'Event Automations', icon: Zap, count: automations.length },
            { id: 'logs', label: 'Delivery Logs & Chat', icon: CheckCheck, count: logs.length },
            { id: 'connection', label: 'Sender & Numbers', icon: Smartphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: BULK CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-xs text-slate-500 font-medium">Total Campaigns</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{campaigns.length}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-xs text-slate-500 font-medium">Messages Delivered</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {campaigns.reduce((acc, c) => acc + (c.deliveredCount || 0), 0)}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-xs text-slate-500 font-medium">Avg. Read Rate</span>
                <p className="text-2xl font-bold text-indigo-600 mt-1">78.4%</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-xs text-slate-500 font-medium">Active Audience</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{audienceCounts.total} Contacts</p>
              </div>
            </div>

            {/* Campaign Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Campaign History</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Bulk marketing broadcasts sent to your clients</p>
                </div>
                <button
                  onClick={loadAllData}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <Send className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">No Bulk Campaigns Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Launch your first broadcast campaign to send festival offers, renewal reminders, or announcements to all your customers.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                  >
                    Create First Campaign
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <th className="py-3 px-4">Campaign Name</th>
                        <th className="py-3 px-4">Target Segment</th>
                        <th className="py-3 px-4">Template</th>
                        <th className="py-3 px-4 text-center">Recipients</th>
                        <th className="py-3 px-4 text-center">Delivered</th>
                        <th className="py-3 px-4 text-center">Read Rate</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {campaigns.map((camp) => (
                        <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{camp.name}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {camp.targetSegment.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                            {camp.template?.name || camp.templateId}
                          </td>
                          <td className="py-3 px-4 text-center font-bold">{camp.totalCount}</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">{camp.deliveredCount}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-indigo-600">
                              {camp.deliveredCount > 0
                                ? `${Math.round((camp.readCount / camp.deliveredCount) * 100)}%`
                                : '0%'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                camp.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : camp.status === 'RUNNING'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {camp.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500">
                            {new Date(camp.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AUTOMATION RULES */}
        {activeTab === 'automations' && (
          <div className="space-y-6">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
              <Zap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">100% Hands-Free Event Triggers</h4>
                <p className="text-xs text-emerald-800 mt-1">
                  These automations trigger automatically in the background when members register, fees are due, payments are recorded, or attendance is taken. No manual work required.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automations.map((rule) => (
                <div
                  key={rule.id}
                  className={`border rounded-2xl p-5 transition-all bg-white ${
                    rule.isEnabled ? 'border-emerald-300 shadow-xs' : 'border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          rule.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
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
                        onChange={() => handleToggleAutomation(rule.id, rule.isEnabled)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Timing: {rule.triggerTiming === 0 ? 'Instant Trigger' : `${Math.abs(rule.triggerTiming)} days before event`}
                    </span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {rule.isEnabled ? 'Active in Background' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGE LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Message Delivery Logs</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time status updates received from Meta</p>
              </div>
              <button
                onClick={loadAllData}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No message logs recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Direction</th>
                      <th className="py-3 px-4">Message Content Preview</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{log.recipientName || 'Member'}</p>
                          <p className="text-[11px] font-mono text-slate-500">{log.recipientPhone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.direction === 'OUTBOUND'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {log.direction}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-md truncate text-slate-600">
                          {log.content}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                          {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SENDER SETUP */}
        {activeTab === 'connection' && (
          <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">WhatsApp Sender Settings</h3>
              <p className="text-xs text-slate-500 mt-1">
                Choose how your business sends messages to clients.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-emerald-500/40 bg-emerald-50/30 rounded-xl p-4 flex items-start gap-3">
                <input
                  type="radio"
                  name="senderMode"
                  checked={account?.mode === 'SHARED_PLATFORM'}
                  readOnly
                  className="mt-1 text-emerald-600"
                />
                <div className="flex-1">
                  <span className="font-bold text-slate-900 text-xs block">Webin10 Verified Platform Sender (Recommended)</span>
                  <p className="text-xs text-slate-600 mt-1">
                    Zero technical setup required. Messages are sent immediately with your business name header. You only need credit recharge.
                  </p>
                  <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Active & Ready to Dispatch
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 flex items-start gap-3 opacity-80">
                <input type="radio" name="senderMode" disabled className="mt-1" />
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Meta Embedded Signup (Own Phone Number)</span>
                  <p className="text-xs text-slate-500 mt-1">
                    Connect your own dedicated SIM / phone number directly via Facebook popup.
                  </p>
                  <button
                    disabled
                    className="mt-2 px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed"
                  >
                    Connect with Facebook
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE CAMPAIGN MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Launch Bulk WhatsApp Campaign</h3>
                    <p className="text-[11px] text-slate-500">Reach your clients with Meta-approved templates</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateCampaign} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Diwali 25% Off Renewal Blast"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Target Audience</label>
                  <select
                    value={selectedSegment}
                    onChange={(e) => setSelectedSegment(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="ALL_ACTIVE">Active Members Only ({audienceCounts.active} contacts)</option>
                    <option value="EXPIRED_MEMBERS">Expired Members - Winback ({audienceCounts.expired} contacts)</option>
                    <option value="FEE_DUE">Fee Pending / Due ({audienceCounts.feeDue} contacts)</option>
                    <option value="LEADS">New Leads / Inquiries ({audienceCounts.leads} contacts)</option>
                    <option value="ALL">All Contacts in Database ({audienceCounts.total} contacts)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Choose Pre-Approved Template</label>
                  <select
                    value={selectedTemplateCode}
                    onChange={(e) => setSelectedTemplateCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    {templates.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.name} [{t.category}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* LIVE PREVIEW OF WHATSAPP MESSAGE */}
                {selectedTemplate && (
                  <div className="mt-4 bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block mb-2">
                      Live Message Preview
                    </span>
                    <div className="bg-white border border-emerald-100 rounded-lg p-3 text-xs text-slate-800 leading-relaxed shadow-2xs font-sans">
                      <p>{selectedTemplate.bodyText}</p>
                      {selectedTemplate.buttons && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                          {selectedTemplate.buttons.map((btn: any, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1"
                            >
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                              {btn.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Modal Buttons */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>🚀 Send Campaign Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </BusinessShell>
  );
}
