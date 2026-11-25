'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  MapPin,
  Clock,
  Smartphone,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function BusinessRegisterPage() {
  const router = useRouter();
  const API_BASE = getApiBaseUrl();

  // Step 1 = Form, Step 2 = Dual OTP, Step 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Categories
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [categorySlug, setCategorySlug] = useState('gym-fitness');
  const [city, setCity] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP State
  const [registrationToken, setRegistrationToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [testOtps, setTestOtps] = useState<{ emailOtp: string; phoneOtp: string } | null>(null);

  // Timer & Loading states
  const [resendTimer, setResendTimer] = useState(30);
  const [submittingStep1, setSubmittingStep1] = useState(false);
  const [submittingStep2, setSubmittingStep2] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Created Tenant info
  const [createdTenant, setCreatedTenant] = useState<{ id: string; name: string; slug: string } | null>(null);

  // Load Categories on mount
  useEffect(() => {
    fetch(`${API_BASE}/public/tenants/categories`)
      .then((r) => r.json())
      .then((res) => {
        const data = res.data || res;
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          setCategorySlug(data[0].slug);
        } else {
          // Fallback categories
          setCategories([
            { id: '1', name: 'Gym & Fitness Arena', slug: 'gym-fitness', description: 'Gyms, crossfit, health clubs' },
            { id: '2', name: 'Yoga & Pilates Studio', slug: 'yoga-studio', description: 'Yoga, meditation, wellness' },
            { id: '3', name: 'Salon, Spa & Beauty', slug: 'salon-spa', description: 'Hair, beauty, wellness spa' },
            { id: '4', name: 'Physiotherapy & Sports Clinic', slug: 'sports-clinic', description: 'Rehab & clinical fitness' },
          ]);
        }
      })
      .catch(() => {
        setCategories([
          { id: '1', name: 'Gym & Fitness Arena', slug: 'gym-fitness', description: 'Gyms, crossfit, health clubs' },
          { id: '2', name: 'Yoga & Pilates Studio', slug: 'yoga-studio', description: 'Yoga, meditation, wellness' },
        ]);
      })
      .finally(() => setLoadingCategories(false));
  }, [API_BASE]);

  // Resend Timer Countdown
  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Handle Step 1 Submit (Send OTPs)
  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic format checks
    const cleanedPhone = ownerPhone.trim().replace(/\s+/g, '');
    if (cleanedPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmittingStep1(true);

    try {
      const res = await fetch(`${API_BASE}/public/tenants/register/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          categorySlug,
          ownerName,
          ownerEmail,
          ownerPhone: cleanedPhone.startsWith('+') ? cleanedPhone : `+91${cleanedPhone}`,
          city,
          password,
        }),
      });

      const json = await res.json();
      const payload = json.data || json;
      if (json.success || payload.success) {
        setRegistrationToken(payload.registrationToken || json.registrationToken);
        setMaskedEmail(payload.maskedEmail || json.maskedEmail || ownerEmail);
        setMaskedPhone(payload.maskedPhone || json.maskedPhone || ownerPhone);
        if (payload.testCredentials || json.testCredentials) {
          setTestOtps(payload.testCredentials || json.testCredentials);
        }
        setResendTimer(30);
        setStep(2);
      } else {
        setErrorMsg(payload.message || json.message || json.error?.message || 'Could not send verification codes. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while connecting to Webin10 API');
    } finally {
      setSubmittingStep1(false);
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/public/tenants/register/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationToken,
          target: 'BOTH',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg('New verification codes have been sent to your email and phone!');
        if (json.testCredentials) {
          setTestOtps(json.testCredentials);
        }
        setResendTimer(30);
      } else {
        setErrorMsg(json.message || 'Failed to resend codes.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error resending codes');
    } finally {
      setResending(false);
    }
  };

  // Handle Step 2 Submit (Verify Dual OTPs)
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (emailOtp.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit Email Verification Code.');
      return;
    }
    if (phoneOtp.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit Mobile/WhatsApp Verification Code.');
      return;
    }

    setSubmittingStep2(true);

    try {
      const res = await fetch(`${API_BASE}/public/tenants/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationToken,
          emailOtp: emailOtp.trim(),
          phoneOtp: phoneOtp.trim(),
        }),
      });

      const json = await res.json();
      const payload = json.data || json;
      const tenant = payload.tenant || json.tenant;
      if ((json.success || payload.success) && tenant) {
        setCreatedTenant(tenant);
        // Save tenant info in localStorage (Self-service business registration, NOT Super Admin support mode)
        localStorage.setItem('webin10_active_tenant_id', tenant.id);
        localStorage.setItem('webin10_active_tenant_name', tenant.name);
        localStorage.setItem('webin10_is_support_mode', 'false');
        localStorage.removeItem('webin10_impersonate_tenant_id');
        localStorage.removeItem('webin10_impersonate_tenant_name');

        setStep(3);

        // Auto redirect to dashboard after 2.5 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      } else {
        setErrorMsg(payload.message || json.message || json.error?.message || 'Verification failed. Please check your OTPs.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error completing verification');
    } finally {
      setSubmittingStep2(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              W
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">Webin10</span>
              <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-widest">
                Business OS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">Already registered?</span>
            <Link
              href="/login"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        {/* Stepper Header */}
        <div className="mb-8 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>14-Day Free Trial • Instant Dual-Verification</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Register Your Business on Webin10
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Automate your gym or studio CRM, attendance, staff, and WhatsApp reminders in under 2 minutes.
          </p>

          {/* Stepper Progress */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                  step >= 1 ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20' : 'bg-slate-800 text-slate-400'
                }`}
              >
                1
              </span>
              <span className={`text-xs font-bold ${step === 1 ? 'text-white' : 'text-slate-500'}`}>
                Business Details
              </span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                  step >= 2 ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20' : 'bg-slate-800 text-slate-400'
                }`}
              >
                2
              </span>
              <span className={`text-xs font-bold ${step === 2 ? 'text-white' : 'text-slate-500'}`}>
                Dual OTP Verify
              </span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                  step === 3 ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20' : 'bg-slate-800 text-slate-400'
                }`}
              >
                3
              </span>
              <span className={`text-xs font-bold ${step === 3 ? 'text-white' : 'text-slate-500'}`}>
                Workspace Ready
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-700/50 text-red-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-700/50 text-emerald-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= STEP 1: BUSINESS & OWNER FORM ================= */}
        {step === 1 && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleInitiateRegistration} className="space-y-6">
              {/* Section 1: Business Details */}
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Business Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">Business / Gym / Studio Name *</label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. FitZone Arena & Gym"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Industry Vertical *</label>
                    <select
                      value={categorySlug}
                      onChange={(e) => setCategorySlug(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">City / Location</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Mumbai, Maharashtra"
                        className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Owner Details */}
              <div className="pt-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
                  <User className="w-4 h-4 text-indigo-400" />
                  Business Owner Account (Login Details)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Email Address (For Verification OTP) *
                    </label>
                    <input
                      type="email"
                      required
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="rahul@fitzone.com"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      WhatsApp / Mobile (For Phone OTP) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="9876543210 (10 digits)"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Create Secure Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="•••••••••••• (min 6 characters)"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submittingStep1}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {submittingStep1 ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Codes...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Codes (Email + Phone)</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-500 text-center mt-3">
                  By clicking continue, you agree to Webin10 SaaS Terms of Service and Privacy Policy.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 2: DUAL OTP VERIFICATION ================= */}
        {step === 2 && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Dual Security Verification
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  We sent two unique 6-digit verification codes to verify your ownership of <strong>{businessName}</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Info</span>
              </button>
            </div>

            {/* Test Mode Helper Banner */}
            {testOtps && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Test Mode Active:</strong> Email OTP: <code className="bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono font-bold">{testOtps.emailOtp}</code> | Phone OTP: <code className="bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono font-bold">{testOtps.phoneOtp}</code>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmailOtp(testOtps.emailOtp);
                    setPhoneOtp(testOtps.phoneOtp);
                  }}
                  className="px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-lg text-[11px] font-black hover:bg-emerald-400 transition-all self-start sm:self-center"
                >
                  Auto-Fill Test Codes
                </button>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OTP 1: Email Verification */}
                <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Email Code</h4>
                        <span className="text-[11px] text-slate-400 font-mono">{maskedEmail}</span>
                      </div>
                    </div>
                    {emailOtp.length === 6 && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block">
                      Enter 6-Digit Email OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-xl font-mono font-bold text-emerald-300 tracking-widest placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* OTP 2: Phone / WhatsApp Verification */}
                <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Mobile / WhatsApp</h4>
                        <span className="text-[11px] text-slate-400 font-mono">{maskedPhone}</span>
                      </div>
                    </div>
                    {phoneOtp.length === 6 && (
                      <CheckCircle2 className="w-5 h-5 text-teal-400" />
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block">
                      Enter 6-Digit Phone OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-xl font-mono font-bold text-teal-300 tracking-widest placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Resend Controls */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Didn&apos;t receive the codes?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || resending}
                  className="text-emerald-400 hover:text-emerald-300 font-bold disabled:text-slate-600 transition-all flex items-center gap-1.5"
                >
                  {resendTimer > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resend OTPs in {resendTimer}s</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      <span>Resend Verification Codes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Verify & Launch Button */}
              <button
                type="submit"
                disabled={submittingStep2}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-base transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingStep2 ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Verifying Codes & Launching Workspace...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Verify Both Codes & Launch Workspace 🚀</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 3: WORKSPACE CREATED CELEBRATION ================= */}
        {step === 3 && (
          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl space-y-6 animate-scaleIn">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                14-Day Free Trial Activated
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight mt-3">
                Welcome to Webin10, {createdTenant?.name}! 🎉
              </h2>
              <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto">
                Both your Email and Phone have been verified. Your business workspace has been successfully created.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 max-w-sm mx-auto text-xs text-slate-400">
              <span>Redirecting you to your Business Dashboard in 2 seconds...</span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-emerald-400 h-full w-full animate-progress" />
              </div>
            </div>

            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md"
              >
                <span>Go to Dashboard Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        Webin10 Smart Business OS • Enterprise Multi-Tenant Platform • Secure 256-bit SSL
      </footer>
    </div>
  );
}
