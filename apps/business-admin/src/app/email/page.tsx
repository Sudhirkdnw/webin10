'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BusinessShell } from '@/components/business-shell';
import { useActiveTenant } from '@/lib/tenant';
import { getApiBaseUrl } from '@/lib/api';
import {
  Mail,
  Send,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Plus,
  Eye,
  RefreshCw,
  Gift,
  FileText,
  KeyRound,
  ShieldCheck,
  Calendar,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Inbox,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  totalCampaigns: number;
  totalSubscribersWithEmail: number;
  deliveryRate: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  variables: string[];
}

interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  contentHtml: string | null;
  templateCode: string | null;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'FAILED' | 'BOUNCED';
  errorMessage: string | null;
  messageId: string | null;
  sentAt: string;
  createdAt: string;
}

export default function BusinessEmailHubPage() {
  const { tenantId, tenantName } = useActiveTenant();
  const [stats, setStats] = useState<EmailStats>({
    totalSent: 0,
    totalFailed: 0,
    totalCampaigns: 0,
    totalSubscribersWithEmail: 0,
    deliveryRate: 100,
  });
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'logs'>('templates');

  // Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Send Direct Email Modal
  const [directModalOpen, setDirectModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [sendErrorMsg, setSendErrorMsg] = useState<string | null>(null);

  // Campaign Blast Modal
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [targetSegment, setTargetSegment] = useState('ALL_CUSTOMERS');
  const [campaignTemplateId, setCampaignTemplateId] = useState('');
  const [launching, setLaunching] = useState(false);

  // Template Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const baseUrl = getApiBaseUrl();

    try {
      const [statsRes, tplRes, logsRes] = await Promise.all([
        fetch(`${baseUrl}/tenants/${tenantId}/email/stats`),
        fetch(`${baseUrl}/tenants/${tenantId}/email/templates`),
        fetch(`${baseUrl}/tenants/${tenantId}/email/logs?search=${encodeURIComponent(logSearch)}&status=${statusFilter}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (tplRes.ok) {
        const tplData = await tplRes.json();
        setTemplates(tplData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.items || []);
      }
    } catch (err) {
      // Fail gracefully
    } finally {
      setLoading(false);
    }
  }, [tenantId, logSearch, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Send Direct Email
  const handleSendDirectEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendSuccessMsg(null);
    setSendErrorMsg(null);

    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/tenants/${tenantId}/email/send-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          recipientName,
          templateSlug: selectedTemplate || undefined,
          subject: emailSubject || undefined,
          customHtml: customMessage ? `<div style="font-family: Arial, sans-serif; padding: 20px;">${customMessage}</div>` : undefined,
          variables: {
            customer_name: recipientName || 'Valued Member',
            business_name: tenantName,
            gym_name: tenantName,
          },
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSendSuccessMsg(`Email successfully dispatched to ${recipientEmail}! Message ID: ${json.messageId}`);
        setTimeout(() => {
          setDirectModalOpen(false);
          setSendSuccessMsg(null);
          fetchData();
        }, 2500);
      } else {
        setSendErrorMsg(json.message || 'Failed to dispatch email');
      }
    } catch (err: any) {
      setSendErrorMsg(err.message || 'Connection error dispatching email');
    } finally {
      setSending(false);
    }
  };

  // Handle Launch Campaign Blast
  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLaunching(true);
    setSendSuccessMsg(null);
    setSendErrorMsg(null);

    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/tenants/${tenantId}/email/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          subject: campaignSubject,
          targetSegment,
          templateId: campaignTemplateId || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSendSuccessMsg(json.message || 'Campaign launched successfully!');
        setTimeout(() => {
          setCampaignModalOpen(false);
          setSendSuccessMsg(null);
          fetchData();
        }, 2500);
      } else {
        setSendErrorMsg(json.message || 'Failed to launch email campaign');
      }
    } catch (err: any) {
      setSendErrorMsg(err.message || 'Connection error launching campaign');
    } finally {
      setLaunching(false);
    }
  };

  const openSendModalWithTemplate = (tpl: EmailTemplate) => {
    setSelectedTemplate(tpl.slug);
    setEmailSubject(tpl.subject);
    setRecipientEmail('');
    setRecipientName('');
    setCustomMessage('');
    setSendSuccessMsg(null);
    setSendErrorMsg(null);
    setDirectModalOpen(true);
  };

  const getTemplateIcon = (slug: string) => {
    if (slug.includes('welcome')) return <Sparkles className="w-5 h-5 text-emerald-600" />;
    if (slug.includes('offer') || slug.includes('festival')) return <Gift className="w-5 h-5 text-purple-600" />;
    if (slug.includes('receipt') || slug.includes('invoice') || slug.includes('payment')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (slug.includes('expiry') || slug.includes('plan')) return <Clock className="w-5 h-5 text-amber-600" />;
    if (slug.includes('reset') || slug.includes('verify')) return <KeyRound className="w-5 h-5 text-indigo-600" />;
    return <Mail className="w-5 h-5 text-slate-600" />;
  };

  return (
    <BusinessShell>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Email Marketing & Automated Communication Hub
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live Multi-Channel
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Send promotional festival discounts, verification links, membership payment receipts, and automated email broadcasts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setSelectedTemplate('');
                setEmailSubject('Special Notification from ' + tenantName);
                setRecipientEmail('');
                setRecipientName('');
                setCustomMessage('');
                setSendSuccessMsg(null);
                setSendErrorMsg(null);
                setDirectModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>Send 1-Click Direct Email</span>
            </button>

            <button
              onClick={() => {
                setCampaignName(`Promotional Blast - ${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`);
                setCampaignSubject(`Exclusive 50% Festival Offer for ${tenantName} Members! 🎁`);
                setTargetSegment('ALL_CUSTOMERS');
                setCampaignTemplateId('');
                setSendSuccessMsg(null);
                setSendErrorMsg(null);
                setCampaignModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Launch Campaign Blast</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Emails Dispatched</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Send className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalSent}</div>
            <p className="text-[11px] text-slate-500">Delivered successfully to inboxes</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Delivery Success Rate</span>
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.deliveryRate}%</div>
            <p className="text-[11px] text-emerald-600 font-semibold">High inbox deliverability</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Campaigns Broadcast</span>
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Gift className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalCampaigns}</div>
            <p className="text-[11px] text-slate-500">Promotions & festival blasts</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Subscribers With Email</span>
              <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalSubscribersWithEmail}</div>
            <p className="text-[11px] text-slate-500">Gym members reachable via email</p>
          </div>
        </div>

        {/* Tabbed Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'templates'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready-to-Use Email Templates ({templates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Live Delivery Logs ({logs.length})</span>
          </button>
        </div>

        {/* TAB 1: TEMPLATES & 1-CLICK SEND */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pre-Configured Responsive Email Templates</h3>
                <p className="text-xs text-slate-500">Pick any template to send an instant offer, receipt, or welcome letter to any member</p>
              </div>
              <button
                onClick={fetchData}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        {getTemplateIcon(tpl.slug)}
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {tpl.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">{tpl.name}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">Subject: {tpl.subject}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                      {tpl.bodyText || tpl.bodyHtml.replace(/<[^>]*>?/gm, '').slice(0, 150)}...
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <button
                      onClick={() => setPreviewTemplate(tpl)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => openSendModalWithTemplate(tpl)}
                      className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send to Member</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE DELIVERY LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-emerald-600" />
                  Real-Time Email Delivery & Recipient Logs
                </h3>
                <p className="text-xs text-slate-500">Permanent record of all transactional and promotional emails sent from this gym</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by email or subject..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-56"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                  <option value="QUEUED">Queued</option>
                </select>

                <button
                  onClick={fetchData}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3">Recipient</th>
                    <th className="px-5 py-3">Subject & Template</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Message ID</th>
                    <th className="px-5 py-3 text-right">Time Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-sans">
                        No email delivery logs recorded yet. Send your first direct email or campaign!
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors font-sans">
                        <td className="px-5 py-3">
                          <span className="font-bold text-slate-900 block">{log.recipientName || 'Member'}</span>
                          <span className="text-xs text-slate-500 font-mono">{log.recipientEmail}</span>
                        </td>
                        <td className="px-5 py-3 max-w-md">
                          <span className="font-semibold text-slate-800 block truncate">{log.subject}</span>
                          {log.templateCode && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono inline-block mt-0.5">
                              {log.templateCode}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {log.status === 'SENT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sent / Delivered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-500 font-mono text-[11px] truncate max-w-[140px]" title={log.messageId || 'N/A'}>
                          {log.messageId || 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-500 text-xs">
                          {new Date(log.sentAt || log.createdAt).toLocaleDateString()} {new Date(log.sentAt || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: SEND DIRECT EMAIL */}
        {directModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Send Direct Email</h3>
                    <p className="text-xs text-slate-500">Send welcome note, fee receipt, or custom message</p>
                  </div>
                </div>
                <button onClick={() => setDirectModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {sendSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{sendSuccessMsg}</span>
                </div>
              )}

              {sendErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{sendErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSendDirectEmail} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Recipient Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. member@gmail.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Recipient Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Choose Template (Optional)</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      const t = templates.find((tpl) => tpl.slug === e.target.value);
                      if (t) setEmailSubject(t.subject);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">No Template (Send Custom HTML Message)</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.slug}>
                        {t.name} ({t.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Welcome to FitZone Club! 🎉"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {!selectedTemplate && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Custom Message Content</label>
                    <textarea
                      rows={3}
                      placeholder="Write your email message here..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDirectModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? 'Dispatching...' : 'Dispatch Email'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: LAUNCH CAMPAIGN BLAST */}
        {campaignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Launch Bulk Email Campaign</h3>
                    <p className="text-xs text-slate-500">Broadcast festival offers or announcements to all gym members</p>
                  </div>
                </div>
                <button onClick={() => setCampaignModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {sendSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{sendSuccessMsg}</span>
                </div>
              )}

              {sendErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{sendErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLaunchCampaign} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwali 50% Off Upgrade Blast"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Subject Line *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exclusive Offer: 50% OFF on Annual Membership! 🎁"
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Member Segment</label>
                  <select
                    value={targetSegment}
                    onChange={(e) => setTargetSegment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold"
                  >
                    <option value="ALL_CUSTOMERS">All Customers & Members ({stats.totalSubscribersWithEmail} Reachable)</option>
                    <option value="ACTIVE_MEMBERS">Active Members Only (Loyalty Offer)</option>
                    <option value="EXPIRED_MEMBERS">Expired Members Only (Win-Back Discount)</option>
                    <option value="LEADS">Prospective Leads Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Choose Responsive Template</label>
                  <select
                    value={campaignTemplateId}
                    onChange={(e) => setCampaignTemplateId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="">Default Brand Promotional Template</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCampaignModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={launching}
                    className="px-5 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>{launching ? 'Launching Blast...' : 'Launch Broadcast Campaign'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: TEMPLATE PREVIEW */}
        {previewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{previewTemplate.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Subject: {previewTemplate.subject}</p>
                </div>
                <button onClick={() => setPreviewTemplate(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                className="bg-slate-50 p-6 rounded-xl border border-slate-200 max-h-[60vh] overflow-y-auto text-xs"
                dangerouslySetInnerHTML={{
                  __html: previewTemplate.bodyHtml
                    .replace(/{{\s*customer_name\s*}}/g, 'Rahul Sharma')
                    .replace(/{{\s*user_name\s*}}/g, 'Rahul')
                    .replace(/{{\s*business_name\s*}}/g, tenantName)
                    .replace(/{{\s*gym_name\s*}}/g, tenantName)
                    .replace(/{{\s*plan_name\s*}}/g, 'Annual Fitness Plan')
                    .replace(/{{\s*expiry_date\s*}}/g, '12/31/2026')
                    .replace(/{{\s*amount\s*}}/g, '₹1,999'),
                }}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 font-semibold text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    const t = previewTemplate;
                    setPreviewTemplate(null);
                    openSendModalWithTemplate(t);
                  }}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Use This Template</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BusinessShell>
  );
}
