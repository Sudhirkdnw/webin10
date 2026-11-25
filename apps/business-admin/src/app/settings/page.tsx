'use client';

import React, { useState, useEffect } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  Settings,
  Building2,
  FileBadge,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Globe,
  UploadCloud,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useActiveTenant } from '@/lib/tenant';

interface BusinessProfileData {
  id: string;
  name: string;
  slug: string;
  status: string;
  categoryName: string;
  categorySlug: string;
  legalName: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
  createdAt: string;
}

export default function BusinessSettingsPage() {
  const API_BASE = getApiBaseUrl();
  const { tenantId, tenantName } = useActiveTenant();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    logoUrl: '',
    categoryName: '',
  });

  // Load Profile from backend
  const loadProfile = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/profile`);
      const json = await res.json();
      if (json.success && json.data) {
        const d: BusinessProfileData = json.data;
        setForm({
          name: d.name || '',
          legalName: d.legalName || d.name || '',
          taxId: d.taxId || '',
          phone: d.phone || '',
          email: d.email || '',
          address: d.address || '',
          logoUrl: d.logoUrl || '',
          categoryName: d.categoryName || 'Fitness & Wellness',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [tenantId]);

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          legalName: form.legalName.trim(),
          taxId: form.taxId.trim().toUpperCase(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          logoUrl: form.logoUrl.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Business Profile & Branding updated successfully! Changes are live across all receipts and portals.');
        // Also update local storage if tenantName changed
        if (form.name.trim()) {
          localStorage.setItem('webin10_impersonate_tenant_name', form.name.trim());
        }
      } else {
        setErrorMsg(json.error?.message || 'Failed to update profile settings.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving business profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BusinessShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Workspace Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Business Profile & Dynamic Branding
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure your official business entity, GSTIN, branding logo, and customer contact details.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProfile}
            disabled={loading}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-300 text-red-900 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Branding & Visual Identity */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  Business Logo & Visual Branding
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your logo appears on customer WhatsApp messages, email headers, receipts, and invoices.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Logo Preview */}
              <div className="shrink-0 text-center">
                <div className="w-24 h-24 rounded-2xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shadow-inner relative group">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="Business Logo"
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Logo';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-extrabold text-2xl">
                      {form.name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join('') || 'BZ'}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Live Preview</span>
              </div>

              {/* Logo URL Input */}
              <div className="flex-1 space-y-2 w-full">
                <label className="text-xs font-bold text-slate-700">Logo Image URL</label>
                <div className="relative">
                  <input
                    type="url"
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Provide a direct PNG or JPG URL with transparent or white background (square or 4:3 aspect ratio recommended).
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Legal & Business Entity Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileBadge className="w-5 h-5 text-indigo-600" />
                  Legal Entity & GST Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Required for official GST tax invoice generation and customer membership agreements.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Brand Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Business Brand Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. FitZone Club"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Legal Entity Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Registered Legal Entity Name</label>
                <input
                  type="text"
                  value={form.legalName}
                  onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                  placeholder="e.g. FitZone Wellness Pvt. Ltd."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* GSTIN (Tax ID) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">GSTIN / Tax ID</label>
                <input
                  type="text"
                  maxLength={15}
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value.toUpperCase() })}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 tracking-wider placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white uppercase"
                />
                <span className="text-[10px] text-slate-400">15-digit Indian GST number for B2B input credit</span>
              </div>

              {/* Vertical / Category (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Industry Vertical</label>
                <input
                  type="text"
                  disabled
                  value={form.categoryName}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Contact & Physical Location */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  Contact & Business Address
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visible to members in booking confirmations and location maps.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Primary Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Official Business Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@fitzone.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {/* Full Address */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Registered Physical Address
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Building No, Street, Landmark, Sector, City, State, PIN Code"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={loadProfile}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile & Branding</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </BusinessShell>
  );
}
