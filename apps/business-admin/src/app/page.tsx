'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  MessageSquare,
  CreditCard,
  Building2,
  Zap,
  TrendingUp,
  Clock,
  ChevronRight,
  Send,
  Star,
  FileText,
  Lock,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';

export default function BusinessLandingPage() {
  const { tenantId, tenantName } = useActiveTenant();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white font-sans">
      {/* 1. TOP NAVBAR */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              W
            </div>
            <div>
              <span className="font-extrabold text-white text-xl tracking-tight">Webin10</span>
              <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-widest">
                Business OS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#whatsapp" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <span>WhatsApp Hub</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold">
                Auto
              </span>
            </a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">
              Pricing Plans
            </a>
            <a href="#security" className="hover:text-emerald-400 transition-colors">
              GST & Security
            </a>
          </nav>

          {/* Actions: Login & Register */}
          <div className="flex items-center gap-3">
            {/* If user already has an active workspace session */}
            {isClient && tenantId && (
              <Link
                href="/dashboard"
                className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dashboard ({tenantName}) &rarr;</span>
              </Link>
            )}

            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-all border border-slate-700/60"
            >
              Log In
            </Link>

            <Link
              href="/register"
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>14-Day Free Trial</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-600/20 to-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>All-In-One Cloud Platform for Gyms, Studios & Wellness Chains</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Run Your Gym & Fitness Business{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              On 100% Autopilot
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate spreadsheets and manual payment follow-ups. Automate customer CRM, WhatsApp renewal reminders,
            Indian GST tax invoices, and multi-staff roles with Webin10 OS.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-sm sm:text-base transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 group"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm sm:text-base transition-all border border-slate-700/80 flex items-center justify-center gap-2"
            >
              <span>Sign In to Workspace</span>
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-4 bg-slate-800/60 hover:bg-slate-700/60 text-emerald-300 font-semibold rounded-2xl text-xs sm:text-sm transition-all border border-emerald-500/30 flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Explore Demo Workspace &rarr;</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instant Dual-OTP (Email + Phone)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Indian GST 18% Tax Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>99.9% Uptime Cloud SLA</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOUR CORE CAPABILITIES GRID */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Engineered For Modern Business
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything Your Gym or Studio Needs to Grow
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Replace 5 disconnected tools with one unified business operating platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: WhatsApp */}
            <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Automated WhatsApp Hub</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send 3-day prior fee reminders, welcome greeting kits, invoice receipts, and class schedules directly to
                member phones.
              </p>
              <div className="pt-2 text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span>Live WhatsApp Triggers</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2: GST Billing */}
            <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">100% Indian GST Invoices</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                SAC 998314 compliant tax invoices with CGST & SGST breakdown, discount promo coupons (WELCOME50), and
                1-click PDF downloads.
              </p>
              <div className="pt-2 text-xs font-bold text-teal-400 flex items-center gap-1">
                <span>ITC Claim Ready</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3: Staff Management */}
            <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Role Staff Roster</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Invite managers, receptionists, accountants, and trainers. Control branch permissions and track staff
                operational audits.
              </p>
              <div className="pt-2 text-xs font-bold text-indigo-400 flex items-center gap-1">
                <span>Role-Based Security</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4: CRM & Retention */}
            <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Customer CRM & Retention</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track active, expired, and fee-due members. Spot drop-out risk before it happens and re-engage members
                with 1-click broadcasts.
              </p>
              <div className="pt-2 text-xs font-bold text-amber-400 flex items-center gap-1">
                <span>Zero Member Churn</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING PLANS */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Simple, Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Start Free. Upgrade As You Scale.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Every plan includes a 14-day free trial. Zero setup fees. Cancel anytime.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="pt-4 inline-flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('ANNUAL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'ANNUAL'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-200 text-[10px] font-black rounded-md">
                  2 MONTHS FREE
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan 1 */}
            <div className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-extrabold text-lg text-white">Starter Tier</h3>
                <p className="text-xs text-slate-400 mt-1">For single boutique fitness clubs and yoga studios.</p>
                <div className="my-6">
                  <span className="text-3xl font-black text-white">
                    ₹{billingCycle === 'ANNUAL' ? '9,990' : '999'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    /{billingCycle === 'ANNUAL' ? 'year' : 'month'} + GST
                  </span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Up to 500 Active Customers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>3 Team Staff Accounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>1 Business Branch</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Automated WhatsApp Alerts</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs text-center transition-all border border-slate-700"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Plan 2 - Featured */}
            <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 flex flex-col justify-between space-y-6 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase rounded-full tracking-wider">
                Most Popular
              </span>
              <div>
                <h3 className="font-extrabold text-lg text-white">Growth Tier</h3>
                <p className="text-xs text-slate-400 mt-1">For growing fitness centers and multi-staff gyms.</p>
                <div className="my-6">
                  <span className="text-3xl font-black text-emerald-400">
                    ₹{billingCycle === 'ANNUAL' ? '24,990' : '2,499'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    /{billingCycle === 'ANNUAL' ? 'year' : 'month'} + GST
                  </span>
                </div>
                <ul className="space-y-3 text-xs text-slate-200 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Up to 2,000 Active Customers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>8 Team Staff Members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>2 Business Branches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>High-Volume WhatsApp Blast</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Coupon Codes (WELCOME50)</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs text-center transition-all shadow-md shadow-emerald-500/20"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-extrabold text-lg text-white">Enterprise Tier</h3>
                <p className="text-xs text-slate-400 mt-1">For multi-location gym chains and franchise clubs.</p>
                <div className="my-6">
                  <span className="text-3xl font-black text-white">
                    ₹{billingCycle === 'ANNUAL' ? '49,990' : '4,999'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    /{billingCycle === 'ANNUAL' ? 'year' : 'month'} + GST
                  </span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Up to 10,000 Customers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>25 Team Staff Accounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>5 Business Branches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Dedicated Support & SLA</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs text-center transition-all border border-slate-700"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CTA BANNER */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Upgrade Your Fitness Business?
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm">
              Join hundreds of fitness entrepreneurs running their business smoothly on Webin10 Cloud OS. Setup takes less than 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-emerald-950 font-black rounded-xl text-sm transition-all shadow-lg hover:bg-emerald-50"
              >
                Start 14-Day Free Trial Now &rarr;
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-900/60 text-white font-bold rounded-xl text-sm transition-all border border-emerald-400/30 hover:bg-emerald-900"
              >
                Sign In to Business
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="border-t border-slate-800 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
              W
            </div>
            <span className="font-bold text-slate-400">Webin10 Business OS &bull; 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300">
              Business Login
            </Link>
            <Link href="/register" className="hover:text-slate-300">
              Register Business
            </Link>
            <Link href="/dashboard" className="hover:text-slate-300">
              Demo Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
