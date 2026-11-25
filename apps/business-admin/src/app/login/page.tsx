'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

export default function BusinessLoginPage() {
  const router = useRouter();
  const API_BASE = getApiBaseUrl();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/public/tenants/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const json = await res.json();
      const payload = json.data || json;

      if ((json.success || payload.success) && payload.tenant) {
        // Save tenant info to localStorage (Normal business login, NOT Super Admin support mode)
        localStorage.setItem('webin10_active_tenant_id', payload.tenant.id);
        localStorage.setItem('webin10_active_tenant_name', payload.tenant.name);
        localStorage.setItem('webin10_is_support_mode', 'false');
        localStorage.removeItem('webin10_impersonate_tenant_id');
        localStorage.removeItem('webin10_impersonate_tenant_name');
        router.push('/dashboard');
      } else {
        setErrorMsg(payload.message || json.message || json.error?.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillDemo = () => {
    setIdentifier('vikram@spartanfit.com');
    setPassword('Password@123');
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
            <span className="text-xs text-slate-500 hidden sm:inline font-medium">
              Don&apos;t have an account?
            </span>
            <Link
              href="/register"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 hover:shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Free Trial</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center my-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Business Sign In</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to Your Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Enter your business owner or staff credentials to access your operating dashboard.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs sm:text-sm animate-shake shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Login Box */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email or Mobile Number</span>
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. rahul@fitzone.com or 9876543210"
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password recovery: Please contact support or your business administrator.')}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">Remember on this device</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in to Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Fill */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Testing as guest?</span>
            <button
              type="button"
              onClick={handleQuickFillDemo}
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
            >
              Fill Demo Login
            </button>
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-8 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            256-bit SSL Encrypted
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Multi-Tenant Isolation
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Webin10 Business OS &bull; Empowering Fitness & Studio Enterprises
      </footer>
    </div>
  );
}
