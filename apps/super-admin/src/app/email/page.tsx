'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import {
  Mail,
  Send,
  Inbox,
  Sparkles,
  Server,
  TrendingUp,
  Building2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Eye,
  Sliders,
  ExternalLink,
  Users,
  Radio,
  FileText,
  Key,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  totalCampaigns: number;
  totalGymTenants: number;
  totalAudienceReachable: number;
  deliveryRate: number;
  smtpConfigured: boolean;
  smtpProvider: string;
  fromEmail: string;
}

interface GymTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  email: string | null;
  ownerName: string;
  phone: string | null;
}

interface EmailLog {
  id: string;
  tenantId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  contentHtml?: string | null;
  templateCode?: string | null;
  status: 'SENT' | 'FAILED' | 'QUEUED';
  errorMessage?: string | null;
  messageId?: string | null;
  sentAt: string;
  createdAt: string;
  tenant?: { id: string; name: string; slug: string } | null;
  campaign?: { id: string; name: string } | null;
}

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables: string[];
}

interface SmtpConfigState {
  provider: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  isConfigured: boolean;
}

const PRESET_BROADCASTS = [
  {
    name: 'AI Diet Planner Launch Announcement',
    subject: '🚀 Introducing Webin10 AI Diet Planner: Boost Member Retention!',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #4F46E5; margin: 0; font-size: 24px;">Webin10 Platform Update 🚀</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Empowering Gyms Across India</p>
  </div>
  <p>Dear <strong>{{owner_name}}</strong>,</p>
  <p>We are thrilled to announce that <strong>{{platform_name}}</strong> is launching the brand-new <strong>AI Diet & Nutrition Planner</strong> tonight at 12:00 AM!</p>
  <div style="background: #f8fafc; border-left: 4px solid #4F46E5; padding: 14px; margin: 18px 0; border-radius: 4px;">
    <h4 style="margin: 0 0 6px 0; color: #1e293b;">What this means for {{gym_name}}:</h4>
    <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
      <li>Auto-generate personalized Indian vegetarian & non-veg meal plans for your members.</li>
      <li>Instant WhatsApp delivery of diet charts right after workout check-in.</li>
      <li>Zero extra manual effort for gym trainers!</li>
    </ul>
  </div>
  <p>This feature will be automatically enabled on your <strong>{{gym_name}}</strong> dashboard.</p>
  <p style="margin-top: 24px;">Best regards,<br/><strong>Webin10 Engineering & Product Team</strong><br/><span style="color: #94a3b8; font-size: 12px;">Contact: {{support_email}}</span></p>
</div>`,
  },
  {
    name: 'Scheduled Server Maintenance Notice',
    subject: '⚠️ Scheduled System Maintenance: Webin10 Platform Upgrade',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fde68a; border-radius: 12px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #d97706; margin: 0; font-size: 22px;">Platform Maintenance Notice ⚠️</h1>
    <p style="color: #78716c; font-size: 14px; margin-top: 5px;">Webin10 Core Infrastructure Optimization</p>
  </div>
  <p>Dear <strong>{{owner_name}}</strong>,</p>
  <p>To ensure high availability and enhanced security for <strong>{{gym_name}}</strong>, our team has scheduled an essential database optimization and server upgrade.</p>
  <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 14px; margin: 18px 0; border-radius: 8px;">
    <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>📅 Maintenance Window:</strong> Sunday, 2:00 AM – 3:30 AM IST</p>
    <p style="margin: 6px 0 0 0; font-size: 13px; color: #92400e;"><strong>⏱️ Expected Downtime:</strong> Less than 10 minutes</p>
  </div>
  <p style="font-size: 13px; color: #475569;">All attendance logs and WhatsApp messages queued during this brief window will be automatically synced as soon as maintenance finishes.</p>
  <p style="margin-top: 24px;">Thank you for your cooperation,<br/><strong>Webin10 Operations Desk</strong></p>
</div>`,
  },
  {
    name: 'Festival 50% Off SaaS Upgrade Offer',
    subject: '🎉 Festival Special: Upgrade {{gym_name}} to Enterprise Plan at 50% OFF!',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #c7d2fe; border-radius: 12px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #4338ca; margin: 0; font-size: 24px;">Festival Milestone Celebration 🎉</h1>
    <p style="color: #6366f1; font-weight: bold; font-size: 14px; margin-top: 5px;">Exclusive Gym Partner Privilege</p>
  </div>
  <p>Dear <strong>{{owner_name}}</strong>,</p>
  <p>As part of our nationwide festival celebration, we are excited to offer <strong>{{gym_name}}</strong> an exclusive <strong>50% FLAT DISCOUNT</strong> on annual plan renewals and feature unlocks!</p>
  <div style="background: #eef2ff; border: 1px dashed #6366f1; padding: 16px; margin: 20px 0; text-align: center; border-radius: 8px;">
    <p style="margin: 0; font-size: 13px; color: #4338ca; font-weight: bold;">USE COUPON CODE AT CHECKOUT:</p>
    <h2 style="margin: 8px 0; color: #4338ca; font-size: 28px; letter-spacing: 2px;">FESTIVAL50</h2>
    <p style="margin: 0; font-size: 12px; color: #64748b;">Valid for the next 48 hours only</p>
  </div>
  <p>Log in to your admin panel to claim your discount before it expires.</p>
  <p style="margin-top: 24px;">Warm wishes,<br/><strong>Team Webin10 India</strong></p>
</div>`,
  },
];

export default function SuperAdminEmailPage() {
  const [stats, setStats] = useState<EmailStats>({
    totalSent: 0,
    totalFailed: 0,
    totalCampaigns: 0,
    totalGymTenants: 0,
    totalAudienceReachable: 0,
    deliveryRate: 100,
    smtpConfigured: false,
    smtpProvider: 'custom',
    fromEmail: 'webin10.in@gmail.com',
  });

  const [gyms, setGyms] = useState<GymTenant[]>([]);
  const [gymCounts, setGymCounts] = useState({ all: 0, active: 0, inactive: 0 });
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: broadcasts | logs | smtp | templates
  const [activeTab, setActiveTab] = useState<'broadcasts' | 'logs' | 'smtp' | 'templates'>('broadcasts');

  // Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Broadcast Modal State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastName, setBroadcastName] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<'ALL_GYMS' | 'ACTIVE_GYMS' | 'INACTIVE_GYMS' | 'SPECIFIC_GYM'>('ALL_GYMS');
  const [specificTenantId, setSpecificTenantId] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Direct Send Email Modal State
  const [directModalOpen, setDirectModalOpen] = useState(false);
  const [directRecipient, setDirectRecipient] = useState('');
  const [directName, setDirectName] = useState('');
  const [directSubject, setDirectSubject] = useState('');
  const [directContent, setDirectContent] = useState('');
  const [directSending, setDirectSending] = useState(false);
  const [directMsg, setDirectMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfigState>({
    provider: 'google',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: 'webin10.in@gmail.com',
    fromName: 'Webin10 SaaS Platform',
    replyTo: 'support@webin10.com',
    isConfigured: false,
  });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Test Email State
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Template Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // 1. Fetch All Telemetry Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, gymsRes, logsRes, tplsRes, smtpRes] = await Promise.all([
        apiRequest<EmailStats>('/super-admin/email/stats'),
        apiRequest<{ gyms: GymTenant[]; counts: { all: number; active: number; inactive: number } }>('/super-admin/email/gyms'),
        apiRequest<{ items: EmailLog[]; total: number }>(`/super-admin/email/logs?search=${encodeURIComponent(logSearch)}&status=${statusFilter}`),
        apiRequest<EmailTemplate[]>('/super-admin/email-templates'),
        apiRequest<SmtpConfigState>('/super-admin/email/smtp-config'),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (gymsRes.success && gymsRes.data) {
        setGyms(Array.isArray(gymsRes.data.gyms) ? gymsRes.data.gyms : []);
        setGymCounts(gymsRes.data.counts || { all: 0, active: 0, inactive: 0 });
      }
      if (logsRes.success && logsRes.data) {
        setLogs(Array.isArray(logsRes.data.items) ? logsRes.data.items : (Array.isArray(logsRes.data) ? logsRes.data : []));
      }
      if (tplsRes.success && tplsRes.data) {
        setTemplates(Array.isArray(tplsRes.data) ? tplsRes.data : []);
      }
      if (smtpRes.success && smtpRes.data) {
        setSmtpConfig(smtpRes.data);
      }
    } catch (e) {
      // Fail gracefully
    } finally {
      setLoading(false);
    }
  }, [logSearch, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Preset Selection for Broadcast
  const applyPreset = (preset: typeof PRESET_BROADCASTS[0]) => {
    setBroadcastName(preset.name);
    setBroadcastSubject(preset.subject);
    setBroadcastContent(preset.content);
    setBroadcastModalOpen(true);
  };

  // Launch Broadcast Campaign
  const handleLaunchBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcasting(true);
    setBroadcastMsg(null);

    try {
      const res = await apiRequest<{ message: string; sentCount: number }>('/super-admin/email/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          name: broadcastName,
          subject: broadcastSubject,
          targetAudience: broadcastAudience,
          specificTenantId: broadcastAudience === 'SPECIFIC_GYM' ? specificTenantId : undefined,
          contentHtml: broadcastContent,
        }),
      });

      if (res.success) {
        setBroadcastMsg({
          type: 'success',
          text: res.data?.message || 'Broadcast campaign sent successfully!',
        });
        setTimeout(() => {
          setBroadcastModalOpen(false);
          setBroadcastMsg(null);
          fetchData();
        }, 1800);
      } else {
        setBroadcastMsg({
          type: 'error',
          text: res.error || 'Failed to dispatch broadcast campaign',
        });
      }
    } catch (err: any) {
      setBroadcastMsg({ type: 'error', text: err.message || 'Error occurred while sending' });
    } finally {
      setBroadcasting(false);
    }
  };

  // Send Direct Email
  const handleSendDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectSending(true);
    setDirectMsg(null);

    try {
      const res = await apiRequest<{ message: string }>('/super-admin/email/send-direct', {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: directRecipient,
          recipientName: directName || undefined,
          subject: directSubject,
          contentHtml: directContent,
        }),
      });

      if (res.success) {
        setDirectMsg({ type: 'success', text: 'Email sent successfully!' });
        setTimeout(() => {
          setDirectModalOpen(false);
          setDirectMsg(null);
          setDirectRecipient('');
          setDirectSubject('');
          setDirectContent('');
          fetchData();
        }, 1500);
      } else {
        setDirectMsg({ type: 'error', text: res.error || 'Failed to send direct email' });
      }
    } catch (err: any) {
      setDirectMsg({ type: 'error', text: err.message || 'Error occurred' });
    } finally {
      setDirectSending(false);
    }
  };

  // Save SMTP Settings
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    setSmtpFeedback(null);

    try {
      const res = await apiRequest('/super-admin/email/smtp-config', {
        method: 'PUT',
        body: JSON.stringify(smtpConfig),
      });

      if (res.success) {
        setSmtpFeedback({ type: 'success', text: 'SMTP server configuration saved successfully!' });
        fetchData();
      } else {
        setSmtpFeedback({ type: 'error', text: res.error || 'Failed to save SMTP configuration' });
      }
    } catch (err: any) {
      setSmtpFeedback({ type: 'error', text: err.message || 'Network error saving SMTP' });
    } finally {
      setSavingSmtp(false);
    }
  };

  // Send Live Test Email to verify SMTP
  const handleTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailRecipient) return;

    setTestingSmtp(true);
    setTestFeedback(null);

    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/super-admin/email/test-smtp', {
        method: 'POST',
        body: JSON.stringify({
          testRecipient: testEmailRecipient,
          config: smtpConfig,
        }),
      });

      if (res.success && res.data?.success) {
        setTestFeedback({
          type: 'success',
          text: res.data.message || 'SMTP Verified! Test email delivered to your inbox.',
        });
      } else {
        setTestFeedback({
          type: 'error',
          text: res.data?.message || res.error || 'SMTP Connection or Authentication failed.',
        });
      }
    } catch (err: any) {
      setTestFeedback({ type: 'error', text: err.message || 'Connection test failed' });
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl">
                <Mail className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">Platform Email & Broadcast Hub</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Broadcast announcements to gym owners across India, view global delivery telemetry, and configure SMTP gateway
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBroadcastName('');
                setBroadcastSubject('');
                setBroadcastContent('');
                setBroadcastAudience('ALL_GYMS');
                setBroadcastModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch Gym Broadcast</span>
            </button>

            <button
              onClick={() => setDirectModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Direct Email</span>
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Email Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Platform Emails Sent</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Send className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalSent}</div>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Live Dispatched
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Delivery Success</span>
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.deliveryRate}%</div>
            <p className="text-[11px] text-blue-600 font-semibold">Inbox Deliverability</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Gym Broadcasts</span>
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalCampaigns}</div>
            <p className="text-[11px] text-purple-600 font-semibold">Campaign blasts</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Reachable Gyms</span>
              <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Building2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{gymCounts.all || stats.totalAudienceReachable}</div>
            <p className="text-[11px] text-slate-500 font-medium">{gymCounts.active} Active Gyms</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>SMTP Gateway</span>
              <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                <Server className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  smtpConfig.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-sm font-bold text-slate-900 truncate">
                {smtpConfig.isConfigured ? 'Connected' : 'Dev Simulation'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate">{smtpConfig.fromEmail}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('broadcasts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'broadcasts'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gym Broadcasts & Presets</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Global Delivery Logs ({Array.isArray(logs) ? logs.length : 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('smtp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'smtp'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>SMTP Gateway & Tester</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Email Templates ({Array.isArray(templates) ? templates.length : 0})</span>
          </button>
        </div>

        {/* TAB 1: BROADCASTS & PRESETS */}
        {activeTab === 'broadcasts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">One-Click Platform Broadcast Presets</h3>
                <p className="text-xs text-slate-500">
                  Pre-drafted announcements for nationwide gym partners with automatic variable replacements
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PRESET_BROADCASTS.map((preset, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase">
                        Campaign #{idx + 1}
                      </span>
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{preset.name}</h4>
                    <p className="text-xs text-slate-500 font-mono line-clamp-1">{preset.subject}</p>
                    <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-100 line-clamp-3">
                      {preset.content.replace(/<[^>]*>?/gm, '').slice(0, 140)}...
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {gymCounts.all} Gyms
                    </span>
                    <button
                      onClick={() => applyPreset(preset)}
                      className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Review & Broadcast</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Reachable Gyms Audience Overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Audience Directory: Registered Gym Tenants ({gyms.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Live list of gym owners and verified email contacts across India
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5">Gym Name & Slug</th>
                      <th className="px-4 py-2.5">Owner Contact</th>
                      <th className="px-4 py-2.5">Tenant Status</th>
                      <th className="px-4 py-2.5 text-right">Direct Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gyms.slice(0, 8).map((gym) => (
                      <tr key={gym.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-slate-900 block">{gym.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">/{gym.slug}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-slate-800 block">{gym.ownerName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {gym.email || <span className="text-rose-500">No email set</span>}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              gym.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {gym.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            disabled={!gym.email}
                            onClick={() => {
                              setDirectRecipient(gym.email || '');
                              setDirectName(gym.ownerName);
                              setDirectSubject(`Notice for ${gym.name} Management`);
                              setDirectModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40"
                          >
                            Send Email
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE DELIVERY LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-indigo-600" />
                  All Platform Email Delivery Logs
                </h3>
                <p className="text-xs text-slate-500">
                  Audit trail of all transactional notifications and marketing broadcasts across the SaaS platform
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search email, subject, or message ID..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
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
                    <th className="px-5 py-3">Gym Tenant</th>
                    <th className="px-5 py-3">Recipient</th>
                    <th className="px-5 py-3">Subject & Template</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Message ID</th>
                    <th className="px-5 py-3 text-right">Time Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(Array.isArray(logs) ? logs : []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        No platform email logs found. Launch a broadcast or test an email to see records here.
                      </td>
                    </tr>
                  ) : (
                    (Array.isArray(logs) ? logs : []).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3">
                          {log.tenant ? (
                            <div>
                              <span className="font-bold text-slate-900 block">{log.tenant.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">/{log.tenant.slug}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700">
                              Platform Global
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-bold text-slate-900 block">{log.recipientName || 'Partner'}</span>
                          <span className="text-xs text-slate-500 font-mono">{log.recipientEmail}</span>
                        </td>
                        <td className="px-5 py-3 max-w-sm">
                          <span className="font-semibold text-slate-800 block truncate">{log.subject}</span>
                          {log.templateCode && (
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono inline-block mt-0.5">
                              {log.templateCode}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {log.status === 'SENT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Delivered
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"
                              title={log.errorMessage || 'Failed'}
                            >
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

        {/* TAB 3: SMTP GATEWAY & LIVE TESTER */}
        {activeTab === 'smtp' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SMTP Configuration Form */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Server className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Global SMTP Server Settings</h3>
                    <p className="text-xs text-slate-500">Configure email delivery credentials (Gmail, AWS SES, Resend, Custom SMTP)</p>
                  </div>
                </div>
              </div>

              {smtpFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    smtpFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {smtpFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{smtpFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveSmtp} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Email Provider</label>
                    <select
                      value={smtpConfig.provider}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSmtpConfig({
                          ...smtpConfig,
                          provider: val,
                          host: val === 'google' ? 'smtp.gmail.com' : val === 'ses' ? 'email-smtp.ap-south-1.amazonaws.com' : smtpConfig.host,
                          port: val === 'google' ? 587 : smtpConfig.port,
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="google">Google Workspace / Gmail (App Password)</option>
                      <option value="ses">Amazon SES</option>
                      <option value="sendgrid">SendGrid / Resend</option>
                      <option value="custom">Custom SMTP Server</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">SMTP Host *</label>
                    <input
                      type="text"
                      required
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                      placeholder="e.g. smtp.gmail.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">SMTP Port *</label>
                    <input
                      type="number"
                      required
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                      placeholder="587 or 465"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">SMTP Username / Email *</label>
                    <input
                      type="text"
                      required
                      value={smtpConfig.username}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                      placeholder="e.g. webin10.in@gmail.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">
                      SMTP Password / App Password
                    </label>
                    <input
                      type="password"
                      value={smtpConfig.password || ''}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                      placeholder="Enter new password or leave masked"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                    <p className="text-[10px] text-slate-400">For Gmail, generate a 16-character Google App Password</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Sender Display Name *</label>
                    <input
                      type="text"
                      required
                      value={smtpConfig.fromName}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                      placeholder="e.g. Webin10 SaaS Platform"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">From Email Address *</label>
                    <input
                      type="email"
                      required
                      value={smtpConfig.fromEmail}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                      placeholder="e.g. notifications@webin10.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Reply-To Email Address</label>
                    <input
                      type="email"
                      value={smtpConfig.replyTo || ''}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, replyTo: e.target.value })}
                      placeholder="e.g. support@webin10.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={savingSmtp}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{savingSmtp ? 'Saving Settings...' : 'Save SMTP Configuration'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Test Email Tool */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Live Connection Tester</h4>
                    <p className="text-xs text-slate-500">Send an instant test email to verify credentials</p>
                  </div>
                </div>

                {testFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      testFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {testFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testFeedback.text}</span>
                  </div>
                )}

                <form onSubmit={handleTestSmtp} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Test Recipient Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. your-email@gmail.com"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={testingSmtp || !testEmailRecipient}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${testingSmtp ? 'animate-bounce' : ''}`} />
                    <span>{testingSmtp ? 'Verifying & Sending...' : 'Send Live Test Email'}</span>
                  </button>
                </form>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">💡 Developer Tip:</p>
                <p>
                  If password is blank or dev environment is active, Webin10 will simulate successful email dispatches in the mock logger.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TEMPLATES CATALOG */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">System Email Templates</h3>
                <p className="text-xs text-slate-500">
                  Standard responsive HTML templates available across all gyms and Super Admin broadcasts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(Array.isArray(templates) ? templates : []).map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                        {tpl.category}
                      </span>
                      <FileText className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{tpl.name}</h4>
                    <p className="text-xs text-slate-500 font-mono truncate">{tpl.subject}</p>
                    <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-100 line-clamp-3">
                      {tpl.bodyText || tpl.bodyHtml.replace(/<[^>]*>?/gm, '').slice(0, 140)}...
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setPreviewTemplate(tpl)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview HTML</span>
                    </button>

                    <button
                      onClick={() => {
                        setBroadcastName(`Broadcast: ${tpl.name}`);
                        setBroadcastSubject(tpl.subject);
                        setBroadcastContent(tpl.bodyHtml);
                        setBroadcastModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Send className="w-3 h-3" />
                      <span>Use for Broadcast</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL 1: LAUNCH GYM BROADCAST */}
        {broadcastModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Broadcast Email Campaign to Gyms</h3>
                    <p className="text-xs text-slate-500">Send an instant email announcement to gym owners across India</p>
                  </div>
                </div>
                <button onClick={() => setBroadcastModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {broadcastMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    broadcastMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {broadcastMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{broadcastMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleLaunchBroadcast} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Campaign Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AI Diet Planner Launch"
                      value={broadcastName}
                      onChange={(e) => setBroadcastName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Target Gym Audience *</label>
                    <select
                      value={broadcastAudience}
                      onChange={(e: any) => setBroadcastAudience(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                    >
                      <option value="ALL_GYMS">All Gyms ({gymCounts.all} Reachable)</option>
                      <option value="ACTIVE_GYMS">Active Subscribers Only ({gymCounts.active} Gyms)</option>
                      <option value="INACTIVE_GYMS">Inactive / Trial Gyms Only ({gymCounts.inactive} Gyms)</option>
                      <option value="SPECIFIC_GYM">Specific Gym Tenant...</option>
                    </select>
                  </div>
                </div>

                {broadcastAudience === 'SPECIFIC_GYM' && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Select Specific Gym *</label>
                    <select
                      required
                      value={specificTenantId}
                      onChange={(e) => setSpecificTenantId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Choose Gym Tenant...</option>
                      {gyms.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.ownerName} - {g.email || 'No email'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Subject Line *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Important Update for Webin10 Gym Partners 🚀"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Email HTML Content *</label>
                    <span className="text-[10px] text-indigo-600 font-mono">
                      Tags: {'{{owner_name}}'}, {'{{gym_name}}'}, {'{{platform_name}}'}
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    required
                    placeholder="Write HTML or message content..."
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-[11px] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBroadcastModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={broadcasting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${broadcasting ? 'animate-bounce' : ''}`} />
                    <span>{broadcasting ? 'Sending Broadcast...' : 'Dispatch Broadcast Now'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: SEND DIRECT EMAIL */}
        {directModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-900 text-amber-400 rounded-xl">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Direct Email Dispatch</h3>
                    <p className="text-xs text-slate-500">Send direct 1-to-1 message from Super Admin</p>
                  </div>
                </div>
                <button onClick={() => setDirectModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {directMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    directMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {directMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{directMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSendDirect} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Recipient Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. gymowner@fitzone.com"
                    value={directRecipient}
                    onChange={(e) => setDirectRecipient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Recipient Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={directName}
                    onChange={(e) => setDirectName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urgent Update on Webin10 Account"
                    value={directSubject}
                    onChange={(e) => setDirectSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Body *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type your message..."
                    value={directContent}
                    onChange={(e) => setDirectContent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>

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
                    disabled={directSending}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${directSending ? 'animate-bounce' : ''}`} />
                    <span>{directSending ? 'Sending...' : 'Send Direct Email'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: HTML PREVIEW MODAL */}
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
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-h-[400px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: previewTemplate.bodyHtml }}
              />

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
