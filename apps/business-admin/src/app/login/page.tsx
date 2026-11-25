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
  Zap,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

export default function BusinessLoginPage() {
  const router = useRouter();
  const API_BASE = getApiBaseUrl();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        // Save tenant info to localStorage
        localStorage.setItem('webin10_impersonate_tenant_id', payload.tenant.id);
        localStorage.setItem('webin10_impersonate_tenant_name', payload.tenant.name);
        router.push('/dashboard');
      } else {
        setErrorMsg(payload.message || json.message || json.error?.message || 'Invalid login credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  // Demo Login Quick-Fill
  const handleDemoLogin = () => {
    setIdentifier('vikram@spartanfit.com');
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Navbar */}
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

          <Link
            href="/register"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Register New Business</span>
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Business Portal Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sign In to Your Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Enter your business owner or staff credentials to access your operating dashboard.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-700/50 text-red-200 rounded-2xl flex items-center gap-3 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Demo Fast Login Banner */}
        <div className="mb-6 p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Need quick access to test?</span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold transition-all"
          >
            Fill Demo Account
          </button>
        </div>

        {/* Login Form */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email or Mobile Number</span>
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@business.com or 9876543210"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Register Prompt */}
          <div className="pt-6 mt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>New fitness business or gym? </span>
            <Link
              href="/register"
              className="text-emerald-400 hover:text-emerald-300 font-extrabold underline ml-1"
            >
              Start 14-Day Free Trial &rarr;
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        Webin10 Smart Business OS • Enterprise Multi-Tenant Platform • Secure 256-bit SSL
      </footer>
    </div>
  );
}
