'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BusinessShell } from '@/components/business-shell';
import {
  Users,
  CreditCard,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ArrowUpRight,
  Send,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';

const API_BASE = 'http://localhost:4000/api/v1';
const DEMO_TENANT_ID = '1ccc2ab5-30fa-40a4-abc6-557bc6495b8a';

export default function BusinessDashboard() {
  const [counts, setCounts] = useState({ total: 5, active: 3, expired: 1, feeDue: 2, leads: 1 });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/whatsapp/customers/${DEMO_TENANT_ID}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.counts) setCounts(d.data.counts);
      })
      .catch(console.error);

    fetch(`${API_BASE}/whatsapp/campaigns/${DEMO_TENANT_ID}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCampaigns(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <BusinessShell>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Smart Business Operating System Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good afternoon, FitZone Club 👋
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-2 leading-relaxed">
              Your automated WhatsApp reminders, QR attendance, and fee collection systems are running smoothly. All 4 background triggers are active.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/whatsapp"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-50 transition-all shadow-md shadow-black/10"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Launch WhatsApp Blast</span>
              </Link>

              <Link
                href="/customers"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-600/50 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manage Members ({counts.total})</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Main KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Active Members</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{counts.active}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Out of {counts.total} registered</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Fee Overdue / Pending</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-2">{counts.feeDue}</p>
            <p className="text-[11px] text-slate-500 mt-1">Auto reminders active</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">WhatsApp Campaigns</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{campaigns.length}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">78.4% open rate</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Monthly Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">₹48,500</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">+14.2% vs last month</p>
          </div>
        </div>

        {/* Action Widgets & Live Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick WhatsApp Reminder Action */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Fee Due in Next 3 Days</h3>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                {counts.feeDue} Members
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">Rahul Verma</p>
                  <p className="text-slate-500 text-[11px]">Due ₹1,500 &bull; Expiry in 2 days</p>
                </div>
                <Link
                  href="/whatsapp"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Remind</span>
                </Link>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">Sneha Gupta</p>
                  <p className="text-slate-500 text-[11px]">Due ₹2,000 &bull; Expiry Tomorrow</p>
                </div>
                <Link
                  href="/whatsapp"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Remind</span>
                </Link>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/whatsapp"
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open WhatsApp Hub</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Active Automations Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Automated Event Triggers Status</h3>
              </div>
              <span className="text-xs text-emerald-700 font-bold">100% Operational</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">New Member Welcome</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Triggers instant greeting with Member ID pass link upon registration.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">3-Day Prior Fee Renewal</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Sends payment link before membership expires to avoid churn.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Payment Invoice Receipt</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Instant PDF tax invoice download link sent to WhatsApp.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Class Absence Notice</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Sends notice to parents/member if marked absent in daily attendance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BusinessShell>
  );
}
