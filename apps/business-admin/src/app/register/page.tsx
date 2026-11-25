'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Check,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

// 6-Digit Pin Input Component with auto-focus, backspace, and paste support
interface PinInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  autoFocus?: boolean;
}

function PinInput({ length = 6, value, onChange, autoFocus = false }: PinInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.slice(-1).replace(/\D/g, '');
    const current = [...digits];
    current[index] = char;
    const nextVal = current.join('').slice(0, length);
    onChange(nextVal);

    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
        const current = [...digits];
        current[index - 1] = '';
        onChange(current.join('').slice(0, length));
      } else {
        const current = [...digits];
        current[index] = '';
        onChange(current.join('').slice(0, length));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, length - 1);
      inputsRef.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-2.5 max-w-sm mx-auto">
      {Array.from({ length }).map((_, index) => {
        const digit = digits[index] || '';
        const isFilled = digit.length > 0;
        return (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoFocus={autoFocus && index === 0}
            value={digit}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border transition-all outline-none ${
              isFilled
                ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm'
                : 'border-slate-200 bg-slate-50/70 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
            }`}
          />
        );
      })}
    </div>
  );
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
  const [categorySlug, setCategorySlug] = useState('gym');
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
          setCategories([
            { id: '1', name: 'Gym & Fitness Center', slug: 'gym', description: 'Gyms, crossfit, health clubs' },
            { id: '2', name: 'Yoga & Pilates Studio', slug: 'yoga-studio', description: 'Yoga, meditation, wellness' },
            { id: '3', name: 'Salon, Spa & Beauty', slug: 'salon', description: 'Hair, beauty, wellness spa' },
            { id: '4', name: 'Coaching & Dance Academy', slug: 'coaching', description: 'Classes, coaching, academy' },
          ]);
        }
      })
      .catch(() => {
        setCategories([
          { id: '1', name: 'Gym & Fitness Center', slug: 'gym', description: 'Gyms, crossfit, health clubs' },
          { id: '2', name: 'Salon, Spa & Beauty', slug: 'salon', description: 'Hair, beauty, wellness spa' },
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

  // Step 1: Send Dual OTPs
  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanedPhone = ownerPhone.trim().replace(/\D/g, '');
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
          businessName: businessName.trim(),
          categorySlug,
          ownerName: ownerName.trim(),
          ownerEmail: ownerEmail.trim(),
          ownerPhone: cleanedPhone.startsWith('91') && cleanedPhone.length > 10 ? `+${cleanedPhone}` : `+91${cleanedPhone}`,
          city: city.trim(),
          password,
        }),
      });

      const json = await res.json();
      const payload = json.data || json;

      if (json.success || payload.success) {
        setRegistrationToken(payload.registrationToken || json.registrationToken);
        setMaskedEmail(payload.maskedEmail || json.maskedEmail || ownerEmail);
        setMaskedPhone(payload.maskedPhone || json.maskedPhone || ownerPhone);
        setResendTimer(30);
        setEmailOtp('');
        setPhoneOtp('');
        setStep(2);
      } else {
        setErrorMsg(payload.message || json.message || json.error?.message || 'Could not initiate registration. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while connecting to Webin10 API');
    } finally {
      setSubmittingStep1(false);
    }
  };

  // Resend OTP
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
        setSuccessMsg('New 6-digit codes have been dispatched to your email and phone!');
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

  // Step 2: Verify Dual OTPs
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (emailOtp.trim().length < 6) {
      setErrorMsg('Please enter the complete 6-digit Email Verification Code.');
      return;
    }
    if (phoneOtp.trim().length < 6) {
      setErrorMsg('Please enter the complete 6-digit Mobile/WhatsApp Verification Code.');
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

        // Save tenant info to localStorage (Self-service regular registration, NOT Super Admin support mode)
        localStorage.setItem('webin10_active_tenant_id', tenant.id);
        localStorage.setItem('webin10_active_tenant_name', tenant.name);
        localStorage.setItem('webin10_is_support_mode', 'false');
        localStorage.removeItem('webin10_impersonate_tenant_id');
        localStorage.removeItem('webin10_impersonate_tenant_name');

        setStep(3);

        // Redirect to dashboard after 2.5 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      } else {
        setErrorMsg(payload.message || json.message || json.error?.message || 'Incorrect verification code. Please check and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error completing registration');
    } finally {
      setSubmittingStep2(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/20 text-slate-800 flex flex-col justify-between selection:bg-emerald-500 selection:text-white font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              W
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">Webin10</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  OS
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Smart Business Platform
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline font-medium">Already registered?</span>
            <Link
              href="/login"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center my-6">
        {/* Stepper Header */}
        <div className="mb-8 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>14-Day Free Trial &bull; No Credit Card Required</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Register Your Business on Webin10
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Automate membership CRM, QR attendance, staff scheduling, and automated WhatsApp reminders.
          </p>

          {/* Stepper Progress */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                  step >= 1 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </span>
              <span className={`text-xs font-bold ${step === 1 ? 'text-slate-900' : 'text-slate-500'}`}>
                Business Details
              </span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                  step >= 2 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > 2 ? <Check className="w-4 h-4" /> : '2'}
              </span>
              <span className={`text-xs font-bold ${step === 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                Dual OTP Verify
              </span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                  step === 3 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-500'
                }`}
              >
                3
              </span>
              <span className={`text-xs font-bold ${step === 3 ? 'text-slate-900' : 'text-slate-500'}`}>
                Workspace Ready
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs sm:text-sm animate-shake shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* ================= STEP 1: BUSINESS & OWNER FORM ================= */}
        {step === 1 && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/60">
            <form onSubmit={handleInitiateRegistration} className="space-y-6">
              {/* Section 1: Business Details */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Business Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Business / Gym / Studio Name *</label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. IronFit Wellness Arena"
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Industry Vertical *</label>
                    <select
                      value={categorySlug}
                      onChange={(e) => setCategorySlug(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">City / Location</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Mumbai, Maharashtra"
                        className="w-full pl-9 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Owner Details */}
              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-teal-600" />
                  Business Owner Login Setup
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Address *</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="rahul@ironfit.com"
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                    />
                    <span className="text-[11px] text-slate-400">Email OTP code will be sent here</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>WhatsApp / Mobile Number *</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">WhatsApp / SMS OTP will be sent here</span>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Create Secure Password *</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                  className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {submittingStep1 ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Codes...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Verification (Email + WhatsApp)</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-3">
                  By clicking continue, you agree to Webin10 SaaS Terms of Service and Privacy Policy.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 2: DUAL OTP VERIFICATION (100% AUTHENTIC) ================= */}
        {step === 2 && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/60 space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Dual Security Verification
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  We have dispatched two separate 6-digit verification codes to verify your ownership of <strong>{businessName}</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Info</span>
              </button>
            </div>

            <form onSubmit={handleVerify} className="space-y-8">
              {/* OTP 1: Email Code */}
              <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Email Verification Code</h4>
                      <p className="text-xs text-slate-500">
                        Dispatched to <span className="font-mono font-semibold text-slate-700">{maskedEmail}</span> (Check Inbox/Spam)
                      </p>
                    </div>
                  </div>
                  {emailOtp.length === 6 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Filled
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <PinInput
                    length={6}
                    value={emailOtp}
                    onChange={setEmailOtp}
                    autoFocus={true}
                  />
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Enter the 6-digit code received via email
                  </p>
                </div>
              </div>

              {/* OTP 2: Mobile / WhatsApp Code */}
              <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">WhatsApp / Mobile Code</h4>
                      <p className="text-xs text-slate-500">
                        Dispatched to <span className="font-mono font-semibold text-slate-700">{maskedPhone}</span> via WhatsApp / SMS
                      </p>
                    </div>
                  </div>
                  {phoneOtp.length === 6 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      Filled
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <PinInput
                    length={6}
                    value={phoneOtp}
                    onChange={setPhoneOtp}
                  />
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Enter the 6-digit code received via WhatsApp / SMS
                  </p>
                </div>
              </div>

              {/* Resend Controls */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Didn&apos;t receive the verification codes?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || resending}
                  className="text-emerald-700 hover:text-emerald-800 font-bold disabled:text-slate-400 transition-all flex items-center gap-1.5"
                >
                  {resendTimer > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resend codes in {resendTimer}s</span>
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
                disabled={submittingStep2 || emailOtp.length !== 6 || phoneOtp.length !== 6}
                className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-base transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submittingStep2 ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Verifying Codes & Provisioning Workspace...</span>
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
          <div className="bg-white border border-emerald-200 rounded-3xl p-8 sm:p-12 text-center shadow-xl shadow-emerald-100 space-y-6 animate-scaleIn">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-200/50">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                14-Day Free Trial Activated
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
                Welcome to Webin10, {createdTenant?.name}! 🎉
              </h2>
              <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
                Both Email and Phone ownership have been verified. Your business workspace is now live and ready.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 max-w-sm mx-auto text-xs text-slate-500">
              <span>Redirecting you to your business dashboard...</span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-emerald-600 h-full w-full animate-pulse" />
              </div>
            </div>

            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20"
              >
                <span>Go to Dashboard Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Webin10 Business OS &bull; Enterprise Multi-Tenant Platform &bull; Secure 256-bit SSL
      </footer>
    </div>
  );
}
