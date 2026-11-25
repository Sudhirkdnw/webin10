'use client';

import React, { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { ImageUploader } from '@/components/image-uploader';
import { usePlatformSettings } from '@/lib/platform-settings-context';
import { RichTextEditor } from '@/components/rich-text-editor';
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
  AlertTriangle,
  Clock,
  Loader2,
  Send,
  Save,
  RotateCcw,
  Cloud,
  Lock,
  RefreshCw,
  MessageSquare,
  Smartphone,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Download,
} from 'lucide-react';

type TabKey =
  | 'general'
  | 'terms'
  | 'google'
  | 'payment'
  | 'integrations'
  | 'homepage'
  | 'recaptcha'
  | 'social'
  | 'mail'
  | 'custom_domain'
  | 'theme'
  | 'maintenance'
  | 'cloudinary';

interface TabDefinition {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDefinition[] = [
  { key: 'general', label: 'General', icon: Sliders },
  { key: 'terms', label: 'Terms & Conditions', icon: FileText },
  { key: 'google', label: 'Google Configuration', icon: Globe },
  { key: 'payment', label: 'Payment Settings', icon: CreditCard },
  { key: 'integrations', label: 'Integrations & Gateways', icon: Network },
  { key: 'homepage', label: 'Homepage Settings', icon: Home },
  { key: 'recaptcha', label: 'Google reCAPTCHA', icon: ShieldCheck },
  { key: 'social', label: 'Social Settings', icon: Share2 },
  { key: 'mail', label: 'Mail Settings', icon: Mail },
  { key: 'custom_domain', label: 'Custom Domain', icon: Globe2 },
  { key: 'theme', label: 'Theme Color', icon: Palette },
  { key: 'maintenance', label: 'Maintenance Mode', icon: AlertTriangle },
  { key: 'cloudinary', label: 'Cloudinary Storage', icon: Cloud },
];

const DEFAULT_MAINTENANCE_VALUES: Record<string, any> = {
  isEnabled: false,
  title: 'Platform Under Scheduled Maintenance',
  message: 'We are performing critical infrastructure and database upgrades to improve system speed and security. Platform services will resume shortly.',
  estimatedEndTime: '',
  allowedIps: '',
  supportEmail: 'support@webin10.com',
};

const DEFAULT_GENERAL_VALUES: Record<string, any> = {
  appName: 'Webin10',
  email: 'webin10.in@gmail.com',
  phone: '+91 7070799200',
  planExpireNotificationDays: 5,
  address: 'Narkatiaganj, West Champaran, Bihar, 845455',
  defaultLanguage: 'English',
  userDefaultLanguage: 'English',
  dateTimeFormat: 'Day Month, Year',
  defaultCountryCode: 'in',
  defaultCurrencyFormat: '₹ - INR Indian Rupee',
  timezone: 'Asia/Kolkata',
  blockEmailDomains: 'tempmail.com, 10minutemail.com, maildrop.cc, throwawaymail.com',
};

const STANDARD_LEGAL_TEMPLATES = {
  terms: `<h1>TERMS AND CONDITIONS</h1>
<p><strong>Last Updated: October 2026</strong></p>
<h2>1. Introduction</h2>
<p>Welcome to <strong>Webin10</strong>.</p>
<p>These Terms and Conditions ("Terms") govern your access to and use of the Webin10 website, applications, software, APIs, dashboards, integrations, and related services (collectively, the "Service").</p>
<p>Webin10 is a cloud-based, multi-tenant business management and automation platform that enables businesses to manage their operations, customers, employees, communications, payments, marketing campaigns, reports, and business workflows through a centralized platform.</p>
<h2>2. Tenant Account & Responsibilities</h2>
<p>By creating a tenant workspace on Webin10, you represent that you are an authorized representative of your business and have the authority to bind the entity to these Terms.</p>
<ul>
  <li>You must maintain the confidentiality of your account credentials and multi-factor authentication (MFA).</li>
  <li>You are solely responsible for all activities and WhatsApp/Email messages sent from your tenant workspace.</li>
  <li>You agree not to use the platform for unlawful, fraudulent, or harassing messaging.</li>
</ul>
<h2>3. Subscription Fees & Billing</h2>
<p>Access to Webin10 modules is provided on a recurring subscription basis (Monthly or Annually). All fees are exclusive of applicable Goods and Services Tax (GST 18%) unless stated otherwise.</p>
<h2>4. WhatsApp & Communication Compliance</h2>
<p>Users must comply with Meta WhatsApp Cloud API policies and Indian Telecom Regulations (TRAI / DLT) when sending automated broadcast notifications to their gym members.</p>
<h2>5. Governing Law & Jurisdiction</h2>
<p>These Terms shall be governed by and construed in accordance with the laws of India, under the jurisdiction of courts in New Delhi / Bihar.</p>`,

  privacy: `<h1>PRIVACY POLICY</h1>
<p><strong>Last Updated: October 2026</strong></p>
<h2>1. Overview</h2>
<p>At <strong>Webin10</strong>, we respect your privacy and are committed to safeguarding the personal data of our business tenants and their end customers in compliance with the Information Technology Act, 2000 and applicable data protection regulations.</p>
<h2>2. Information We Collect</h2>
<ul>
  <li><strong>Account Information:</strong> Business name, owner name, email address, phone number, GSTIN, and billing address.</li>
  <li><strong>Tenant Operational Data:</strong> Customer rosters, attendance logs, subscription records, and communication logs.</li>
  <li><strong>Usage & Telemetry:</strong> Log files, browser types, IP addresses, and performance metrics.</li>
</ul>
<h2>3. How We Use Information</h2>
<p>We use your information solely to provide, maintain, and optimize the Webin10 platform, process transactions, dispatch authorized WhatsApp/Email notices, and prevent fraud.</p>
<h2>4. Data Security</h2>
<p>All sensitive credentials and database records are encrypted using industry-standard AES-256 and SSL/TLS transmission protocols.</p>`,

  refund: `<h1>REFUND AND CANCELLATION POLICY</h1>
<p><strong>Last Updated: October 2026</strong></p>
<h2>1. Subscription Cancellation</h2>
<p>You may cancel your Webin10 SaaS subscription at any time directly through your Super Admin or Business Admin billing dashboard. Upon cancellation, your workspace will remain active until the end of your current paid billing period.</p>
<h2>2. Refund Eligibility</h2>
<ul>
  <li><strong>New Subscriptions:</strong> We offer a 7-day money-back guarantee for initial annual plan purchases if you are unsatisfied with our platform.</li>
  <li><strong>Renewal Billing:</strong> Subscriptions that auto-renew are generally non-refundable once the billing cycle begins. Please cancel prior to the renewal date.</li>
  <li><strong>Usage-Based Add-ons:</strong> Consumed WhatsApp messaging credits and SMS gateway charges are non-refundable.</li>
</ul>
<h2>3. Refund Processing</h2>
<p>Approved refunds are credited back to the original payment method (Bank Account, UPI, or Card via Razorpay/Cashfree) within 5 to 7 business days.</p>`,
};

const THEME_PRESETS = [
  {
    name: 'Webin10 Emerald',
    tag: 'Signature Fintech',
    primary: '#00D09C',
    secondary: '#0F172A',
    accent: '#F59E0B',
  },
  {
    name: 'Enterprise Indigo',
    tag: 'Corporate SaaS',
    primary: '#4F46E5',
    secondary: '#1E1B4B',
    accent: '#06B6D4',
  },
  {
    name: 'Royal Sapphire',
    tag: 'Trustworthy Blue',
    primary: '#2563EB',
    secondary: '#0F172A',
    accent: '#38BDF8',
  },
  {
    name: 'Purple SaaS',
    tag: 'Creative Platform',
    primary: '#7C3AED',
    secondary: '#1E1B4B',
    accent: '#EC4899',
  },
  {
    name: 'Crimson Ember',
    tag: 'Vibrant Retail',
    primary: '#E11D48',
    secondary: '#1C1917',
    accent: '#F97316',
  },
  {
    name: 'Midnight Dark',
    tag: 'Cyber Neon',
    primary: '#0EA5E9',
    secondary: '#020617',
    accent: '#10B981',
  },
];

export default function SystemSettingsPage() {
  const {
    updateSettings: updateGlobalSettings,
    updateTheme,
    appName: currentAppName,
    logoUrl: currentLogoUrl,
    primaryColor: currentPrimaryColor,
    colorMode,
    setColorMode,
  } = usePlatformSettings();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Policy tab state (terms | privacy | refund)
  const [policyTab, setPolicyTab] = useState<'terms' | 'privacy' | 'refund'>('terms');
  const [previewPolicyModal, setPreviewPolicyModal] = useState(false);

  // Modals / Actions state
  const [dbUpgrading, setDbUpgrading] = useState(false);
  const [dbModalResult, setDbModalResult] = useState<any | null>(null);
  const [sitemapGenerating, setSitemapGenerating] = useState(false);
  const [sitemapModalResult, setSitemapModalResult] = useState<any | null>(null);
  const [backupExporting, setBackupExporting] = useState(false);
  const [backupModalResult, setBackupModalResult] = useState<any | null>(null);

  // Mail testing state
  const [testMailRecipient, setTestMailRecipient] = useState('');
  const [testMailSending, setTestMailSending] = useState(false);
  const [testMailResult, setTestMailResult] = useState<any | null>(null);

  // Cloudinary testing state
  const [testingCloudinary, setTestingCloudinary] = useState(false);
  const [cloudinaryResult, setCloudinaryResult] = useState<any | null>(null);

  // Integrations & Gateways state
  const [integrationsList, setIntegrationsList] = useState<any[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [integrationTestResult, setIntegrationTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);
  const [providerForms, setProviderForms] = useState<Record<string, any>>({
    RAZORPAY: { isEnabled: true, isTestMode: true, keyId: '', keySecret: '', webhookSecret: '' },
    CASHFREE: { isEnabled: false, isTestMode: true, appId: '', secretKey: '' },
    META_WHATSAPP: { isEnabled: false, isTestMode: true, phoneNumberId: '', wabaId: '', accessToken: '', webhookVerifyToken: '' },
    MSG91: { isEnabled: false, isTestMode: true, authKey: '', senderId: '', dltTemplateId: '' },
    AWS_SES: { isEnabled: false, isTestMode: true, accessKeyId: '', secretAccessKey: '', region: 'ap-south-1' },
    RESEND: { isEnabled: false, isTestMode: true, apiKey: '' },
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Check URL query tab parameter
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab && TABS.some((t) => t.key === urlTab)) {
        setActiveTab(urlTab as TabKey);
      }
    }
    fetchSettings();
    fetchIntegrations();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await apiRequest<Record<string, any>>('/super-admin/settings');
      if (res.success) {
        setSettings(res.data || {});
        const currentTabVal = res.data?.[activeTab]?.value || {};
        const generalVal = res.data?.general?.value;
        if (generalVal?.appName) {
          updateGlobalSettings(generalVal);
        }
        const themeVal = res.data?.theme?.value;
        if (themeVal) {
          updateTheme(themeVal);
        }
        setFormData(activeTab === 'general' ? { ...DEFAULT_GENERAL_VALUES, ...currentTabVal } : activeTab === 'maintenance' ? { ...DEFAULT_MAINTENANCE_VALUES, ...currentTabVal } : currentTabVal);
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to load system settings' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load system settings' });
    } finally {
      setLoading(false);
    }
  }

  async function fetchIntegrations() {
    setLoadingIntegrations(true);
    try {
      const res = await apiRequest<any[]>('/super-admin/integrations');
      if (res.success && Array.isArray(res.data)) {
        setIntegrationsList(res.data);
        // Populate form defaults from existing integrations
        setProviderForms((prev) => {
          const next = { ...prev };
          for (const item of res.data) {
            const current = prev[item.provider] || {};
            const itemCreds = { ...(item.maskedCredentials || {}) };
            for (const [k, v] of Object.entries(current)) {
              if (typeof v === 'string' && !v.includes('****') && v.length > 0) {
                itemCreds[k] = v;
              }
            }
            next[item.provider] = {
              isEnabled: item.isEnabled ?? false,
              isTestMode: item.isTestMode ?? true,
              ...itemCreds,
            };
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to load platform integrations catalogue', err);
    } finally {
      setLoadingIntegrations(false);
    }
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setStatusMsg(null);
    setTestMailResult(null);
    setCloudinaryResult(null);
    setIntegrationTestResult(null);
    const tabVal = settings?.[tab]?.value || {};
    setFormData(tab === 'general' ? { ...DEFAULT_GENERAL_VALUES, ...tabVal } : tab === 'maintenance' ? { ...DEFAULT_MAINTENANCE_VALUES, ...tabVal } : { ...tabVal });
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
        const savedVal = res.data?.value || formData;
        setSettings((prev) => ({
          ...prev,
          [activeTab]: { ...(prev[activeTab] || {}), value: savedVal },
        }));
        setFormData(savedVal);
        if (activeTab === 'general') {
          updateGlobalSettings(savedVal);
        }
        if (activeTab === 'theme') {
          updateTheme(savedVal);
        }
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
    setFormData(activeTab === 'general' ? { ...DEFAULT_GENERAL_VALUES, ...tabVal } : activeTab === 'maintenance' ? { ...DEFAULT_MAINTENANCE_VALUES, ...tabVal } : { ...tabVal });
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

  async function handleExportBackup() {
    setBackupExporting(true);
    try {
      const res = await apiRequest<any>('/super-admin/settings/actions/export-backup', {
        method: 'POST',
      });
      if (res.success && res.data) {
        setBackupModalResult(res.data);

        // Trigger automatic file download in browser
        const jsonStr = JSON.stringify(res.data.backup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = res.data.filename || `webin10-backup-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert(res.error || 'Failed to export platform backup snapshot');
      }
    } catch (err: any) {
      alert(err.message || 'Error exporting system backup');
    } finally {
      setBackupExporting(false);
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

  async function handleTestCloudinary() {
    setTestingCloudinary(true);
    setCloudinaryResult(null);
    try {
      const res = await apiRequest<any>('/uploads/test-connection', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        setCloudinaryResult(res.data);
      } else {
        setCloudinaryResult({ success: false, message: res.error || 'Failed to ping Cloudinary' });
      }
    } catch (err: any) {
      setCloudinaryResult({ success: false, message: err.message || 'Failed to ping Cloudinary' });
    } finally {
      setTestingCloudinary(false);
    }
  }

  // Integration provider helpers
  function updateProviderField(provider: string, field: string, value: any) {
    setProviderForms((prev) => ({
      ...prev,
      [provider]: {
        ...(prev[provider] || {}),
        [field]: value,
      },
    }));
  }

  async function handleSaveIntegration(provider: string) {
    setSavingProvider(provider);
    setIntegrationTestResult(null);
    const form = providerForms[provider] || {};
    const { isEnabled, isTestMode, ...credentials } = form;

    const cleanCredentials = { ...credentials };
    Object.keys(cleanCredentials).forEach((k) => {
      if (typeof cleanCredentials[k] === 'string' && (cleanCredentials[k].includes('****') || cleanCredentials[k] === '******')) {
        delete cleanCredentials[k];
      }
    });

    try {
      const res = await apiRequest<any>('/super-admin/integrations', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          isEnabled: Boolean(isEnabled),
          isTestMode: Boolean(isTestMode),
          credentials: cleanCredentials,
        }),
      });

      if (res.success) {
        setStatusMsg({ type: 'success', text: `Saved ${provider} configuration successfully!` });
        fetchIntegrations();
      } else {
        setStatusMsg({ type: 'error', text: res.error || `Failed to save ${provider} gateway` });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || `Failed to save ${provider}` });
    } finally {
      setSavingProvider(null);
    }
  }

  async function handleTestIntegration(provider: string) {
    setTestingProvider(provider);
    setIntegrationTestResult(null);
    try {
      const form = { ...(providerForms[provider] || {}) };
      Object.keys(form).forEach((k) => {
        if (typeof form[k] === 'string' && (form[k].includes('****') || form[k] === '******')) {
          delete form[k];
        }
      });

      const res = await apiRequest<any>(`/super-admin/integrations/${provider}/test`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (res.success && res.data?.healthStatus === 'HEALTHY') {
        setIntegrationTestResult({ provider, success: true, message: res.data.message || 'Connection verified successfully!' });
        fetchIntegrations();
      } else {
        setIntegrationTestResult({ provider, success: false, message: res.data?.message || res.error || 'Test connection failed' });
      }
    } catch (err: any) {
      setIntegrationTestResult({ provider, success: false, message: err.message || 'Test connection failed' });
    } finally {
      setTestingProvider(null);
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Platform System Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure multi-tenant baseline defaults, payment gateways, WhatsApp & SMS rails, branding, and dynamic domain rules
          </p>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {/* Main Grid: Left Tabs, Right Form Card */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Vertical Tab Bar */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-800 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Tab Content Card */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-slate-900 dark:text-slate-100">
            {/* 1. GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      App Name:*
                    </label>
                    <input
                      type="text"
                      value={formData.appName ?? 'Webin10'}
                      onChange={(e) => handleFieldChange('appName', e.target.value)}
                      placeholder="Webin10"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Branding across customer portals, bills & emails</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email:*
                    </label>
                    <input
                      type="email"
                      value={formData.email ?? 'webin10.in@gmail.com'}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="webin10.in@gmail.com"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Official support & platform reply-to email</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone:*
                    </label>
                    <input
                      type="text"
                      value={formData.phone ?? '+91 7070799200'}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="+91 7070799200"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                    {(() => {
                      const clean = String(formData.phone || '').replace(/\D/g, '');
                      const isValid = clean.length >= 10 && clean.length <= 13;
                      return (
                        <span className={`text-[11px] font-medium mt-1 flex items-center gap-1 ${isValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isValid ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                              Valid Number (Ready for WhatsApp & SMS Gateway)
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                              Enter valid 10-digit number with country code (+91)
                            </>
                          )}
                        </span>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Plan Expire Notification (in Days):*
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={formData.planExpireNotificationDays ?? 5}
                      onChange={(e) => handleFieldChange('planExpireNotificationDays', Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Auto-alerts gym owners {formData.planExpireNotificationDays ?? 5} days before plan expiry
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Address:*
                    </label>
                    <input
                      type="text"
                      value={formData.address ?? 'Narkatiaganj, West Champaran, Bihar, 845455'}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      placeholder="Narkatiaganj, West Champaran, Bihar, 845455"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Appears on tax invoices, billing receipts, and legal notices</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Default Language:
                    </label>
                    <select
                      value={formData.defaultLanguage || 'English'}
                      onChange={(e) => handleFieldChange('defaultLanguage', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="English">English (Global / Indian SaaS)</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                      <option value="Hinglish">Hinglish (English + Hindi Hybrid)</option>
                      <option value="Spanish">Spanish (Español)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      User Default Language:
                    </label>
                    <select
                      value={formData.userDefaultLanguage || 'English'}
                      onChange={(e) => handleFieldChange('userDefaultLanguage', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                      <option value="Hinglish">Hinglish</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Date-Time Format:
                    </label>
                    <select
                      value={formData.dateTimeFormat || 'Day Month, Year'}
                      onChange={(e) => handleFieldChange('dateTimeFormat', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Day Month, Year">Day Month, Year (25 Nov 2026)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (25/11/2026 - Indian Banking Standard)</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY (25-11-2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2026-11-25 - ISO Database)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (11/25/2026 - US Standard)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Default Country Code:*
                    </label>
                    <input
                      type="text"
                      value={formData.defaultCountryCode ?? 'in'}
                      onChange={(e) => handleFieldChange('defaultCountryCode', e.target.value)}
                      placeholder="in"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">ISO 3166-1 alpha-2 code (e.g. IN for India)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Default Currency Format:
                    </label>
                    <select
                      value={formData.defaultCurrencyFormat || '₹ - INR Indian Rupee'}
                      onChange={(e) => handleFieldChange('defaultCurrencyFormat', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      <option value="₹ - INR Indian Rupee">₹ - INR Indian Rupee (India)</option>
                      <option value="$ - USD US Dollar">$ - USD US Dollar</option>
                      <option value="€ - EUR Euro">€ - EUR Euro</option>
                      <option value="£ - GBP British Pound">£ - GBP British Pound</option>
                      <option value="AED - UAE Dirham">AED - United Arab Emirates Dirham</option>
                      <option value="CAD - Canadian Dollar">CAD - Canadian Dollar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Timezone:
                    </label>
                    <select
                      value={formData.timezone || 'Asia/Kolkata'}
                      onChange={(e) => handleFieldChange('timezone', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30) - India (Recommended)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST +04:00) - UAE / Gulf</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT +08:00) - Singapore</option>
                      <option value="Europe/London">Europe/London (GMT/BST +00:00) - UK</option>
                      <option value="America/New_York">America/New_York (EST -05:00) - US East</option>
                      <option value="America/Chicago">America/Chicago (CST -06:00) - US Central</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST -08:00) - US West</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST +10:00) - Australia</option>
                    </select>
                  </div>
                </div>

                {/* Live Enterprise Simulation / Preview Bar */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      Live Dynamic System Settings Preview
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                      Active In Platform
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Platform Brand</span>
                      <p className="font-bold text-slate-900 text-sm truncate">{formData.appName || 'Webin10'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{formData.email || 'webin10.in@gmail.com'}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{formData.phone || '+91 7070799200'}</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Billing & Invoicing</span>
                      <p className="font-bold text-slate-900 text-sm">
                        {(formData.defaultCurrencyFormat || '₹').split(' - ')[0]} 1,999.00
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Date: {formData.dateTimeFormat === 'DD/MM/YYYY' ? '25/11/2026' : formData.dateTimeFormat === 'YYYY-MM-DD' ? '2026-11-25' : '25 Nov 2026'}
                      </p>
                      <p className="text-[11px] text-indigo-600 font-semibold">
                        Zone: {formData.timezone || 'Asia/Kolkata'}
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Automation Policy</span>
                      <p className="font-bold text-slate-900 text-sm">
                        {formData.planExpireNotificationDays ?? 5} Days Expiry Notice
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Loc: {formData.address || 'Narkatiaganj, Bihar'}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-semibold">
                        Lang: {formData.defaultLanguage || 'English'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Database Upgrade & Sitemap Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleUpgradeDatabase}
                    disabled={dbUpgrading}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {dbUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    <span>Upgrade Database</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateSitemap}
                    disabled={sitemapGenerating}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {sitemapGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
                    <span>Generate Sitemap</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportBackup}
                    disabled={backupExporting}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {backupExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>Export Backup (JSON)</span>
                  </button>
                </div>

                {/* Block Email Domain */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Block Email Domain: <span className="text-slate-400 font-normal">(comma-separated)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.blockEmailDomains || ''}
                    onChange={(e) => handleFieldChange('blockEmailDomains', e.target.value)}
                    placeholder="tempmail.com, 10minutemail.com, maildrop.cc"
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Bottom Save & Discard Buttons */}
                <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Discard Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. TERMS & CONDITIONS / POLICIES TAB (RICH WYSIWYG EDITOR) */}
            {activeTab === 'terms' && (
              <div className="space-y-5">
                {/* Policy Sub-Navigation & Quick Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPolicyTab('terms')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        policyTab === 'terms'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Terms & Conditions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPolicyTab('privacy')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        policyTab === 'privacy'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Privacy Policy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPolicyTab('refund')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        policyTab === 'refund'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Refund & Cancellation</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const targetField =
                          policyTab === 'terms'
                            ? 'termsAndConditions'
                            : policyTab === 'privacy'
                            ? 'privacyPolicy'
                            : 'refundPolicy';
                        handleFieldChange(targetField, STANDARD_LEGAL_TEMPLATES[policyTab]);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Load standard legally compliant template"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Load Standard Template</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewPolicyModal(true)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Preview how this policy looks to public users"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Public Preview</span>
                    </button>
                  </div>
                </div>

                {/* Policy Description Header */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {policyTab === 'terms' && 'Master Terms & Conditions of Service'}
                    {policyTab === 'privacy' && 'Tenant & Customer Data Privacy Policy'}
                    {policyTab === 'refund' && 'Subscription Refund & Cancellation Guidelines'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {policyTab === 'terms' && 'Defines the legal relationship between Webin10 SaaS platform and subscribing gym businesses'}
                    {policyTab === 'privacy' && 'Specifies how personal data, attendance records, and gym communications are protected'}
                    {policyTab === 'refund' && 'Outlines money-back guarantees, plan cancellations, and refund processing turnaround times'}
                  </p>
                </div>

                {/* Rich WYSIWYG Editor Instance */}
                {policyTab === 'terms' && (
                  <RichTextEditor
                    value={formData.termsAndConditions || STANDARD_LEGAL_TEMPLATES.terms}
                    onChange={(val) => handleFieldChange('termsAndConditions', val)}
                    placeholder="Draft your Terms & Conditions..."
                    minHeight="420px"
                  />
                )}

                {policyTab === 'privacy' && (
                  <RichTextEditor
                    value={formData.privacyPolicy || STANDARD_LEGAL_TEMPLATES.privacy}
                    onChange={(val) => handleFieldChange('privacyPolicy', val)}
                    placeholder="Draft your Privacy Policy..."
                    minHeight="420px"
                  />
                )}

                {policyTab === 'refund' && (
                  <RichTextEditor
                    value={formData.refundPolicy || STANDARD_LEGAL_TEMPLATES.refund}
                    onChange={(val) => handleFieldChange('refundPolicy', val)}
                    placeholder="Draft your Refund & Cancellation Policy..."
                    minHeight="420px"
                  />
                )}

                {/* Action Save Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving...' : 'Save All Legal Policies'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={saving}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Discard Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. GOOGLE CONFIGURATION TAB */}
            {activeTab === 'google' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Google OAuth Client ID:
                    </label>
                    <input
                      type="text"
                      value={formData.clientId || ''}
                      onChange={(e) => handleFieldChange('clientId', e.target.value)}
                      placeholder="123456789-xyz.apps.googleusercontent.com"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Google OAuth Client Secret:
                    </label>
                    <input
                      type="password"
                      value={formData.clientSecret || ''}
                      onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Google Maps API Key:
                    </label>
                    <input
                      type="text"
                      value={formData.mapsApiKey || ''}
                      onChange={(e) => handleFieldChange('mapsApiKey', e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Google Analytics GA4 Tag ID:
                    </label>
                    <input
                      type="text"
                      value={formData.analyticsTagId || ''}
                      onChange={(e) => handleFieldChange('analyticsTagId', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Google Config'}
                  </button>
                </div>
              </div>
            )}

            {/* 4. PAYMENT SETTINGS TAB */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Base Platform Currency:
                    </label>
                    <input
                      type="text"
                      value={formData.defaultCurrency || 'INR'}
                      onChange={(e) => handleFieldChange('defaultCurrency', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Standard GST / Tax Percentage (%):
                    </label>
                    <input
                      type="number"
                      value={formData.taxPercentage ?? 18}
                      onChange={(e) => handleFieldChange('taxPercentage', Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Platform UPI ID / VPA:
                    </label>
                    <input
                      type="text"
                      value={formData.upiId || ''}
                      onChange={(e) => handleFieldChange('upiId', e.target.value)}
                      placeholder="webin10@upi"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Payment Defaults'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('integrations')}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    Configure Gateway Credentials &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* 5. INTEGRATIONS & GATEWAYS TAB (CONSOLIDATED HERE) */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Payment & Communication Gateways</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure API keys, webhooks, sandbox mode, and test live connections for payment rails and messaging gateways.
                  </p>
                </div>

                {integrationTestResult && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
                      integrationTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {integrationTestResult.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>
                        <strong>[{integrationTestResult.provider}]:</strong> {integrationTestResult.message}
                      </span>
                    </div>
                    <button onClick={() => setIntegrationTestResult(null)} className="text-xs font-semibold hover:underline">
                      Dismiss
                    </button>
                  </div>
                )}

                {/* 1. RAZORPAY GATEWAY */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        RZP
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Razorpay Payment Gateway</h3>
                        <p className="text-xs text-slate-500">UPI, Cards, NetBanking, Subscriptions &amp; Payment Links</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(providerForms.RAZORPAY?.isTestMode)}
                          onChange={(e) => updateProviderField('RAZORPAY', 'isTestMode', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                        />
                        <span>Sandbox Mode</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(providerForms.RAZORPAY?.isEnabled)}
                          onChange={(e) => updateProviderField('RAZORPAY', 'isEnabled', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300"
                        />
                        <span className={providerForms.RAZORPAY?.isEnabled ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          {providerForms.RAZORPAY?.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Razorpay Key ID:*
                      </label>
                      <input
                        type="text"
                        value={providerForms.RAZORPAY?.keyId || ''}
                        onChange={(e) => updateProviderField('RAZORPAY', 'keyId', e.target.value)}
                        placeholder="rzp_test_..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Razorpay Key Secret:*
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets.rzpSecret ? 'text' : 'password'}
                          value={providerForms.RAZORPAY?.keySecret || ''}
                          onChange={(e) => updateProviderField('RAZORPAY', 'keySecret', e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets((s) => ({ ...s, rzpSecret: !s.rzpSecret }))}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showSecrets.rzpSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Webhook Secret:
                      </label>
                      <input
                        type="password"
                        value={providerForms.RAZORPAY?.webhookSecret || ''}
                        onChange={(e) => updateProviderField('RAZORPAY', 'webhookSecret', e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={testingProvider === 'RAZORPAY'}
                      onClick={() => handleTestIntegration('RAZORPAY')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingProvider === 'RAZORPAY' ? 'animate-spin' : ''}`} />
                      <span>{testingProvider === 'RAZORPAY' ? 'Testing...' : 'Test Connection'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={savingProvider === 'RAZORPAY'}
                      onClick={() => handleSaveIntegration('RAZORPAY')}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs disabled:opacity-50"
                    >
                      {savingProvider === 'RAZORPAY' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Gateway</span>
                    </button>
                  </div>
                </div>

                {/* 2. CASHFREE GATEWAY */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        CF
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Cashfree Payments</h3>
                        <p className="text-xs text-slate-500">Auto-collect, Instant UPI Payouts &amp; Split Settlements</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(providerForms.CASHFREE?.isTestMode)}
                          onChange={(e) => updateProviderField('CASHFREE', 'isTestMode', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                        />
                        <span>Sandbox Mode</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(providerForms.CASHFREE?.isEnabled)}
                          onChange={(e) => updateProviderField('CASHFREE', 'isEnabled', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300"
                        />
                        <span className={providerForms.CASHFREE?.isEnabled ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          {providerForms.CASHFREE?.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cashfree App ID:*
                      </label>
                      <input
                        type="text"
                        value={providerForms.CASHFREE?.appId || ''}
                        onChange={(e) => updateProviderField('CASHFREE', 'appId', e.target.value)}
                        placeholder="CF_app_..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cashfree Secret Key:*
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets.cfSecret ? 'text' : 'password'}
                          value={providerForms.CASHFREE?.secretKey || ''}
                          onChange={(e) => updateProviderField('CASHFREE', 'secretKey', e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets((s) => ({ ...s, cfSecret: !s.cfSecret }))}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showSecrets.cfSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={testingProvider === 'CASHFREE'}
                      onClick={() => handleTestIntegration('CASHFREE')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingProvider === 'CASHFREE' ? 'animate-spin' : ''}`} />
                      <span>{testingProvider === 'CASHFREE' ? 'Testing...' : 'Test Connection'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={savingProvider === 'CASHFREE'}
                      onClick={() => handleSaveIntegration('CASHFREE')}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs disabled:opacity-50"
                    >
                      {savingProvider === 'CASHFREE' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Gateway</span>
                    </button>
                  </div>
                </div>

                {/* 3. META WHATSAPP CLOUD API */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Meta WhatsApp Cloud API</h3>
                        <p className="text-xs text-slate-500">Automated membership renewals, payment receipts &amp; class schedules</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(providerForms.META_WHATSAPP?.isTestMode)}
                          onChange={(e) => updateProviderField('META_WHATSAPP', 'isTestMode', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                        />
                        <span>Sandbox Mode</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(providerForms.META_WHATSAPP?.isEnabled)}
                          onChange={(e) => updateProviderField('META_WHATSAPP', 'isEnabled', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300"
                        />
                        <span className={providerForms.META_WHATSAPP?.isEnabled ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          {providerForms.META_WHATSAPP?.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number ID:*
                      </label>
                      <input
                        type="text"
                        value={providerForms.META_WHATSAPP?.phoneNumberId || ''}
                        onChange={(e) => updateProviderField('META_WHATSAPP', 'phoneNumberId', e.target.value)}
                        placeholder="103948574..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        WhatsApp Business Account ID (WABA ID):*
                      </label>
                      <input
                        type="text"
                        value={providerForms.META_WHATSAPP?.wabaId || ''}
                        onChange={(e) => updateProviderField('META_WHATSAPP', 'wabaId', e.target.value)}
                        placeholder="193847291..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        System User Permanent Access Token:*
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets.waToken ? 'text' : 'password'}
                          value={providerForms.META_WHATSAPP?.accessToken || ''}
                          onChange={(e) => updateProviderField('META_WHATSAPP', 'accessToken', e.target.value)}
                          placeholder="EAA..."
                          className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets((s) => ({ ...s, waToken: !s.waToken }))}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showSecrets.waToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Webhook Verification Token:
                      </label>
                      <input
                        type="text"
                        value={providerForms.META_WHATSAPP?.webhookVerifyToken || ''}
                        onChange={(e) => updateProviderField('META_WHATSAPP', 'webhookVerifyToken', e.target.value)}
                        placeholder="webin10_verify_secret"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={testingProvider === 'META_WHATSAPP'}
                      onClick={() => handleTestIntegration('META_WHATSAPP')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingProvider === 'META_WHATSAPP' ? 'animate-spin' : ''}`} />
                      <span>{testingProvider === 'META_WHATSAPP' ? 'Testing...' : 'Test Connection'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={savingProvider === 'META_WHATSAPP'}
                      onClick={() => handleSaveIntegration('META_WHATSAPP')}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs disabled:opacity-50"
                    >
                      {savingProvider === 'META_WHATSAPP' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Gateway</span>
                    </button>
                  </div>
                </div>

                {/* 4. MSG91 SMS GATEWAY */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">MSG91 Indian SMS Gateway</h3>
                        <p className="text-xs text-slate-500">DLT approved transactional OTPs and critical alerts</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(providerForms.MSG91?.isEnabled)}
                          onChange={(e) => updateProviderField('MSG91', 'isEnabled', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300"
                        />
                        <span className={providerForms.MSG91?.isEnabled ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          {providerForms.MSG91?.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Auth Key:*
                      </label>
                      <input
                        type="password"
                        value={providerForms.MSG91?.authKey || ''}
                        onChange={(e) => updateProviderField('MSG91', 'authKey', e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        DLT Sender ID (6 Chars):*
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={providerForms.MSG91?.senderId || ''}
                        onChange={(e) => updateProviderField('MSG91', 'senderId', e.target.value.toUpperCase())}
                        placeholder="WBNTEN"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Default DLT Template ID:
                      </label>
                      <input
                        type="text"
                        value={providerForms.MSG91?.dltTemplateId || ''}
                        onChange={(e) => updateProviderField('MSG91', 'dltTemplateId', e.target.value)}
                        placeholder="120716..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={savingProvider === 'MSG91'}
                      onClick={() => handleSaveIntegration('MSG91')}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs disabled:opacity-50"
                    >
                      {savingProvider === 'MSG91' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Gateway</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. HOMEPAGE SETTINGS TAB */}
            {activeTab === 'homepage' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Hero Headline Title:
                  </label>
                  <input
                    type="text"
                    value={formData.heroTitle || ''}
                    onChange={(e) => handleFieldChange('heroTitle', e.target.value)}
                    placeholder="Empower Your Business With Webin10"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Hero Subtitle:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.heroSubtitle || ''}
                    onChange={(e) => handleFieldChange('heroSubtitle', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      CTA Button Text:
                    </label>
                    <input
                      type="text"
                      value={formData.ctaButtonText || 'Start Free Trial'}
                      onChange={(e) => handleFieldChange('ctaButtonText', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      CTA Button URL:
                    </label>
                    <input
                      type="text"
                      value={formData.ctaButtonUrl || '/register'}
                      onChange={(e) => handleFieldChange('ctaButtonUrl', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      SEO Meta Title:
                    </label>
                    <input
                      type="text"
                      value={formData.seoMetaTitle || ''}
                      onChange={(e) => handleFieldChange('seoMetaTitle', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      SEO Meta Description:
                    </label>
                    <input
                      type="text"
                      value={formData.seoMetaDescription || ''}
                      onChange={(e) => handleFieldChange('seoMetaDescription', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Homepage Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* 7. GOOGLE RECAPTCHA TAB */}
            {activeTab === 'recaptcha' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-semibold text-sm text-slate-900">Enable Google reCAPTCHA</span>
                    <p className="text-xs text-slate-500 mt-0.5">Protects registration, login and reset password forms from bot abuse</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(formData.enabled)}
                    onChange={(e) => handleFieldChange('enabled', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      reCAPTCHA Version:
                    </label>
                    <select
                      value={formData.version || 'v2'}
                      onChange={(e) => handleFieldChange('version', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="v2">v2 (I am not a robot checkbox)</option>
                      <option value="v3">v3 (Score-based invisible badge)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Site Key:*
                    </label>
                    <input
                      type="text"
                      value={formData.siteKey || ''}
                      onChange={(e) => handleFieldChange('siteKey', e.target.value)}
                      placeholder="6LeIxacTAAAAA..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Secret Key:*
                    </label>
                    <input
                      type="password"
                      value={formData.secretKey || ''}
                      onChange={(e) => handleFieldChange('secretKey', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save reCAPTCHA'}
                  </button>
                </div>
              </div>
            )}

            {/* 8. SOCIAL SETTINGS TAB */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Facebook URL:
                    </label>
                    <input
                      type="url"
                      value={formData.facebookUrl || ''}
                      onChange={(e) => handleFieldChange('facebookUrl', e.target.value)}
                      placeholder="https://facebook.com/webin10"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Twitter / X URL:
                    </label>
                    <input
                      type="url"
                      value={formData.twitterUrl || ''}
                      onChange={(e) => handleFieldChange('twitterUrl', e.target.value)}
                      placeholder="https://twitter.com/webin10"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Instagram URL:
                    </label>
                    <input
                      type="url"
                      value={formData.instagramUrl || ''}
                      onChange={(e) => handleFieldChange('instagramUrl', e.target.value)}
                      placeholder="https://instagram.com/webin10"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      LinkedIn URL:
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl || ''}
                      onChange={(e) => handleFieldChange('linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/company/webin10"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      YouTube URL:
                    </label>
                    <input
                      type="url"
                      value={formData.youtubeUrl || ''}
                      onChange={(e) => handleFieldChange('youtubeUrl', e.target.value)}
                      placeholder="https://youtube.com/@webin10"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      WhatsApp Support Number:
                    </label>
                    <input
                      type="text"
                      value={formData.whatsappNumber || ''}
                      onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                      placeholder="+917070799200"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Social Links'}
                  </button>
                </div>
              </div>
            )}

            {/* 9. MAIL SETTINGS TAB */}
            {activeTab === 'mail' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                  <p className="font-semibold text-indigo-700">Google SMTP / Custom SMTP Support:</p>
                  <p className="text-slate-600">
                    Use Google SMTP by providing your Gmail address and a 16-character <strong>Google App Password</strong> (from your Google Account Security Settings). All platform notifications &amp; business emails will dispatch through Google SMTP.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="google">Google / Gmail SMTP (Recommended)</option>
                      <option value="smtp">Custom SMTP Server</option>
                      <option value="ses">Amazon SES</option>
                      <option value="resend">Resend</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      SMTP Host:*
                    </label>
                    <input
                      type="text"
                      value={formData.host || 'smtp.gmail.com'}
                      onChange={(e) => handleFieldChange('host', e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      SMTP Port:*
                    </label>
                    <input
                      type="number"
                      value={formData.port ?? 587}
                      onChange={(e) => handleFieldChange('port', Number(e.target.value))}
                      placeholder="587"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Encryption (Secure):
                    </label>
                    <select
                      value={formData.secure ? 'true' : 'false'}
                      onChange={(e) => handleFieldChange('secure', e.target.value === 'true')}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="false">TLS (Port 587 / STARTTLS)</option>
                      <option value="true">SSL (Port 465)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      SMTP Username / Email:*
                    </label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) => handleFieldChange('username', e.target.value)}
                      placeholder="webin10.in@gmail.com"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      SMTP Password / App Password:*
                    </label>
                    <input
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      From Email Address:*
                    </label>
                    <input
                      type="email"
                      value={formData.fromEmail || ''}
                      onChange={(e) => handleFieldChange('fromEmail', e.target.value)}
                      placeholder="webin10.in@gmail.com"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      From Sender Name:*
                    </label>
                    <input
                      type="text"
                      value={formData.fromName || 'Webin10 Platform'}
                      onChange={(e) => handleFieldChange('fromName', e.target.value)}
                      placeholder="Webin10 Platform"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Live SMTP Test Console */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span>Live SMTP Verification &amp; Test Email</span>
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={testMailRecipient}
                      onChange={(e) => setTestMailRecipient(e.target.value)}
                      placeholder="Enter recipient email (e.g. your email)"
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendTestMail}
                      disabled={testMailSending}
                      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                    >
                      {testMailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Send Test Email</span>
                    </button>
                  </div>

                  {testMailResult && (
                    <div
                      className={`p-3.5 rounded-xl text-xs border ${
                        testMailResult.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <p className="font-semibold">{testMailResult.message}</p>
                      {testMailResult.details && (
                        <p className="mt-1 font-mono text-[11px] text-slate-500">
                          Message ID: {testMailResult.details.messageId}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Mail Configuration'}
                  </button>
                </div>
              </div>
            )}

            {/* 10. CUSTOM DOMAIN TAB */}
            {activeTab === 'custom_domain' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-semibold text-sm text-slate-900">Enable Custom Business Domains</span>
                    <p className="text-xs text-slate-500 mt-0.5">Allows tenant businesses to map their custom domains</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(formData.enabled)}
                    onChange={(e) => handleFieldChange('enabled', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Platform CNAME Target:
                    </label>
                    <input
                      type="text"
                      value={formData.cnameTarget || 'cname.webin10.com'}
                      onChange={(e) => handleFieldChange('cnameTarget', e.target.value)}
                      placeholder="cname.webin10.com"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Edge Server IP Address:
                    </label>
                    <input
                      type="text"
                      value={formData.serverIp || '76.76.21.21'}
                      onChange={(e) => handleFieldChange('serverIp', e.target.value)}
                      placeholder="76.76.21.21"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Customer DNS Instructions:
                    </label>
                    <textarea
                      rows={3}
                      value={formData.instructions || ''}
                      onChange={(e) => handleFieldChange('instructions', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Custom Domain'}
                  </button>
                </div>
              </div>
            )}

            {/* 11. THEME COLOR & BRANDING TAB */}
            {activeTab === 'theme' && (
              <div className="space-y-8">
                {/* Header Information Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-100 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-indigo-600" />
                      100% Dynamic Platform Branding & Theme Engine
                    </h3>
                    <p className="text-xs text-slate-600">
                      Configure your enterprise branding here. Changing colors or uploading a logo updates the entire platform in real time — including the Super Admin sidebar, top navigation, login screen, document titles, browser favicon, and button accents.
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                    Live Reactive
                  </span>
                </div>

                {/* Platform & Sidebar Color Mode Selector */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        Platform Appearance & Sidebar Mode
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Choose whether your Super Admin sidebar and panels run in Light mode, Dark mode, or follow your OS preference.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      Active: {(formData.colorMode || colorMode || 'light').toUpperCase()}
                    </span>
                  </div>

                  {/* 10. COLOR MODE & SIDEBAR THEME */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {(() => {
                      const currentSelectedMode = formData.colorMode || colorMode || 'light';
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Platform Appearance & Sidebar Mode
                              </label>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Choose whether your Super Admin sidebar and panels run in Light mode, Dark mode, or follow your OS preference.
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                              Active: {currentSelectedMode.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Light Mode Option */}
                            <button
                              type="button"
                              onClick={() => {
                                handleFieldChange('colorMode', 'light');
                                setColorMode('light');
                              }}
                              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                                currentSelectedMode === 'light'
                                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs ring-2 ring-indigo-500/20'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 shrink-0">
                                <Sun className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">☀️ Light Mode</p>
                                  {currentSelectedMode === 'light' && (
                                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Clean white/slate sidebar, high contrast daylight UI, soft crisp borders.
                                </p>
                              </div>
                            </button>

                            {/* Dark Mode Option */}
                            <button
                              type="button"
                              onClick={() => {
                                handleFieldChange('colorMode', 'dark');
                                setColorMode('dark');
                              }}
                              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                                currentSelectedMode === 'dark'
                                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs ring-2 ring-indigo-500/20'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="p-2 rounded-lg bg-slate-900 dark:bg-slate-800 text-indigo-400 shrink-0">
                                <Moon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">🌙 Dark Mode</p>
                                  {currentSelectedMode === 'dark' && (
                                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Executive obsidian dark slate sidebar, reduced eye strain for night shifts.
                                </p>
                              </div>
                            </button>

                            {/* System Sync Option */}
                            <button
                              type="button"
                              onClick={() => {
                                handleFieldChange('colorMode', 'system');
                                setColorMode('system');
                              }}
                              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                                currentSelectedMode === 'system'
                                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs ring-2 ring-indigo-500/20'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 shrink-0">
                                <Smartphone className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">💻 System Sync</p>
                                  {currentSelectedMode === 'system' && (
                                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Automatically switches between Light & Dark based on your operating system setting.
                                </p>
                              </div>
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 1-Click Curated Presets */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      Curated Enterprise Color Presets
                    </label>
                    <span className="text-[11px] text-slate-500">Click any palette to auto-populate colors</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {THEME_PRESETS.map((preset) => {
                      const isSelected =
                        (formData.primaryColor || '#00D09C').toLowerCase() === preset.primary.toLowerCase() &&
                        (formData.secondaryColor || '#0F172A').toLowerCase() === preset.secondary.toLowerCase();

                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              primaryColor: preset.primary,
                              secondaryColor: preset.secondary,
                              accentColor: preset.accent,
                            }));
                          }}
                          className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span
                                className="w-4 h-4 rounded-full border border-white shadow-xs"
                                style={{ backgroundColor: preset.primary }}
                                title="Primary"
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white shadow-xs"
                                style={{ backgroundColor: preset.secondary }}
                                title="Secondary"
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white shadow-xs"
                                style={{ backgroundColor: preset.accent }}
                                title="Accent"
                              />
                            </div>
                            <p className="text-xs font-bold text-slate-900 leading-tight">{preset.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{preset.tag}</p>
                          </div>
                          {isSelected && (
                            <span className="absolute top-2 right-2 text-indigo-600">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Pickers & Hex Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Primary Brand Color:*
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Active navigation items, primary buttons & brand initials.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.primaryColor || '#00D09C'}
                        onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border border-slate-300 shrink-0"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor || '#00D09C'}
                        onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-semibold uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Secondary Brand Color:*
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Dark background header, sidebar contrast & secondary buttons.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.secondaryColor || '#0F172A'}
                        onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border border-slate-300 shrink-0"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor || '#0F172A'}
                        onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-semibold uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Accent Highlight Color:*
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Notification indicators, status pings & high-priority tags.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.accentColor || '#F59E0B'}
                        onChange={(e) => handleFieldChange('accentColor', e.target.value)}
                        className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border border-slate-300 shrink-0"
                      />
                      <input
                        type="text"
                        value={formData.accentColor || '#F59E0B'}
                        onChange={(e) => handleFieldChange('accentColor', e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-semibold uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo & Favicon Assets with Upload & Direct URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-slate-900">
                          Platform Logo (Sidebar & Login Header)
                        </label>
                        <p className="text-[11px] text-slate-500">Recommended: PNG / SVG with transparent background</p>
                      </div>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange('logoUrl', '')}
                          className="text-[11px] text-rose-600 hover:underline font-semibold"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>

                    <ImageUploader
                      label="Upload via Cloudinary Media CDN"
                      value={formData.logoUrl || ''}
                      onChange={(url) => handleFieldChange('logoUrl', url)}
                      folder="branding"
                      aspect="banner"
                    />

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Or Paste Direct Logo Image URL:
                      </label>
                      <input
                        type="text"
                        value={formData.logoUrl || ''}
                        onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
                        placeholder="https://res.cloudinary.com/.../logo.png"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-slate-900">
                          Platform Favicon (Browser Tab Icon)
                        </label>
                        <p className="text-[11px] text-slate-500">Recommended: 32x32 or 64x64 PNG / ICO</p>
                      </div>
                      {formData.faviconUrl && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange('faviconUrl', '')}
                          className="text-[11px] text-rose-600 hover:underline font-semibold"
                        >
                          Remove Favicon
                        </button>
                      )}
                    </div>

                    <ImageUploader
                      label="Upload via Cloudinary Media CDN"
                      value={formData.faviconUrl || ''}
                      onChange={(url) => handleFieldChange('faviconUrl', url)}
                      folder="branding"
                      aspect="square"
                    />

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Or Paste Direct Favicon Image URL:
                      </label>
                      <input
                        type="text"
                        value={formData.faviconUrl || ''}
                        onChange={(e) => handleFieldChange('faviconUrl', e.target.value)}
                        placeholder="https://res.cloudinary.com/.../favicon.ico"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* REAL-TIME LIVE PLATFORM SIMULATION PREVIEW STUDIO */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl text-white">
                  <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-300 ml-2 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        Live Interactive Platform Branding Simulation
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Real-Time Reactive
                    </span>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Simulated Browser Tab */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        1. Simulated Browser Tab & URL Bar:
                      </span>
                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 flex items-center gap-3">
                        {/* Tab pill */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 max-w-xs truncate shadow-xs">
                          {formData.faviconUrl ? (
                            <img src={formData.faviconUrl} alt="Favicon" className="w-3.5 h-3.5 object-contain rounded-xs shrink-0" />
                          ) : (
                            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                          <span className="truncate font-medium">{settings?.general?.value?.appName || currentAppName || 'Webin10'} | Super Admin</span>
                        </div>
                        {/* URL Bar */}
                        <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                          <Lock className="w-3 h-3 text-emerald-400" />
                          <span>https://admin.yourdomain.com/settings</span>
                        </div>
                      </div>
                    </div>

                    {/* Simulated Dashboard Layout */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        2. Simulated Super Admin Shell & Components:
                      </span>
                      <div className="rounded-xl border border-slate-800 bg-slate-900 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[160px]">
                        {/* Sidebar Mockup */}
                        <div
                          className={`md:col-span-4 p-4 border-r flex flex-col justify-between transition-colors ${
                            (formData.colorMode || colorMode) === 'light'
                              ? 'bg-white border-slate-200 text-slate-800'
                              : 'border-slate-800 text-white'
                          }`}
                          style={
                            (formData.colorMode || colorMode) === 'light'
                              ? {}
                              : { backgroundColor: formData.secondaryColor || '#0F172A' }
                          }
                        >
                          <div>
                            {/* Brand Header */}
                            <div className={`flex items-center gap-2.5 mb-4 pb-3 border-b ${
                              (formData.colorMode || colorMode) === 'light' ? 'border-slate-200' : 'border-white/10'
                            }`}>
                              {formData.logoUrl ? (
                                <img
                                  src={formData.logoUrl}
                                  alt="Logo"
                                  className="max-h-7 max-w-[110px] object-contain rounded"
                                />
                              ) : (
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs"
                                  style={{ backgroundColor: formData.primaryColor || '#00D09C' }}
                                >
                                  {(settings?.general?.value?.appName || currentAppName || 'W').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className={`text-xs font-bold leading-tight ${
                                  (formData.colorMode || colorMode) === 'light' ? 'text-slate-900' : 'text-white'
                                }`}>
                                  {settings?.general?.value?.appName || currentAppName || 'Webin10'}
                                </p>
                                <p className={`text-[9px] uppercase tracking-wider ${
                                  (formData.colorMode || colorMode) === 'light' ? 'text-slate-500' : 'text-slate-400'
                                }`}>Super Admin</p>
                              </div>
                            </div>

                            {/* Nav item mockup */}
                            <div className="space-y-1">
                              <div
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs"
                                style={{ backgroundColor: formData.primaryColor || '#00D09C' }}
                              >
                                <span className="w-2 h-2 rounded-full bg-white" />
                                <span>Active Navigation</span>
                              </div>
                              <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                                (formData.colorMode || colorMode) === 'light'
                                  ? 'text-slate-600 hover:text-slate-900'
                                  : 'text-slate-400 hover:text-white'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                  (formData.colorMode || colorMode) === 'light' ? 'bg-slate-300' : 'bg-slate-600'
                                }`} />
                                <span>Platform Tenants</span>
                              </div>
                            </div>
                          </div>

                          <p className={`text-[9px] pt-3 border-t ${
                            (formData.colorMode || colorMode) === 'light' ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'
                          }`}>
                            Enterprise Business OS ({(formData.colorMode || colorMode || 'light').toUpperCase()} MODE)
                          </p>
                        </div>

                        {/* Content Area Mockup */}
                        <div className="md:col-span-8 p-4 bg-slate-950 flex flex-col justify-between space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-300">Live Component Skinning</span>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                              style={{ backgroundColor: formData.accentColor || '#F59E0B' }}
                            >
                              Accent Badge
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-all"
                              style={{ backgroundColor: formData.primaryColor || '#00D09C' }}
                            >
                              Primary Brand Button
                            </button>

                            <button
                              type="button"
                              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 border border-slate-700 bg-slate-900"
                            >
                              Secondary Action
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-400">
                            Colors seamlessly adapt across dashboard, login screen, mobile viewport, and emails.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Bar */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Clicking save updates the platform database and immediately applies your new theme across the UI.
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDiscard}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg text-xs shadow-sm transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{saving ? 'Saving...' : 'Save Theme & Branding'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 12. PLATFORM MAINTENANCE MODE KILLSWITCH TAB */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                {/* Emergency Status Banner */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    formData.isEnabled
                      ? 'bg-rose-50 border-rose-200 text-rose-950 shadow-sm ring-2 ring-rose-500/20'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          formData.isEnabled ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold">
                            {formData.isEnabled
                              ? '🚨 EMERGENCY MAINTENANCE ACTIVE'
                              : '✅ NORMAL PLATFORM OPERATION'}
                          </h3>
                          {formData.isEnabled && (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {formData.isEnabled
                            ? 'All tenant business dashboards, member logins, and public customer portals are currently intercepting traffic and displaying the maintenance notice.'
                            : 'All platform services, tenant business apps, and APIs are live and serving normal traffic.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFieldChange('isEnabled', !formData.isEnabled)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-xs flex items-center gap-2 shrink-0 ${
                        formData.isEnabled
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>{formData.isEnabled ? 'Deactivate Maintenance (Turn Live)' : 'Activate Maintenance Mode'}</span>
                    </button>
                  </div>
                </div>

                {/* Configuration Fields */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Maintenance Notice & Display Configurations
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Maintenance Notice Headline:*
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      placeholder="e.g. Platform Under Scheduled Maintenance"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Detailed Public Notice Message:*
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message || ''}
                      onChange={(e) => handleFieldChange('message', e.target.value)}
                      placeholder="Explain the upgrade or maintenance reasons clearly to your business customers..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Estimated Completion Time:
                      </label>
                      <input
                        type="text"
                        value={formData.estimatedEndTime || ''}
                        onChange={(e) => handleFieldChange('estimatedEndTime', e.target.value)}
                        placeholder="e.g. 26 Nov 2026, 02:00 AM IST"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Emergency Support Contact Email:
                      </label>
                      <input
                        type="email"
                        value={formData.supportEmail || ''}
                        onChange={(e) => handleFieldChange('supportEmail', e.target.value)}
                        placeholder="support@webin10.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Whitelisted IP Addresses (Comma-separated, Bypass Maintenance):
                    </label>
                    <input
                      type="text"
                      value={formData.allowedIps || ''}
                      onChange={(e) => handleFieldChange('allowedIps', e.target.value)}
                      placeholder="e.g. 127.0.0.1, 192.168.1.1, 103.21.244.5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Super Admin dashboard is automatically protected and always accessible by authenticated owners.
                    </p>
                  </div>
                </div>

                {/* Live Visitor Simulation Mockup */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden text-white shadow-xl">
                  <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5 text-slate-300">
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      Live Preview: What Your Tenants & Customers Will See
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      formData.isEnabled ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {formData.isEnabled ? 'PREVIEWING ACTIVE SCREEN' : 'PREVIEW MODE (CURRENTLY INACTIVE)'}
                    </span>
                  </div>

                  <div className="p-8 text-center max-w-md mx-auto space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
                      <RotateCcw className="w-7 h-7 animate-spin" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">
                        {formData.title || 'Platform Under Scheduled Maintenance'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {formData.message || 'We are performing system upgrades to serve you better.'}
                      </p>
                    </div>

                    {formData.estimatedEndTime && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-amber-400 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Expected Back: {formData.estimatedEndTime}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <span className="text-[11px] text-slate-500">
                        Need urgent help? Email {formData.supportEmail || 'support@webin10.com'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save Bar */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Changes take effect immediately on platform status verification.
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDiscard}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg text-xs shadow-sm transition disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{saving ? 'Saving...' : 'Save Maintenance Settings'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 13. CLOUDINARY MEDIA STORAGE TAB */}
            {activeTab === 'cloudinary' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-900 space-y-1">
                  <p className="font-semibold text-sky-700">Cloudinary Global Media CDN Integration:</p>
                  <p className="text-slate-600">
                    All admin profile photos, business logos, user avatars, and invoice attachments are stored and delivered with automatic compression via Cloudinary.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Cloud Name:*
                    </label>
                    <input
                      type="text"
                      value={formData.cloudName || ''}
                      onChange={(e) => handleFieldChange('cloudName', e.target.value)}
                      placeholder="e.g. dxyz123ab"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      API Key:*
                    </label>
                    <input
                      type="text"
                      value={formData.apiKey || ''}
                      onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                      placeholder="e.g. 123456789012345"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      API Secret:*
                    </label>
                    <input
                      type="password"
                      value={formData.apiSecret || ''}
                      onChange={(e) => handleFieldChange('apiSecret', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Root Folder Prefix:
                    </label>
                    <input
                      type="text"
                      value={formData.folderPrefix || 'webin10'}
                      onChange={(e) => handleFieldChange('folderPrefix', e.target.value)}
                      placeholder="webin10"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Test Cloudinary Connection Button */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTestCloudinary}
                      disabled={testingCloudinary}
                      className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                    >
                      {testingCloudinary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                      <span>Test Cloudinary Connection</span>
                    </button>
                    <span className="text-xs text-slate-500">Pings Cloudinary API to verify credentials</span>
                  </div>

                  {cloudinaryResult && (
                    <div
                      className={`p-3.5 rounded-xl text-xs border ${
                        cloudinaryResult.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <p className="font-semibold">{cloudinaryResult.message}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Cloudinary Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Database Upgrade Modal Result */}
        {dbModalResult && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900">Database Synchronization Result</h3>
                </div>
                <button
                  onClick={() => setDbModalResult(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-slate-700">{dbModalResult.message}</p>
                {dbModalResult.stats && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Database Engine:</span>
                      <span className="text-slate-800">{dbModalResult.database}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Prisma Version:</span>
                      <span className="text-slate-800">{dbModalResult.schemaVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Query Latency:</span>
                      <span className="text-emerald-600 font-semibold">{dbModalResult.latencyMs} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active Tenants:</span>
                      <span className="text-slate-800">{dbModalResult.stats.tenants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Platform Modules:</span>
                      <span className="text-slate-800">{dbModalResult.stats.platformModules}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setDbModalResult(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sitemap Modal Result */}
        {sitemapModalResult && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Dynamic Sitemap Generated</h3>
                </div>
                <button
                  onClick={() => setSitemapModalResult(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-slate-700">{sitemapModalResult.message}</p>
                {sitemapModalResult.summary && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sitemap URL:</span>
                      <span className="text-indigo-600 break-all">{sitemapModalResult.sitemapUrl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Static Landing Pages:</span>
                      <span className="text-slate-800">{sitemapModalResult.summary.staticPages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tenant Pages Indexed:</span>
                      <span className="text-slate-800">{sitemapModalResult.summary.tenantPages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Indexed URLs:</span>
                      <span className="text-emerald-600 font-bold">{sitemapModalResult.summary.totalUrls}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSitemapModalResult(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Backup Modal Result */}
        {backupModalResult && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-sky-600" />
                  <h3 className="text-base font-bold text-slate-900">System Backup Downloaded</h3>
                </div>
                <button
                  onClick={() => setBackupModalResult(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-slate-700">
                  Full platform database snapshot successfully generated and saved to your downloads.
                </p>
                <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-xs font-mono text-sky-800 break-all">
                  File: {backupModalResult.filename}
                </div>

                {backupModalResult.summary && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tenants Archived:</span>
                      <span className="text-slate-900 font-bold">{backupModalResult.summary.totalTenants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subscription Plans:</span>
                      <span className="text-slate-900 font-bold">{backupModalResult.summary.totalPlans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoices & Financials:</span>
                      <span className="text-slate-900 font-bold">{backupModalResult.summary.totalInvoices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coupons & Promo Codes:</span>
                      <span className="text-slate-900 font-bold">{backupModalResult.summary.totalCoupons}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Platform Modules:</span>
                      <span className="text-slate-900 font-bold">{backupModalResult.summary.totalModules}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setBackupModalResult(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Public Policy Live Preview Modal */}
        {previewPolicyModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Public Document Preview: {policyTab === 'terms' ? 'Terms & Conditions' : policyTab === 'privacy' ? 'Privacy Policy' : 'Refund Policy'}
                    </h3>
                    <p className="text-xs text-slate-500">Live preview of how this document renders to customers & gym owners</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewPolicyModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 text-2xl leading-none font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-white">
                <div
                  className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html:
                      policyTab === 'terms'
                        ? (formData.termsAndConditions || STANDARD_LEGAL_TEMPLATES.terms)
                        : policyTab === 'privacy'
                        ? (formData.privacyPolicy || STANDARD_LEGAL_TEMPLATES.privacy)
                        : (formData.refundPolicy || STANDARD_LEGAL_TEMPLATES.refund),
                  }}
                />
              </div>

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500">
                  Tip: Use the WYSIWYG editor toolbar to add headings, bullet lists, or bold text.
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewPolicyModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Back to Editor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
