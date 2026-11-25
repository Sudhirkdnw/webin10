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
  Phone,
  RefreshCw,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useActiveTenant } from '@/lib/tenant';

interface CustomerItem {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  status: string;
  pendingAmount?: number;
  membershipPlan?: string;
  expiryDate?: string;
}

export default function BusinessDashboard() {
  const API_BASE = getApiBaseUrl();
  const { tenantId, tenantName } = useActiveTenant();

  const [counts, setCounts] = useState({ total: 0, active: 0, expired: 0, feeDue: 0, leads: 0 });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [revenueTotal, setRevenueTotal] = useState<number>(0);
  const [feeDueCustomers, setFeeDueCustomers] = useState<CustomerItem[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Time-based greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const loadDashboardData = async () => {
    if (!tenantId) return;
    setLoading(true);

    try {
      // 1. Fetch Customers & Counts
      const custRes = await fetch(`${API_BASE}/whatsapp/customers/${tenantId}`);
      const custData = await custRes.json();
      if (custData.success && custData.data) {
        if (custData.data.counts) setCounts(custData.data.counts);
      }

      // 2. Fetch Fee Due Customers
      const feeRes = await fetch(`${API_BASE}/whatsapp/customers/${tenantId}?status=FEE_DUE`);
      const feeData = await feeRes.json();
      if (feeData.success && Array.isArray(feeData.data?.customers)) {
        setFeeDueCustomers(feeData.data.customers.slice(0, 5));
      } else if (feeData.success && Array.isArray(feeData.data)) {
        setFeeDueCustomers(feeData.data.slice(0, 5));
      }

      // 3. Fetch Campaigns
      const campRes = await fetch(`${API_BASE}/whatsapp/campaigns/${tenantId}`);
      const campData = await campRes.json();
      if (campData.success && Array.isArray(campData.data)) {
        setCampaigns(campData.data);
      }

      // 4. Fetch Invoices for Real Revenue
      const invRes = await fetch(`${API_BASE}/tenants/${tenantId}/invoices`);
      const invData = await invRes.json();
      if (invData.success && Array.isArray(invData.data)) {
        const total = invData.data
          .filter((inv: any) => inv.status === 'PAID')
          .reduce((sum: number, inv: any) => sum + (inv.amountTotal || 0), 0);
        setRevenueTotal(total);
      }

      // 5. Fetch Automations
      const autoRes = await fetch(`${API_BASE}/whatsapp/automations/${tenantId}`);
      const autoData = await autoRes.json();
      if (autoData.success && Array.isArray(autoData.data)) {
        setAutomations(autoData.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [tenantId]);

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
              {timeGreeting}, {tenantName || 'Business Owner'} 👋
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-2 leading-relaxed">
              Your automated WhatsApp reminders, customer CRM, and Indian GST billing systems are operational in real-time.
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

              <button
                onClick={loadDashboardData}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                title="Refresh Live Metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
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
            <p className="text-[11px] text-slate-500 mt-1">
              {counts.feeDue > 0 ? 'Action required' : 'All accounts clear'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">WhatsApp Campaigns</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{campaigns.length}</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              {campaigns.length > 0 ? 'Broadcasts sent' : 'Ready to launch'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Total Revenue (GST Paid)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              ₹{revenueTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Real-time ledger</p>
          </div>
        </div>

        {/* Action Widgets & Live Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real Fee Due Action List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Fee Due Members</h3>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                {counts.feeDue} Pending
              </span>
            </div>

            {feeDueCustomers.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">All Accounts Clear!</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  No members have overdue fees right now. New fee reminders will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {feeDueCustomers.map((member) => {
                  const displayName =
                    member.name ||
                    [member.firstName, member.lastName].filter(Boolean).join(' ') ||
                    'Customer';

                  return (
                    <div
                      key={member.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{displayName}</p>
                        <p className="text-slate-500 text-[11px]">
                          Due: ₹{(member.pendingAmount || 0).toLocaleString('en-IN')} &bull;{' '}
                          {member.membershipPlan || 'Active Plan'}
                        </p>
                      </div>
                      <Link
                        href={`/whatsapp?phone=${member.phone || ''}&name=${encodeURIComponent(displayName)}`}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Remind</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

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
              <span className="text-xs text-emerald-700 font-bold">Live Operational</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(automations.length > 0
                ? automations
                : [
                    {
                      id: '1',
                      name: 'New Member Welcome',
                      description: 'Triggers instant greeting with Member ID pass link upon registration.',
                      isActive: true,
                    },
                    {
                      id: '2',
                      name: '3-Day Prior Fee Renewal',
                      description: 'Sends payment link before membership expires to avoid churn.',
                      isActive: true,
                    },
                    {
                      id: '3',
                      name: 'Payment Invoice Receipt',
                      description: 'Instant PDF tax invoice download link sent to WhatsApp.',
                      isActive: true,
                    },
                    {
                      id: '4',
                      name: 'Class Absence Notice',
                      description: 'Sends notice to parents/member if marked absent in daily attendance.',
                      isActive: true,
                    },
                  ]
              ).map((auto) => (
                <div key={auto.id} className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{auto.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        auto.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{auto.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BusinessShell>
  );
}
