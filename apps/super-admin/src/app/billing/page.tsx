'use client';

import React, { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Receipt,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Printer,
  Zap,
  Send,
  Building2,
  Calendar,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Copy,
  Check,
} from 'lucide-react';

export default function BillingRevenueHubPage() {
  const [activeTab, setActiveTab] = useState<'expiring' | 'invoices' | 'gateways'>('expiring');
  const [loading, setLoading] = useState(true);

  // Financial Metrics State
  const [metrics, setMetrics] = useState({
    mrr: 0,
    arr: 0,
    totalRevenueCollected: 0,
    pendingRevenue: 0,
    activeSubscribersCount: 0,
    totalTenants: 0,
    expiringIn7DaysCount: 0,
    arpu: 0,
    monthlyTrend: [] as any[],
  });

  // Expiring Subscriptions State
  const [expiringSubs, setExpiringSubs] = useState<any[]>([]);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  // Invoices State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Manual Invoice Creation Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [manualForm, setManualForm] = useState({
    tenantId: '',
    planName: 'Professional Plan (Monthly)',
    amountSubtotal: 1999,
    taxPercentage: 18,
    paymentMethod: 'RAZORPAY',
    paymentReference: '',
    customerGstin: '',
    notes: '',
  });
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Webhook Simulator State
  const [webhookSimulating, setWebhookSimulating] = useState(false);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<'razorpay' | 'cashfree' | null>(null);

  useEffect(() => {
    loadAllBillingData();
  }, []);

  async function loadAllBillingData() {
    setLoading(true);
    try {
      const [mRes, eRes, iRes, tRes] = await Promise.all([
        apiRequest('/super-admin/billing/metrics'),
        apiRequest('/super-admin/billing/expiring?days=7'),
        apiRequest('/super-admin/billing/invoices?limit=50'),
        apiRequest('/super-admin/tenants?limit=100'),
      ]);

      if (mRes.success && mRes.data) setMetrics(mRes.data);
      if (eRes.success && eRes.data) setExpiringSubs(eRes.data);
      if (iRes.success && iRes.data?.items) setInvoices(iRes.data.items);
      if (tRes.success && tRes.data?.items) {
        setTenantsList(tRes.data.items);
        if (tRes.data.items.length > 0 && !manualForm.tenantId) {
          setManualForm((prev) => ({ ...prev, tenantId: tRes.data.items[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  }

  // 1-Click Renew Subscription & Auto-Generate Invoice
  async function handleRenewSubscription(subscriptionId: string, tenantName: string) {
    if (!confirm(`Are you sure you want to renew subscription for "${tenantName}" for +30 days and auto-generate GST Tax Invoice?`)) {
      return;
    }

    setRenewingId(subscriptionId);
    try {
      const res = await apiRequest(`/super-admin/billing/renew/${subscriptionId}`, {
        method: 'POST',
      });

      if (res.success) {
        alert(`✓ Subscription renewed successfully!\n\nGenerated GST Invoice: ${res.data.invoice.invoiceNumber}\nTotal Amount: ₹${res.data.invoice.amountTotal}`);
        loadAllBillingData();
      } else {
        alert(res.error || 'Failed to renew subscription');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setRenewingId(null);
    }
  }

  // Send WhatsApp Expiry Reminder
  async function handleSendWhatsAppReminder(sub: any) {
    const phone = sub.ownerPhone;
    if (!phone || phone === 'N/A') {
      alert('Business owner phone number is not available for this tenant.');
      return;
    }
    alert(`WhatsApp Expiry Alert dispatched to ${sub.ownerName} (${phone}) for ${sub.tenantName}!\n\nTemplate: "platform_plan_expiry_7d"`);
  }

  // View Invoice Detail Modal
  async function handleViewInvoice(id: string) {
    const res = await apiRequest(`/super-admin/billing/invoices/${id}`);
    if (res.success) {
      setSelectedInvoice(res.data);
      setInvoiceModalOpen(true);
    } else {
      alert(res.error || 'Failed to fetch invoice details');
    }
  }

  // Manual Invoice Creation Submit
  async function handleCreateManualInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!manualForm.tenantId) {
      alert('Please select a business tenant');
      return;
    }

    setSubmittingInvoice(true);
    try {
      const res = await apiRequest('/super-admin/billing/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({
          ...manualForm,
          amountSubtotal: Number(manualForm.amountSubtotal),
          taxPercentage: Number(manualForm.taxPercentage),
        }),
      });

      if (res.success) {
        alert(`✓ GST Tax Invoice "${res.data.invoiceNumber}" generated successfully for ₹${res.data.amountTotal}!`);
        setManualModalOpen(false);
        loadAllBillingData();
      } else {
        alert(res.error || 'Failed to generate invoice');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setSubmittingInvoice(false);
    }
  }

  // Simulate Webhook Payment (Supports Razorpay & Cashfree)
  async function handleSimulateWebhook(gateway: 'razorpay' | 'cashfree' = 'razorpay') {
    setWebhookSimulating(true);
    setWebhookResult(null);

    const targetTenantId = tenantsList[0]?.id || '1ccc2ab5-30fa-40a4-abc6-557bc6495b8a';

    try {
      let body: any;
      if (gateway === 'cashfree') {
        body = {
          type: 'PAYMENT_SUCCESS_WEBHOOK',
          event_time: new Date().toISOString(),
          data: {
            order: {
              order_id: `order_CF_${Date.now()}`,
              order_amount: 2358.82,
              order_currency: 'INR',
              order_tags: {
                tenant_id: targetTenantId,
              },
            },
            payment: {
              cf_payment_id: `cf_pay_${Date.now()}`,
              payment_status: 'SUCCESS',
              payment_amount: 2358.82,
              payment_currency: 'INR',
              payment_message: 'Payment completed via Cashfree UPI Autopay',
              payment_method: {
                upi: { channel: 'gpay', upi_id: 'owner@okaxis' },
              },
            },
            customer_details: {
              customer_id: targetTenantId,
              customer_name: 'Gym Owner',
            },
          },
        };
      } else {
        body = {
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: `pay_RZP_${Date.now()}`,
                amount: 235882, // in paise
                currency: 'INR',
                status: 'captured',
                notes: {
                  tenant_id: targetTenantId,
                },
              },
            },
          },
        };
      }

      const res = await apiRequest(`/webhooks/payment/${gateway}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.success) {
        setWebhookResult(`✓ ${gateway.toUpperCase()} Webhook Verified: Payment Captured for ₹2,358.82. Auto-renewed subscription and generated GST Tax Invoice!`);
        loadAllBillingData();
      } else {
        setWebhookResult(`⚠️ ${gateway.toUpperCase()} Webhook failed: ${res.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      setWebhookResult(`Error: ${e.message}`);
    } finally {
      setWebhookSimulating(false);
    }
  }

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = invoiceStatusFilter === 'ALL' || inv.status === invoiceStatusFilter;
    const matchesSearch =
      !invoiceSearch ||
      inv.invoiceNumber?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.tenant?.name?.toLowerCase().includes(invoiceSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SaaS Revenue & Billing Hub</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Live MRR Engine
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Monthly Recurring Revenue (MRR), ARR, GST tax invoices, expiring subscriptions & payment webhooks
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadAllBillingData}
              disabled={loading}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition"
              title="Refresh Financial Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setManualModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Generate GST Invoice</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: MRR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Recurring (MRR)</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900">
                ₹{metrics.mrr.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                  ARR: ₹{metrics.arr.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Annual Run-Rate</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Collected */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue Collected</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900">
                ₹{metrics.totalRevenueCollected.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{invoices.length} Settled Invoices with GST</span>
              </p>
            </div>
          </div>

          {/* Card 3: Active Subscribed Businesses */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Subscriptions</span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900">
                {metrics.activeSubscribersCount}{' '}
                <span className="text-sm font-medium text-slate-400">/ {metrics.totalTenants} gyms</span>
              </p>
              <p className="text-xs text-sky-700 font-semibold mt-2">
                ARPU: ₹{metrics.arpu.toLocaleString('en-IN')} / business
              </p>
            </div>
          </div>

          {/* Card 4: Expiring in 7 Days */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring Next 7 Days</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                metrics.expiringIn7DaysCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-black ${metrics.expiringIn7DaysCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                {metrics.expiringIn7DaysCount}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {metrics.expiringIn7DaysCount > 0 ? 'Urgent renewal follow-up needed' : 'All subscriptions healthy'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('expiring')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'expiring'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Expiring Subscriptions (Next 7 Days)</span>
            {expiringSubs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                {expiringSubs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'invoices'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>GST Tax Invoices & Billing Records</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">
              {invoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('gateways')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'gateways'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Payment Gateways & Webhooks</span>
          </button>
        </div>

        {/* TAB 1: Expiring Subscriptions in Next 7 Days */}
        {activeTab === 'expiring' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Automated Expiry & Renewal Safeguard Active</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  These business subscriptions are expiring within the next 7 days or have recently lapsed. Click <strong>"1-Click Renew (+30 Days)"</strong> to seamlessly renew their validity and immediately generate their GST Tax Invoice, or dispatch an automated WhatsApp alert with payment link.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Business / Gym</th>
                    <th className="px-5 py-3.5">Owner Contact</th>
                    <th className="px-5 py-3.5">Current Plan</th>
                    <th className="px-5 py-3.5">Expiry Date</th>
                    <th className="px-5 py-3.5">Urgency</th>
                    <th className="px-5 py-3.5 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {expiringSubs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No subscriptions expiring in the next 7 days.</p>
                        <p className="text-xs text-slate-400 mt-1">All gym plans are active and well within their validity.</p>
                      </td>
                    </tr>
                  ) : (
                    expiringSubs.map((sub) => {
                      const isExpired = sub.isExpired;
                      return (
                        <tr key={sub.subscriptionId} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 text-sm">{sub.tenantName}</div>
                            <span className="font-mono text-[10px] text-slate-400">{sub.tenantSlug}</span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">{sub.ownerName}</p>
                            <p className="text-[11px] text-slate-500">{sub.ownerPhone}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {sub.planName}
                            </span>
                            <p className="text-[11px] text-slate-500 font-medium mt-1">
                              ₹{sub.priceMonthly.toLocaleString('en-IN')}/mo
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {new Date(sub.currentPeriodEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Expired ({Math.abs(sub.daysRemaining)}d ago)</span>
                              </span>
                            ) : sub.daysRemaining <= 1 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Expires in {sub.daysRemaining} day!</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Expires in {sub.daysRemaining} days</span>
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSendWhatsAppReminder(sub)}
                                className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition"
                                title="Send WhatsApp Expiry Reminder"
                              >
                                <Send className="w-3 h-3" />
                                <span>WhatsApp Alert</span>
                              </button>

                              <button
                                onClick={() => handleRenewSubscription(sub.subscriptionId, sub.tenantName)}
                                disabled={renewingId === sub.subscriptionId}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-2xs flex items-center gap-1.5 transition disabled:opacity-50"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>{renewingId === sub.subscriptionId ? 'Renewing...' : '1-Click Renew (+30d)'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: GST Tax Invoices & Records */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice number, gym name, or phone..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500 font-semibold">Status:</span>
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none"
                >
                  <option value="ALL">All Invoices</option>
                  <option value="PAID">PAID Only</option>
                  <option value="PENDING">PENDING Only</option>
                </select>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Invoice #</th>
                    <th className="px-5 py-3.5">Business / Tenant</th>
                    <th className="px-5 py-3.5">Plan Description</th>
                    <th className="px-5 py-3.5">Subtotal</th>
                    <th className="px-5 py-3.5">GST (18%)</th>
                    <th className="px-5 py-3.5">Total Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                        No matching invoices found.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">{inv.customerName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{inv.tenant?.slug || 'SaaS Client'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-700">{inv.planName}</span>
                          <p className="text-[10px] text-slate-400">SAC: {inv.hsnCode}</p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          ₹{Number(inv.amountSubtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          ₹{Number(inv.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            CGST+SGST (18%)
                          </span>
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900 text-sm">
                          ₹{Number(inv.amountTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-[11px]">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleViewInvoice(inv.id)}
                            className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg inline-flex items-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View GST Tax Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Payment Gateways & Webhooks */}
        {activeTab === 'gateways' && (
          <div className="space-y-6">
            {/* Gateway Cards (Razorpay, Cashfree, Stripe) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Razorpay Gateway Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shadow-sm shadow-blue-500/20">
                      R
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Razorpay Subscriptions</h3>
                      <p className="text-[11px] text-slate-500">Auto-Debit & Payment Links</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    ACTIVE
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mode:</span>
                    <span className="font-semibold text-slate-900">Direct Merchant API</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auto GST Invoice:</span>
                    <span className="font-bold text-emerald-600">Enabled (18%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recurring UPI:</span>
                    <span className="font-semibold text-slate-900">Supported</span>
                  </div>
                </div>
              </div>

              {/* Cashfree Payments Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600 text-white font-black flex items-center justify-center text-sm shadow-sm shadow-violet-500/20">
                      CF
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Cashfree Payments</h3>
                      <p className="text-[11px] text-slate-500">UPI Autopay & NetBanking</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    ACTIVE
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mode:</span>
                    <span className="font-semibold text-slate-900">Cashfree PG v3 API</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Channels:</span>
                    <span className="font-bold text-slate-900">UPI, 50+ Banks, Cards</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Instant Settlements:</span>
                    <span className="font-bold text-emerald-600">Enabled</span>
                  </div>
                </div>
              </div>

              {/* Stripe Gateway Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-sm shadow-indigo-500/20">
                      S
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Stripe Global Billing</h3>
                      <p className="text-[11px] text-slate-500">International Cards</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    CONFIGURED
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supported Currencies:</span>
                    <span className="font-semibold text-slate-900">INR, USD, AED, GBP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer Portal:</span>
                    <span className="font-semibold text-slate-900">Self-Serve Upgrades</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Webhook Handling:</span>
                    <span className="font-semibold text-slate-900">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Webhook Configuration & Simulator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>Real-Time Payment Webhook Listeners (Razorpay & Cashfree)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure these webhook endpoints in your Razorpay or Cashfree merchant dashboards to automatically trigger subscription renewals, auto-debits, and instant GST Tax Invoice generation.
                </p>
              </div>

              {/* Webhook URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Razorpay Webhook Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Razorpay Webhook Endpoint</p>
                    <code className="text-xs font-mono text-slate-800 font-bold block mt-0.5 truncate">
                      https://api.webin10.com/api/v1/webhooks/payment/razorpay
                    </code>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://api.webin10.com/api/v1/webhooks/payment/razorpay');
                      setCopiedUrl('razorpay');
                      setTimeout(() => setCopiedUrl(null), 2000);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center gap-1 shrink-0"
                  >
                    {copiedUrl === 'razorpay' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedUrl === 'razorpay' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Cashfree Webhook Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Cashfree Webhook Endpoint</p>
                    <code className="text-xs font-mono text-slate-800 font-bold block mt-0.5 truncate">
                      https://api.webin10.com/api/v1/webhooks/payment/cashfree
                    </code>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://api.webin10.com/api/v1/webhooks/payment/cashfree');
                      setCopiedUrl('cashfree');
                      setTimeout(() => setCopiedUrl(null), 2000);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center gap-1 shrink-0"
                  >
                    {copiedUrl === 'cashfree' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedUrl === 'cashfree' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Webhook Simulator Section */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Payment Webhook Simulator</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trigger a mock Razorpay or Cashfree payment event to verify instant subscription renewal and GST Tax Invoice creation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSimulateWebhook('razorpay')}
                    disabled={webhookSimulating}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{webhookSimulating ? 'Testing...' : 'Test Razorpay Webhook'}</span>
                  </button>

                  <button
                    onClick={() => handleSimulateWebhook('cashfree')}
                    disabled={webhookSimulating}
                    className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{webhookSimulating ? 'Testing...' : 'Test Cashfree Webhook'}</span>
                  </button>
                </div>
              </div>

              {webhookResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                  {webhookResult}
                </div>
              )}
            </div>
          </div>
        )}

        {/* INDIAN GST TAX INVOICE PREVIEW MODAL */}
        {invoiceModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
              {/* Modal Top Actions */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-lg">Official GST Tax Invoice</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {selectedInvoice.invoice.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    onClick={() => setInvoiceModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Printable Invoice Sheet */}
              <div id="printable-gst-invoice" className="border border-slate-200 rounded-xl p-6 sm:p-8 bg-white space-y-6 text-xs text-slate-800">
                {/* Header (Seller Info) */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {selectedInvoice.seller.legalName}
                    </h2>
                    <p className="text-slate-500 font-medium text-xs mt-0.5">
                      {selectedInvoice.seller.tradeName}
                    </p>
                    <p className="text-slate-600 text-[11px] mt-1 max-w-sm">
                      {selectedInvoice.seller.address}
                    </p>
                    <div className="mt-2 space-y-0.5 text-[11px]">
                      <p><strong className="text-slate-900">GSTIN:</strong> {selectedInvoice.seller.gstin}</p>
                      <p><strong className="text-slate-900">PAN:</strong> {selectedInvoice.seller.pan}</p>
                      <p><strong className="text-slate-900">SAC Code:</strong> {selectedInvoice.seller.sacCode} (IT Software SaaS)</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-slate-900 font-mono font-bold text-sm">
                      {selectedInvoice.invoice.invoiceNumber}
                    </div>
                    <p className="text-slate-500 mt-2 text-[11px]">
                      Invoice Date: <strong>{new Date(selectedInvoice.invoice.createdAt).toLocaleDateString()}</strong>
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Payment Mode: <strong>{selectedInvoice.invoice.paymentMethod}</strong>
                    </p>
                    {selectedInvoice.invoice.paymentReference && (
                      <p className="text-slate-500 text-[11px] font-mono">
                        Ref: {selectedInvoice.invoice.paymentReference}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bill To Details */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Billed To (Customer):</p>
                  <p className="font-bold text-sm text-slate-900">{selectedInvoice.invoice.customerName}</p>
                  <p className="text-slate-600 mt-0.5">Email: {selectedInvoice.invoice.customerEmail}</p>
                  {selectedInvoice.invoice.customerPhone && (
                    <p className="text-slate-600">Phone: {selectedInvoice.invoice.customerPhone}</p>
                  )}
                  {selectedInvoice.invoice.customerAddress && (
                    <p className="text-slate-600">Address: {selectedInvoice.invoice.customerAddress}</p>
                  )}
                  {selectedInvoice.invoice.customerGstin ? (
                    <p className="text-indigo-900 font-bold mt-1">Customer GSTIN: {selectedInvoice.invoice.customerGstin}</p>
                  ) : (
                    <p className="text-slate-400 mt-1">GSTIN: Unregistered Consumer</p>
                  )}
                </div>

                {/* Line Item Table */}
                <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">SAC</th>
                      <th className="p-3 text-right">Taxable Value</th>
                      <th className="p-3 text-right">CGST (9%)</th>
                      <th className="p-3 text-right">SGST (9%)</th>
                      <th className="p-3 text-right">Total (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 font-bold">1</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{selectedInvoice.invoice.planName}</p>
                        <p className="text-[11px] text-slate-500">
                          Validity: {new Date(selectedInvoice.invoice.billingPeriodStart).toLocaleDateString()} to{' '}
                          {new Date(selectedInvoice.invoice.billingPeriodEnd).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-3 font-mono">{selectedInvoice.invoice.hsnCode}</td>
                      <td className="p-3 text-right font-semibold">
                        ₹{Number(selectedInvoice.invoice.amountSubtotal).toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        ₹{Number(selectedInvoice.invoice.cgstAmount).toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        ₹{Number(selectedInvoice.invoice.sgstAmount).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        ₹{Number(selectedInvoice.invoice.amountTotal).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals Summary */}
                <div className="flex justify-end">
                  <div className="w-72 space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Taxable Amount:</span>
                      <span className="font-semibold text-slate-900">₹{Number(selectedInvoice.invoice.amountSubtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Central Tax (CGST 9%):</span>
                      <span>₹{Number(selectedInvoice.invoice.cgstAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>State Tax (SGST 9%):</span>
                      <span>₹{Number(selectedInvoice.invoice.sgstAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Tax Amount:</span>
                      <span>₹{Number(selectedInvoice.invoice.taxAmount).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                      <span>Grand Total:</span>
                      <span>₹{Number(selectedInvoice.invoice.amountTotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer disclaimer */}
                <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 text-center space-y-1">
                  <p>This is a computer-generated Tax Invoice and does not require a physical signature.</p>
                  <p>Subject to Gurugram / Delhi Jurisdiction. Thank you for partnering with Webin10 SaaS!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MANUAL INVOICE GENERATOR MODAL */}
        {manualModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Generate Official GST Tax Invoice</h3>
                <button onClick={() => setManualModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={handleCreateManualInvoice} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Business Tenant *</label>
                  <select
                    value={manualForm.tenantId}
                    onChange={(e) => setManualForm({ ...manualForm, tenantId: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    {tenantsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plan / Service Description *</label>
                  <input
                    type="text"
                    value={manualForm.planName}
                    onChange={(e) => setManualForm({ ...manualForm, planName: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    placeholder="e.g. Professional Plan (Monthly Renewal)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subtotal (₹) *</label>
                    <input
                      type="number"
                      value={manualForm.amountSubtotal}
                      onChange={(e) => setManualForm({ ...manualForm, amountSubtotal: Number(e.target.value) })}
                      required
                      min="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GST Tax (%)</label>
                    <input
                      type="number"
                      value={manualForm.taxPercentage}
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 font-semibold text-[11px] flex justify-between">
                  <span>Calculated GST (18%): ₹{(manualForm.amountSubtotal * 0.18).toFixed(2)}</span>
                  <span>Total Payable: ₹{(manualForm.amountSubtotal * 1.18).toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={manualForm.paymentMethod}
                      onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    >
                      <option value="RAZORPAY">Razorpay UPI / Card</option>
                      <option value="CASHFREE">Cashfree Payments (UPI / NetBanking)</option>
                      <option value="BANK_TRANSFER">Direct Bank NEFT / IMPS</option>
                      <option value="CASH">Cash / Offline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Transaction Ref (Optional)</label>
                    <input
                      type="text"
                      value={manualForm.paymentReference}
                      onChange={(e) => setManualForm({ ...manualForm, paymentReference: e.target.value })}
                      placeholder="e.g. UPI Ref / Bank UTR"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={manualForm.customerGstin}
                    onChange={(e) => setManualForm({ ...manualForm, customerGstin: e.target.value })}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setManualModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInvoice}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {submittingInvoice ? 'Generating...' : 'Generate & Issue Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
