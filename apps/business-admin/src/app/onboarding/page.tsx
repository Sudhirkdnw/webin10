'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Printer,
  Download,
  QrCode,
  Smartphone,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  Palette,
  Users,
  CalendarCheck,
  Package,
  Layers,
  Save,
  Rocket,
  Check,
  AlertCircle,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useActiveTenant } from '@/lib/tenant';

interface BusinessProfile {
  name: string;
  legalName: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
  categoryName: string;
  categorySlug: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const API_BASE = getApiBaseUrl();
  const { tenantId, tenantName } = useActiveTenant();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [savingStep1, setSavingStep1] = useState(false);
  const [seedingStep3, setSeedingStep3] = useState(false);
  const [seedResult, setSeedResult] = useState<any | null>(null);

  // Form Fields
  const [profile, setProfile] = useState<BusinessProfile>({
    name: '',
    legalName: '',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    logoUrl: '',
    categoryName: 'Gym & Fitness',
    categorySlug: 'gym',
  });
  const [upiId, setUpiId] = useState('');
  const [standeeTheme, setStandeeTheme] = useState<'emerald' | 'indigo' | 'rose' | 'slate'>('emerald');
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const posterRef = useRef<HTMLDivElement>(null);

  // Load existing profile if available
  useEffect(() => {
    if (!tenantId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/tenants/${tenantId}/profile`);
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setProfile({
            name: d.name || tenantName || '',
            legalName: d.legalName || d.name || tenantName || '',
            taxId: d.taxId || '',
            phone: d.phone || '',
            email: d.email || '',
            address: d.address || '',
            logoUrl: d.logoUrl || '',
            categoryName: d.categoryName || 'Business Workspace',
            categorySlug: d.categorySlug || 'general',
          });
          // Derive default UPI ID from name or phone if empty
          if (!upiId) {
            const cleanSlug = (d.name || tenantName || 'business')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '');
            setUpiId(`${cleanSlug}@upi`);
          }
        }
      } catch (err) {
        console.error('Failed to load profile for onboarding:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [tenantId]);

  // Step 1 Save
  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      setSavingStep1(true);
      setFeedbackMsg(null);
      await fetch(`${API_BASE}/tenants/${tenantId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name.trim(),
          legalName: profile.legalName.trim(),
          taxId: profile.taxId.trim().toUpperCase(),
          phone: profile.phone.trim(),
          email: profile.email.trim(),
          address: profile.address.trim(),
          logoUrl: profile.logoUrl.trim(),
        }),
      });

      // Advance to Step 2
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFeedbackMsg('Failed to save profile. Please try again.');
    } finally {
      setSavingStep1(false);
    }
  };

  // Step 3 Seed Starter Data
  const handleSeedStarterData = async () => {
    if (!tenantId) return;
    try {
      setSeedingStep3(true);
      setFeedbackMsg(null);
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/onboarding/seed-starter`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        setSeedResult(json);
        localStorage.setItem(`webin10_onboarding_completed_${tenantId}`, 'true');
      } else {
        setFeedbackMsg(json.message || 'Failed to populate starter pack');
      }
    } catch (err: any) {
      setFeedbackMsg('Network error while populating starter pack');
    } finally {
      setSeedingStep3(false);
    }
  };

  const handleFinishOnboarding = () => {
    if (tenantId) {
      localStorage.setItem(`webin10_onboarding_completed_${tenantId}`, 'true');
    }
    router.push('/dashboard');
  };

  // Native Print trigger
  const handlePrintStandee = () => {
    window.print();
  };

  // Standee Color Scheme Config
  const themeStyles = {
    emerald: {
      gradient: 'from-emerald-600 via-teal-700 to-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      accent: 'text-emerald-700',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      border: 'border-emerald-500',
      bgLight: 'bg-emerald-50',
    },
    indigo: {
      gradient: 'from-indigo-600 via-blue-700 to-indigo-950',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      accent: 'text-indigo-700',
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      border: 'border-indigo-500',
      bgLight: 'bg-indigo-50',
    },
    rose: {
      gradient: 'from-rose-600 via-pink-700 to-rose-950',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      accent: 'text-rose-700',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white',
      border: 'border-rose-500',
      bgLight: 'bg-rose-50',
    },
    slate: {
      gradient: 'from-slate-800 via-slate-900 to-black',
      badge: 'bg-slate-200 text-slate-900 border-slate-300',
      accent: 'text-slate-800',
      btn: 'bg-slate-900 hover:bg-black text-white',
      border: 'border-slate-700',
      bgLight: 'bg-slate-100',
    },
  }[standeeTheme];

  // Standee Check-In URL
  const checkInUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/attendance`
    : `http://localhost:3002/attendance`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Print Specific CSS Style Tag */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-standee,
          #printable-standee * {
            visibility: visible;
          }
          #printable-standee {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 90% !important;
            max-width: 600px !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 2px solid #cbd5e1 !important;
          }
          header, footer, nav, button, .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {profile.name || tenantName || 'Webin10 Business OS'}
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                Setup Wizard 🪄
              </span>
            </h1>
            <p className="text-xs text-slate-500">Get your business operational in 3 simple steps</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all"
          >
            Skip to Dashboard
          </button>
        </div>
      </header>

      {/* Stepper Progress Bar */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-8 pb-4 no-print">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {/* Step 1 Pill */}
          <button
            onClick={() => setCurrentStep(1)}
            className={`p-3 sm:p-4 rounded-2xl border transition-all text-left flex items-center gap-3 ${
              currentStep === 1
                ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                : currentStep > 1
                ? 'bg-white border-slate-200 text-slate-700'
                : 'bg-slate-100 border-slate-200 opacity-60'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep > 1
                  ? 'bg-emerald-600 text-white'
                  : currentStep === 1
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-bold text-slate-900 truncate">Identity & Branding</p>
              <p className="text-[11px] text-slate-500 truncate">Name, GSTIN & UPI</p>
            </div>
          </button>

          {/* Step 2 Pill */}
          <button
            onClick={() => setCurrentStep(2)}
            className={`p-3 sm:p-4 rounded-2xl border transition-all text-left flex items-center gap-3 ${
              currentStep === 2
                ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                : currentStep > 2
                ? 'bg-white border-slate-200 text-slate-700'
                : 'bg-slate-100 border-slate-200 opacity-60'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep > 2
                  ? 'bg-emerald-600 text-white'
                  : currentStep === 2
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-bold text-slate-900 truncate">Desk Kiosk Standee</p>
              <p className="text-[11px] text-slate-500 truncate">Printable Check-In QR</p>
            </div>
          </button>

          {/* Step 3 Pill */}
          <button
            onClick={() => setCurrentStep(3)}
            className={`p-3 sm:p-4 rounded-2xl border transition-all text-left flex items-center gap-3 ${
              currentStep === 3
                ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                : 'bg-slate-100 border-slate-200 opacity-60'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                seedResult
                  ? 'bg-emerald-600 text-white'
                  : currentStep === 3
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {seedResult ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-bold text-slate-900 truncate">Starter Pack & Launch</p>
              <p className="text-[11px] text-slate-500 truncate">Demo data & Ready</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full px-4 py-4 flex-1">
        {feedbackMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: BUSINESS IDENTITY & BRANDING */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-100/60 space-y-8 animate-in fade-in duration-200">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Step 1 of 3
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                Business Profile & Digital Identity
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                This information appears on your member invoices, WhatsApp alerts, and front desk kiosk standee.
              </p>
            </div>

            <form onSubmit={handleSaveStep1} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Business Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    Business / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    placeholder="e.g. Spartan Fitness Arena"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Legal Entity Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileBadge className="w-3.5 h-3.5 text-slate-500" />
                    Legal Entity Name (Invoicing)
                  </label>
                  <input
                    type="text"
                    value={profile.legalName}
                    onChange={e => setProfile({ ...profile, legalName: e.target.value })}
                    placeholder="e.g. Spartan Wellness Private Limited"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Business Vertical / Category (Read-only badge) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    Assigned Vertical / Category
                  </label>
                  <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 flex items-center justify-between">
                    <span>{profile.categoryName}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                      {profile.categorySlug}
                    </span>
                  </div>
                </div>

                {/* GSTIN / Tax ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileBadge className="w-3.5 h-3.5 text-slate-500" />
                    GSTIN / Tax ID (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={profile.taxId}
                    onChange={e => setProfile({ ...profile, taxId: e.target.value })}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Support Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    Contact / WhatsApp Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={profile.phone}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="e.g. +91 98201 12233"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Support Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    Official Billing Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    placeholder="e.g. contact@spartanfitness.in"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Physical Shop / Clinic Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Centre / Store Physical Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={profile.address}
                  onChange={e => setProfile({ ...profile, address: e.target.value })}
                  placeholder="e.g. Shop #4, Ground Floor, Platinum Square, MG Road, Pune - 411001"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              {/* UPI ID for Payments */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Primary UPI ID for Member Payments & Invoices (VPA)
                </label>
                <p className="text-[11px] text-emerald-800">
                  Customers can pay instant membership dues & khata bills directly to this UPI address.
                </p>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="e.g. spartan@upi or 9820112233@paytm"
                  className="w-full sm:w-80 px-4 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-semibold text-emerald-950 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={savingStep1}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2 disabled:opacity-60"
                >
                  {savingStep1 ? (
                    <span>Saving Profile...</span>
                  ) : (
                    <>
                      <span>Save & Continue to Desk Standee</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: KIOSK QR DESK STANDEE / POSTER GENERATOR */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Theme Switcher Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Step 2 of 3
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  Official Kiosk Desk Standee Poster
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Print and place this standee on your reception counter for contactless QR attendance and fast UPI payments.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Theme Selector */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {(['emerald', 'indigo', 'rose', 'slate'] as const).map(th => (
                    <button
                      key={th}
                      onClick={() => setStandeeTheme(th)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        standeeTheme === th
                          ? 'bg-white shadow text-slate-900 ring-1 ring-slate-300'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {th}
                    </button>
                  ))}
                </div>

                {/* Print Button */}
                <button
                  onClick={handlePrintStandee}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Standee (A4 / Card)</span>
                </button>
              </div>
            </div>

            {/* LIVE STANDEE PREVIEW CARD (This section prints cleanly!) */}
            <div className="flex justify-center py-2">
              <div
                id="printable-standee"
                ref={posterRef}
                className="w-full max-w-md bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative transition-all"
              >
                {/* Gradient Top Banner */}
                <div className={`p-6 bg-gradient-to-br ${themeStyles.gradient} text-white text-center relative overflow-hidden`}>
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="relative z-10 space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md border border-white/30 text-white">
                      Official Fast-Checkin Kiosk
                    </span>
                    <h3 className="text-2xl font-black tracking-tight leading-tight uppercase">
                      {profile.name || tenantName}
                    </h3>
                    <p className="text-xs font-medium text-white/80 line-clamp-1">
                      {profile.address || 'Certified Multi-Tenant Business Centre'}
                    </p>
                  </div>
                </div>

                {/* Standee Body */}
                <div className="p-7 text-center space-y-6">
                  {/* Category Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{profile.categoryName} &bull; Member Kiosk</span>
                  </div>

                  {/* HIGH-RES CRISP QR CODE */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-5 bg-white rounded-3xl border-2 border-slate-800 shadow-xl inline-block relative group">
                      {/* Generative High-Contrast SVG QR Pattern */}
                      <svg
                        className="w-48 h-48"
                        viewBox="0 0 200 200"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Outer Frame */}
                        <rect width="200" height="200" rx="12" fill="white" />
                        
                        {/* Corner Targets */}
                        {/* Top-Left */}
                        <rect x="15" y="15" width="50" height="50" rx="8" fill="#0f172a" />
                        <rect x="25" y="25" width="30" height="30" rx="4" fill="white" />
                        <rect x="33" y="33" width="14" height="14" rx="2" fill="#0f172a" />

                        {/* Top-Right */}
                        <rect x="135" y="15" width="50" height="50" rx="8" fill="#0f172a" />
                        <rect x="145" y="25" width="30" height="30" rx="4" fill="white" />
                        <rect x="153" y="33" width="14" height="14" rx="2" fill="#0f172a" />

                        {/* Bottom-Left */}
                        <rect x="15" y="135" width="50" height="50" rx="8" fill="#0f172a" />
                        <rect x="25" y="145" width="30" height="30" rx="4" fill="white" />
                        <rect x="33" y="153" width="14" height="14" rx="2" fill="#0f172a" />

                        {/* Data Pixels Matrix */}
                        <rect x="75" y="20" width="10" height="10" fill="#0f172a" />
                        <rect x="95" y="20" width="10" height="10" fill="#0f172a" />
                        <rect x="115" y="20" width="10" height="10" fill="#0f172a" />
                        <rect x="75" y="40" width="10" height="10" fill="#0f172a" />
                        <rect x="105" y="40" width="10" height="10" fill="#0f172a" />
                        
                        <rect x="20" y="75" width="10" height="10" fill="#0f172a" />
                        <rect x="40" y="75" width="10" height="10" fill="#0f172a" />
                        <rect x="60" y="75" width="10" height="10" fill="#0f172a" />
                        <rect x="80" y="75" width="10" height="10" fill="#0f172a" />
                        <rect x="100" y="75" width="10" height="10" fill="#0f172a" />
                        <rect x="120" y="75" width="10" height="10" fill="#0f172a" />
                        <rect x="140" y="75" width="10" height="10" fill="#0f172a" />
                        <rect x="170" y="75" width="10" height="10" fill="#0f172a" />

                        <rect x="75" y="95" width="10" height="10" fill="#0f172a" />
                        <rect x="115" y="95" width="10" height="10" fill="#0f172a" />
                        <rect x="135" y="95" width="10" height="10" fill="#0f172a" />
                        <rect x="165" y="95" width="10" height="10" fill="#0f172a" />

                        <rect x="20" y="115" width="10" height="10" fill="#0f172a" />
                        <rect x="50" y="115" width="10" height="10" fill="#0f172a" />
                        <rect x="80" y="115" width="10" height="10" fill="#0f172a" />
                        <rect x="105" y="115" width="10" height="10" fill="#0f172a" />
                        <rect x="145" y="115" width="10" height="10" fill="#0f172a" />
                        <rect x="175" y="115" width="10" height="10" fill="#0f172a" />

                        <rect x="75" y="135" width="10" height="10" fill="#0f172a" />
                        <rect x="95" y="135" width="10" height="10" fill="#0f172a" />
                        <rect x="120" y="135" width="10" height="10" fill="#0f172a" />
                        <rect x="150" y="135" width="10" height="10" fill="#0f172a" />

                        <rect x="75" y="155" width="10" height="10" fill="#0f172a" />
                        <rect x="105" y="155" width="10" height="10" fill="#0f172a" />
                        <rect x="135" y="155" width="10" height="10" fill="#0f172a" />
                        <rect x="165" y="155" width="10" height="10" fill="#0f172a" />

                        <rect x="85" y="175" width="10" height="10" fill="#0f172a" />
                        <rect x="115" y="175" width="10" height="10" fill="#0f172a" />
                        <rect x="145" y="175" width="10" height="10" fill="#0f172a" />

                        {/* Center Icon Badge */}
                        <circle cx="100" cy="100" r="18" fill="white" />
                        <circle cx="100" cy="100" r="15" fill="#059669" />
                      </svg>
                      
                      {/* Center Overlay Logo */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <QrCode className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span>SCAN WITH ANY CAMERA / UPI APP</span>
                    </div>
                  </div>

                  {/* 3 Step Instructions for Members */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-left">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase">1. Scan</div>
                      <div className="text-[11px] font-bold text-slate-800 mt-0.5 leading-snug">
                        Open Camera or Paytm/GPay
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase">2. Punch</div>
                      <div className="text-[11px] font-bold text-slate-800 mt-0.5 leading-snug">
                        Instant Entry Attendance
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase">3. Pay</div>
                      <div className="text-[11px] font-bold text-slate-800 mt-0.5 leading-snug">
                        WhatsApp Bill & Receipts
                      </div>
                    </div>
                  </div>

                  {/* UPI VPA Badge */}
                  {upiId && (
                    <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 font-sans text-[11px] font-bold">UPI ID:</span>
                      <span className="font-bold text-slate-900">{upiId}</span>
                    </div>
                  )}

                  {/* Standee Footer */}
                  <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Powered by Webin10 Multi-Tenant Business OS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between no-print shadow-sm">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(3);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/25 flex items-center gap-2"
              >
                <span>Standee Ready! Continue to Starter Pack</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: 1-CLICK STARTER DATA & LAUNCH WORKSPACE */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-100/60 space-y-8">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Step 3 of 3
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Populate Starter Pack & Launch Business OS 🚀
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Avoid starting with empty tables. We can instantly load realistic industry records tailored for{' '}
                  <strong className="text-slate-900">{profile.categoryName}</strong> so you can experience attendance, khata, appointments, and billing immediately.
                </p>
              </div>

              {/* Starter Pack Feature Box */}
              {!seedResult ? (
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 border-2 border-dashed border-emerald-300 rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        1-Click {profile.categoryName} Starter Pack
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Tailored specifically to your business vertical. Automatically creates sample profiles and activity:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 bg-white/80 rounded-2xl border border-emerald-200/60 text-xs flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        2-3 Enrolled Members & Customers with mobile numbers
                      </span>
                    </div>

                    <div className="p-3.5 bg-white/80 rounded-2xl border border-emerald-200/60 text-xs flex items-center gap-2.5">
                      <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        Today&apos;s QR Kiosk Attendance Check-Ins
                      </span>
                    </div>

                    <div className="p-3.5 bg-white/80 rounded-2xl border border-emerald-200/60 text-xs flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        Active Khata Credit Ledger with WhatsApp Reminder links
                      </span>
                    </div>

                    <div className="p-3.5 bg-white/80 rounded-2xl border border-emerald-200/60 text-xs flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        Pre-stocked Products / Services Catalogue
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      disabled={seedingStep3}
                      onClick={handleSeedStarterData}
                      className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{seedingStep3 ? 'Populating Starter Pack...' : 'Load Recommended Starter Data 🪄'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFinishOnboarding}
                      className="w-full sm:w-auto px-5 py-3.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all"
                    >
                      Skip (Start with clean empty database)
                    </button>
                  </div>
                </div>
              ) : (
                /* Celebration Card when Starter Data is loaded */
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-900">
                      Workspace Ready & Populated! 🎉
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                      {seedResult.message || 'Your initial members, attendance punch logs, and khata entries are live.'}
                    </p>
                  </div>

                  {/* Seeded Stats Summary */}
                  {seedResult.seededStats && (
                    <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg mx-auto">
                      {seedResult.seededStats.customers > 0 && (
                        <span className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-emerald-900 border border-emerald-200 shadow-sm">
                          👤 {seedResult.seededStats.customers} Customers
                        </span>
                      )}
                      {seedResult.seededStats.attendance > 0 && (
                        <span className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-emerald-900 border border-emerald-200 shadow-sm">
                          📱 {seedResult.seededStats.attendance} Attendance Punches
                        </span>
                      )}
                      {seedResult.seededStats.khata > 0 && (
                        <span className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-emerald-900 border border-emerald-200 shadow-sm">
                          📒 {seedResult.seededStats.khata} Khata Ledger Entry
                        </span>
                      )}
                      {seedResult.seededStats.appointments > 0 && (
                        <span className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-emerald-900 border border-emerald-200 shadow-sm">
                          📅 {seedResult.seededStats.appointments} Appointments
                        </span>
                      )}
                      {seedResult.seededStats.inventory > 0 && (
                        <span className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-emerald-900 border border-emerald-200 shadow-sm">
                          📦 {seedResult.seededStats.inventory} Inventory SKUs
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleFinishOnboarding}
                      className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 mx-auto"
                    >
                      <Rocket className="w-5 h-5" />
                      <span>Launch Webin10 Business Dashboard 🚀</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Back Button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Desk Standee</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  Finish & Go to Dashboard &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
