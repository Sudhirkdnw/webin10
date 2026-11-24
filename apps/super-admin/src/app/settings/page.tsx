'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
  Sliders,
  FileText,
  Globe,
  CreditCard,
  Home,
  ShieldCheck,
  Share2,
  Mail,
  Globe2,
  Palette,
  Database,
  Network,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Save,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

type TabKey =
  | 'general'
  | 'terms'
  | 'google'
  | 'payment'
  | 'homepage'
  | 'recaptcha'
  | 'social'
  | 'mail'
  | 'custom_domain'
  | 'theme';

interface TabDefinition {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDefinition[] = [
  { key: 'general', label: 'General', icon: Sliders },
  { key: 'terms', label: 'Terms & Conditions', icon: FileText },
  { key: 'google', label: 'Google Configuration', icon: Globe },
  { key: 'payment', label: 'Payment Configuration', icon: CreditCard },
  { key: 'homepage', label: 'Homepage Settings', icon: Home },
  { key: 'recaptcha', label: 'Google reCAPTCHA', icon: ShieldCheck },
  { key: 'social', label: 'Social Settings', icon: Share2 },
  { key: 'mail', label: 'Mail Settings', icon: Mail },
  { key: 'custom_domain', label: 'Custom Domain', icon: Globe2 },
  { key: 'theme', label: 'Theme Color', icon: Palette },
];

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals / Actions state
  const [dbUpgrading, setDbUpgrading] = useState(false);
  const [dbModalResult, setDbModalResult] = useState<any | null>(null);
  const [sitemapGenerating, setSitemapGenerating] = useState(false);
  const [sitemapModalResult, setSitemapModalResult] = useState<any | null>(null);

  // Mail testing state
  const [testMailRecipient, setTestMailRecipient] = useState('');
  const [testMailSending, setTestMailSending] = useState(false);
  const [testMailResult, setTestMailResult] = useState<any | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await apiRequest<Record<string, any>>('/super-admin/settings');
      if (res.success) {
        setSettings(res.data || {});
        // Initialize current tab data
        const currentTabVal = res.data?.[activeTab]?.value || {};
        setFormData(currentTabVal);
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to load system settings' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load system settings' });
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setStatusMsg(null);
    setTestMailResult(null);
    const tabVal = settings?.[tab]?.value || {};
    setFormData({ ...tabVal });
  }

  function handleFieldChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await apiRequest<any>(`/super-admin/settings/${activeTab}`, {
        method: 'PUT',
        body: JSON.stringify({ value: formData }),
      });
      if (res.success) {
        setSettings((prev) => ({
          ...prev,
          [activeTab]: { ...(prev[activeTab] || {}), value: res.data.value },
        }));
        setFormData(res.data.value);
        setStatusMsg({ type: 'success', text: `Saved ${activeTab.toUpperCase()} settings successfully!` });
      } else {
        setStatusMsg({ type: 'error', text: res.error || `Failed to update ${activeTab} settings` });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || `Failed to update ${activeTab} settings` });
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    const tabVal = settings?.[activeTab]?.value || {};
    setFormData({ ...tabVal });
    setStatusMsg({ type: 'success', text: 'Changes discarded. Original values restored.' });
  }

  async function handleUpgradeDatabase() {
    setDbUpgrading(true);
    try {
      const res = await apiRequest<any>('/super-admin/settings/actions/upgrade-database', {
        method: 'POST',
      });
      if (res.success) {
        setDbModalResult(res.data);
      } else {
        setDbModalResult({ success: false, message: res.error || 'Database upgrade failed' });
      }
    } catch (err: any) {
      setDbModalResult({ success: false, message: err.message || 'Database upgrade failed' });
    } finally {
      setDbUpgrading(false);
    }
  }

  async function handleGenerateSitemap() {
    setSitemapGenerating(true);
    try {
      const res = await apiRequest<any>('/super-admin/settings/actions/generate-sitemap', {
        method: 'POST',
      });
      if (res.success) {
        setSitemapModalResult(res.data);
      } else {
        setSitemapModalResult({ success: false, message: res.error || 'Sitemap generation failed' });
      }
    } catch (err: any) {
      setSitemapModalResult({ success: false, message: err.message || 'Sitemap generation failed' });
    } finally {
      setSitemapGenerating(false);
    }
  }

  async function handleSendTestMail() {
    if (!testMailRecipient) {
      alert('Please enter a recipient email address to receive the test email.');
      return;
    }
    setTestMailSending(true);
    setTestMailResult(null);
    try {
      const payload = {
        provider: formData.provider || 'google',
        host: formData.host || 'smtp.gmail.com',
        port: Number(formData.port) || 587,
        secure: Boolean(formData.secure),
        username: formData.username || '',
        password: formData.password || '',
        fromEmail: formData.fromEmail || formData.username,
        fromName: formData.fromName || 'Webin10 Platform',
        replyTo: formData.replyTo || '',
        testRecipient: testMailRecipient,
      };
      const res = await apiRequest<any>('/super-admin/settings/mail/test', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setTestMailResult(res.data);
      } else {
        setTestMailResult({ success: false, message: res.error || 'Failed to send test email' });
      }
    } catch (err: any) {
      setTestMailResult({ success: false, message: err.message || 'Failed to send test email' });
    } finally {
      setTestMailSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Platform System Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure multi-tenant platform baseline defaults, SMTP mailers, payment rails, branding, and dynamic domain rules.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left Tab Navigation, Right Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Vertical Tab Bar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 space-y-1 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Tab Content Panel */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            {/* 1. GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      App Name:*
                    </label>
                    <input
                      type="text"
                      value={formData.appName || ''}
                      onChange={(e) => handleFieldChange('appName', e.target.value)}
                      placeholder="Webin10"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email:*
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="webin10.in@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Phone:*
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="+91 7070799200"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium mt-1 block">Valid Number</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Plan Expire Notification (in Days):*
                    </label>
                    <input
                      type="number"
                      value={formData.planExpireNotificationDays ?? 5}
                      onChange={(e) => handleFieldChange('planExpireNotificationDays', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Address:*
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      placeholder="Narkatiaganj, West Champaran, Bihar, 845455"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Default Language:
                    </label>
                    <select
                      value={formData.defaultLanguage || 'English'}
                      onChange={(e) => handleFieldChange('defaultLanguage', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      User Default Language:
                    </label>
                    <select
                      value={formData.userDefaultLanguage || 'English'}
                      onChange={(e) => handleFieldChange('userDefaultLanguage', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Date-Time Format:
                    </label>
                    <select
                      value={formData.dateTimeFormat || 'Day Month, Year'}
                      onChange={(e) => handleFieldChange('dateTimeFormat', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Day Month, Year">Day Month, Year (24 Nov 2026)</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY (24-11-2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2026-11-24)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Default Country Code:*
                    </label>
                    <input
                      type="text"
                      value={formData.defaultCountryCode || 'in'}
                      onChange={(e) => handleFieldChange('defaultCountryCode', e.target.value)}
                      placeholder="in"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Default Currency Format:
                    </label>
                    <select
                      value={formData.defaultCurrencyFormat || '₹ - INR Indian Rupee'}
                      onChange={(e) => handleFieldChange('defaultCurrencyFormat', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="₹ - INR Indian Rupee">₹ - INR Indian Rupee</option>
                      <option value="$ - USD US Dollar">$ - USD US Dollar</option>
                      <option value="€ - EUR Euro">€ - EUR Euro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Affiliation Amount Or Percentage:*
                    </label>
                    <input
                      type="number"
                      value={formData.affiliationAmount ?? 10}
                      onChange={(e) => handleFieldChange('affiliationAmount', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Affiliation Type:
                    </label>
                    <select
                      value={formData.affiliationType || 'Fix Amount'}
                      onChange={(e) => handleFieldChange('affiliationType', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Fix Amount">Fix Amount</option>
                      <option value="Percentage">Percentage (%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Timezone:
                    </label>
                    <select
                      value={formData.timezone || 'UTC'}
                      onChange={(e) => handleFieldChange('timezone', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>

                {/* Database Upgrade & Generate Sitemap Buttons (matching image) */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleUpgradeDatabase}
                    disabled={dbUpgrading}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                  >
                    {dbUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    <span>Upgrade Database</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateSitemap}
                    disabled={sitemapGenerating}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
                  >
                    {sitemapGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
                    <span>Generate Sitemap</span>
                  </button>
                </div>

                {/* Block Email Domain */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Block Email Domain: <span className="text-slate-500 font-normal">(comma-separated)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.blockEmailDomains || ''}
                    onChange={(e) => handleFieldChange('blockEmailDomains', e.target.value)}
                    placeholder="tempmail.com, 10minutemail.com, maildrop.cc"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Toggle Switches (matching image) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                    <span className="text-sm text-slate-300">Show Currency Behind</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.showCurrencyBehind)}
                      onChange={(e) => handleFieldChange('showCurrencyBehind', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                    <span className="text-sm text-slate-300">Enable Phone Number Input Validation</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.enablePhoneValidation)}
                      onChange={(e) => handleFieldChange('enablePhoneValidation', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                    <span className="text-sm text-slate-300">Allow to edit vCard URL Alias</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.allowEditVcardAlias)}
                      onChange={(e) => handleFieldChange('allowEditVcardAlias', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                    <span className="text-sm text-slate-300">Hide Decimal Values</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.hideDecimalValues)}
                      onChange={(e) => handleFieldChange('hideDecimalValues', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer md:col-span-2">
                    <span className="text-sm text-slate-300">NFC logo required</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.nfcLogoRequired)}
                      onChange={(e) => handleFieldChange('nfcLogoRequired', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 2. TERMS & CONDITIONS TAB */}
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Terms & Conditions:*
                  </label>
                  <textarea
                    rows={6}
                    value={formData.termsAndConditions || ''}
                    onChange={(e) => handleFieldChange('termsAndConditions', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Privacy Policy:*
                  </label>
                  <textarea
                    rows={6}
                    value={formData.privacyPolicy || ''}
                    onChange={(e) => handleFieldChange('privacyPolicy', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Refund & Cancellation Policy:*
                  </label>
                  <textarea
                    rows={4}
                    value={formData.refundPolicy || ''}
                    onChange={(e) => handleFieldChange('refundPolicy', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* 3. GOOGLE CONFIGURATION TAB */}
            {activeTab === 'google' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Google OAuth Client ID:
                    </label>
                    <input
                      type="text"
                      value={formData.clientId || ''}
                      onChange={(e) => handleFieldChange('clientId', e.target.value)}
                      placeholder="e.g. 123456789-xyz.apps.googleusercontent.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Google OAuth Client Secret:
                    </label>
                    <input
                      type="password"
                      value={formData.clientSecret || ''}
                      onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Google Maps API Key:
                    </label>
                    <input
                      type="text"
                      value={formData.mapsApiKey || ''}
                      onChange={(e) => handleFieldChange('mapsApiKey', e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Google Analytics GA4 Tag ID:
                    </label>
                    <input
                      type="text"
                      value={formData.analyticsTagId || ''}
                      onChange={(e) => handleFieldChange('analyticsTagId', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. PAYMENT CONFIGURATION TAB */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Base Platform Currency:
                    </label>
                    <input
                      type="text"
                      value={formData.defaultCurrency || 'INR'}
                      onChange={(e) => handleFieldChange('defaultCurrency', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Standard GST / Tax Percentage (%):
                    </label>
                    <input
                      type="number"
                      value={formData.taxPercentage ?? 18}
                      onChange={(e) => handleFieldChange('taxPercentage', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Platform UPI ID / VPA:
                    </label>
                    <input
                      type="text"
                      value={formData.upiId || ''}
                      onChange={(e) => handleFieldChange('upiId', e.target.value)}
                      placeholder="webin10@upi"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200">Gateway Credentials</h3>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-200">Razorpay Gateway</span>
                      <input
                        type="checkbox"
                        checked={Boolean(formData.razorpayEnabled)}
                        onChange={(e) => handleFieldChange('razorpayEnabled', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                    {formData.razorpayEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <input
                          type="text"
                          value={formData.razorpayKeyId || ''}
                          onChange={(e) => handleFieldChange('razorpayKeyId', e.target.value)}
                          placeholder="rzp_live_key_..."
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                        />
                        <input
                          type="password"
                          value={formData.razorpayKeySecret || ''}
                          onChange={(e) => handleFieldChange('razorpayKeySecret', e.target.value)}
                          placeholder="Razorpay Secret (••••••••)"
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. HOMEPAGE SETTINGS TAB */}
            {activeTab === 'homepage' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Hero Headline Title:
                  </label>
                  <input
                    type="text"
                    value={formData.heroTitle || ''}
                    onChange={(e) => handleFieldChange('heroTitle', e.target.value)}
                    placeholder="Empower Your Business With Webin10"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Hero Subtitle:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.heroSubtitle || ''}
                    onChange={(e) => handleFieldChange('heroSubtitle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      CTA Button Text:
                    </label>
                    <input
                      type="text"
                      value={formData.ctaButtonText || 'Start Free Trial'}
                      onChange={(e) => handleFieldChange('ctaButtonText', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      CTA Button URL:
                    </label>
                    <input
                      type="text"
                      value={formData.ctaButtonUrl || '/register'}
                      onChange={(e) => handleFieldChange('ctaButtonUrl', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      SEO Meta Title:
                    </label>
                    <input
                      type="text"
                      value={formData.seoMetaTitle || ''}
                      onChange={(e) => handleFieldChange('seoMetaTitle', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      SEO Meta Description:
                    </label>
                    <input
                      type="text"
                      value={formData.seoMetaDescription || ''}
                      onChange={(e) => handleFieldChange('seoMetaDescription', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. GOOGLE RECAPTCHA TAB */}
            {activeTab === 'recaptcha' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <span className="font-semibold text-sm text-slate-200">Enable Google reCAPTCHA</span>
                    <p className="text-xs text-slate-500 mt-0.5">Protects registration, login and reset password forms from bot attacks.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(formData.enabled)}
                    onChange={(e) => handleFieldChange('enabled', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      reCAPTCHA Version:
                    </label>
                    <select
                      value={formData.version || 'v2'}
                      onChange={(e) => handleFieldChange('version', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="v2">v2 (I am not a robot checkbox)</option>
                      <option value="v3">v3 (Score-based invisible badge)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Site Key:*
                    </label>
                    <input
                      type="text"
                      value={formData.siteKey || ''}
                      onChange={(e) => handleFieldChange('siteKey', e.target.value)}
                      placeholder="6LeIxacTAAAAA..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Secret Key:*
                    </label>
                    <input
                      type="password"
                      value={formData.secretKey || ''}
                      onChange={(e) => handleFieldChange('secretKey', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. SOCIAL SETTINGS TAB */}
            {activeTab === 'social' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Facebook URL:
                  </label>
                  <input
                    type="url"
                    value={formData.facebookUrl || ''}
                    onChange={(e) => handleFieldChange('facebookUrl', e.target.value)}
                    placeholder="https://facebook.com/webin10"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Twitter / X URL:
                  </label>
                  <input
                    type="url"
                    value={formData.twitterUrl || ''}
                    onChange={(e) => handleFieldChange('twitterUrl', e.target.value)}
                    placeholder="https://twitter.com/webin10"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Instagram URL:
                  </label>
                  <input
                    type="url"
                    value={formData.instagramUrl || ''}
                    onChange={(e) => handleFieldChange('instagramUrl', e.target.value)}
                    placeholder="https://instagram.com/webin10"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    LinkedIn URL:
                  </label>
                  <input
                    type="url"
                    value={formData.linkedinUrl || ''}
                    onChange={(e) => handleFieldChange('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/company/webin10"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    YouTube URL:
                  </label>
                  <input
                    type="url"
                    value={formData.youtubeUrl || ''}
                    onChange={(e) => handleFieldChange('youtubeUrl', e.target.value)}
                    placeholder="https://youtube.com/@webin10"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    WhatsApp Support Number:
                  </label>
                  <input
                    type="text"
                    value={formData.whatsappNumber || ''}
                    onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                    placeholder="+917070799200"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* 8. MAIL SETTINGS TAB (GOOGLE SMTP & CUSTOM SMTP) */}
            {activeTab === 'mail' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 space-y-1">
                  <p className="font-semibold text-emerald-300">Google SMTP / Custom SMTP Support Enabled:</p>
                  <p className="text-slate-300">
                    Use Google SMTP by providing your Gmail address and a 16-character <strong>Google App Password</strong> (from your Google Account Security Settings). All outgoing platform & business emails will dispatch directly through Google SMTP.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Mail Provider Preset:
                    </label>
                    <select
                      value={formData.provider || 'google'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'google') {
                          setFormData((prev) => ({
                            ...prev,
                            provider: 'google',
                            host: 'smtp.gmail.com',
                            port: 587,
                            secure: false,
                          }));
                        } else {
                          handleFieldChange('provider', val);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="google">Google / Gmail SMTP (Recommended)</option>
                      <option value="smtp">Custom SMTP Server</option>
                      <option value="ses">Amazon SES</option>
                      <option value="resend">Resend</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      SMTP Host:*
                    </label>
                    <input
                      type="text"
                      value={formData.host || 'smtp.gmail.com'}
                      onChange={(e) => handleFieldChange('host', e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      SMTP Port:*
                    </label>
                    <input
                      type="number"
                      value={formData.port ?? 587}
                      onChange={(e) => handleFieldChange('port', Number(e.target.value))}
                      placeholder="587"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Encryption (Secure):
                    </label>
                    <select
                      value={formData.secure ? 'true' : 'false'}
                      onChange={(e) => handleFieldChange('secure', e.target.value === 'true')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="false">TLS (Port 587 / STARTTLS)</option>
                      <option value="true">SSL (Port 465)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      SMTP Username / Email:*
                    </label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) => handleFieldChange('username', e.target.value)}
                      placeholder="webin10.in@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      SMTP Password / App Password:*
                    </label>
                    <input
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      From Email Address:*
                    </label>
                    <input
                      type="email"
                      value={formData.fromEmail || ''}
                      onChange={(e) => handleFieldChange('fromEmail', e.target.value)}
                      placeholder="webin10.in@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      From Sender Name:*
                    </label>
                    <input
                      type="text"
                      value={formData.fromName || 'Webin10 Platform'}
                      onChange={(e) => handleFieldChange('fromName', e.target.value)}
                      placeholder="Webin10 Platform"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* SMTP Test Console */}
                <div className="border-t border-slate-800 pt-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>Live SMTP Verification & Test Email</span>
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={testMailRecipient}
                      onChange={(e) => setTestMailRecipient(e.target.value)}
                      placeholder="Enter recipient email (e.g. your email)"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendTestMail}
                      disabled={testMailSending}
                      className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
                    >
                      {testMailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Send Test Email</span>
                    </button>
                  </div>

                  {testMailResult && (
                    <div
                      className={`p-3.5 rounded-xl text-xs border ${
                        testMailResult.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      <p className="font-semibold">{testMailResult.message}</p>
                      {testMailResult.details && (
                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          Message ID: {testMailResult.details.messageId}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 9. CUSTOM DOMAIN TAB */}
            {activeTab === 'custom_domain' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <span className="font-semibold text-sm text-slate-200">Enable Custom Business Domains</span>
                    <p className="text-xs text-slate-500 mt-0.5">Allows tenant businesses to map their own domains (e.g. gym.acmefitness.in).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(formData.enabled)}
                    onChange={(e) => handleFieldChange('enabled', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Platform CNAME Target:
                    </label>
                    <input
                      type="text"
                      value={formData.cnameTarget || 'cname.webin10.com'}
                      onChange={(e) => handleFieldChange('cnameTarget', e.target.value)}
                      placeholder="cname.webin10.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Edge Server IP Address:
                    </label>
                    <input
                      type="text"
                      value={formData.serverIp || '76.76.21.21'}
                      onChange={(e) => handleFieldChange('serverIp', e.target.value)}
                      placeholder="76.76.21.21"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Customer DNS Instructions:
                    </label>
                    <textarea
                      rows={3}
                      value={formData.instructions || ''}
                      onChange={(e) => handleFieldChange('instructions', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 10. THEME COLOR TAB */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Primary Brand Color:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.primaryColor || '#00D09C'}
                        onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor || '#00D09C'}
                        onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Secondary Brand Color:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.secondaryColor || '#0F172A'}
                        onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor || '#0F172A'}
                        onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Accent Color:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.accentColor || '#F59E0B'}
                        onChange={(e) => handleFieldChange('accentColor', e.target.value)}
                        className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                      />
                      <input
                        type="text"
                        value={formData.accentColor || '#F59E0B'}
                        onChange={(e) => handleFieldChange('accentColor', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Platform Logo URL:
                    </label>
                    <input
                      type="url"
                      value={formData.logoUrl || ''}
                      onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
                      placeholder="https://yourcdn.com/logo.png"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Favicon URL:
                    </label>
                    <input
                      type="url"
                      value={formData.faviconUrl || ''}
                      onChange={(e) => handleFieldChange('faviconUrl', e.target.value)}
                      placeholder="https://yourcdn.com/favicon.ico"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save & Discard Buttons (matching image) */}
            <div className="flex items-center gap-3 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save</span>
              </button>

              <button
                type="button"
                onClick={handleDiscard}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Discard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Database Upgrade Modal Result */}
      {dbModalResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">Database Synchronization Result</h3>
              </div>
              <button
                onClick={() => setDbModalResult(null)}
                className="text-slate-500 hover:text-slate-300 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-slate-300">{dbModalResult.message}</p>
              {dbModalResult.stats && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Database Engine:</span>
                    <span className="text-slate-300">{dbModalResult.database}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prisma Version:</span>
                    <span className="text-slate-300">{dbModalResult.schemaVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Query Latency:</span>
                    <span className="text-emerald-400">{dbModalResult.latencyMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Tenants:</span>
                    <span className="text-slate-200">{dbModalResult.stats.tenants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Platform Modules:</span>
                    <span className="text-slate-200">{dbModalResult.stats.platformModules}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDbModalResult(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sitemap Modal Result */}
      {sitemapModalResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-slate-100">Dynamic Sitemap Generated</h3>
              </div>
              <button
                onClick={() => setSitemapModalResult(null)}
                className="text-slate-500 hover:text-slate-300 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-slate-300">{sitemapModalResult.message}</p>
              {sitemapModalResult.summary && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sitemap URL:</span>
                    <span className="text-emerald-400 break-all">{sitemapModalResult.sitemapUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Static Landing Pages:</span>
                    <span className="text-slate-300">{sitemapModalResult.summary.staticPages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tenant Pages Indexed:</span>
                    <span className="text-slate-300">{sitemapModalResult.summary.tenantPages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Indexed URLs:</span>
                    <span className="text-emerald-400 font-bold">{sitemapModalResult.summary.totalUrls}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSitemapModalResult(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
