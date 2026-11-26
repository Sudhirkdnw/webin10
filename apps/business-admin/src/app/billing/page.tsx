'use client';

import React, { useState, useEffect } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  Tag,
  ArrowRight,
  ShieldCheck,
  FileText,
  Download,
  Printer,
  X,
  AlertCircle,
  Clock,
  Zap,
  Users,
  Building,
  RefreshCw,
  QrCode,
  Smartphone,
  Lock,
  Copy,
  Check,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useActiveTenant } from '@/lib/tenant';

interface SubscriptionData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  currentSubscription: {
    id: string;
    planName: string;
    planSlug: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    daysRemaining: number;
    priceMonthly: number;
    features: string[];
  } | null;
  usage: {
    customersCount: number;
    maxCustomers: number;
    staffCount: number;
    maxStaff: number;
    branchesCount: number;
    maxBranches: number;
  };
  availablePlans: {
    id: string;
    name: string;
    slug: string;
    description: string;
    priceMonthly: number;
    priceAnnual: number;
    maxCustomers: number;
    maxStaff: number;
    maxBranches: number;
    isCurrent: boolean;
  }[];
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  planName: string;
  amountSubtotal: number;
  taxPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  taxAmount: number;
  amountTotal: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  tenantName: string;
  tenantGstin: string;
  tenantAddress: string;
}

export default function BillingPage() {
  const API_BASE = getApiBaseUrl();
  const { tenantId, tenantName } = useActiveTenant();

  const [activeTab, setActiveTab] = useState<'subscription' | 'invoices'>('subscription');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  // Upgrade state
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>('growth');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    description: string;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // Razorpay / UPI Gateway Checkout State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<any | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutTab, setCheckoutTab] = useState<'upi' | 'card'>('upi');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Selected Invoice for Modal
  const [viewInvoice, setViewInvoice] = useState<InvoiceRecord | null>(null);

  // Load subscription & invoices
  const loadData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([
        fetch(`${API_BASE}/tenants/${tenantId}/subscription`),
        fetch(`${API_BASE}/tenants/${tenantId}/invoices`),
      ]);

      const subJson = await subRes.json();
      if (subJson.success && subJson.data) {
        setData(subJson.data);
      }

      const invJson = await invRes.json();
      if (invJson.success && invJson.data) {
        setInvoices(invJson.data);
      }
    } catch (err) {
      console.error('Failed to load billing details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch(
        `${API_BASE}/public/coupons/validate?code=${encodeURIComponent(couponCode.trim())}&planSlug=${selectedPlanSlug}`,
      );
      const json = await res.json();
      if (json.success && json.data?.valid) {
        setCouponApplied({
          code: json.data.code,
          discountType: json.data.discountType,
          discountValue: json.data.discountValue,
          description: json.data.description,
        });
      } else {
        setCouponError(json.error?.message || json.data?.message || 'Invalid or expired coupon code');
        setCouponApplied(null);
      }
    } catch (err) {
      // Fallback for standard demo coupons if offline
      const codeUpper = couponCode.trim().toUpperCase();
      if (codeUpper === 'WELCOME50' || codeUpper === 'DIWALI50') {
        setCouponApplied({
          code: codeUpper,
          discountType: 'PERCENTAGE',
          discountValue: 50,
          description: '50% Festive Discount Applied!',
        });
        setCouponError('');
      } else if (codeUpper === 'FLAT500') {
        setCouponApplied({
          code: codeUpper,
          discountType: 'FIXED_AMOUNT',
          discountValue: 500,
          description: 'Flat ₹500 Instant Discount Applied!',
        });
        setCouponError('');
      } else {
        setCouponError('Coupon code could not be validated');
      }
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Initiate Razorpay / UPI Gateway Checkout Order
  const handleInitiateCheckout = async () => {
    if (!tenantId) return;
    setCheckoutLoading(true);
    setUpgradeError(null);

    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/subscription/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: selectedPlanSlug,
          billingCycle,
          couponCode: couponApplied?.code || undefined,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setCheckoutOrder(json.data);
        setPaymentSuccessData(null);
        setCheckoutModalOpen(true);
      } else {
        setUpgradeError(json.error?.message || json.message || 'Failed to create payment order');
      }
    } catch (err: any) {
      setUpgradeError(err.message || 'Error executing checkout transaction');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Confirm and Verify Gateway Payment
  const handleConfirmPayment = async (method: 'RAZORPAY_UPI' | 'RAZORPAY_CARD') => {
    if (!tenantId || !checkoutOrder) return;
    setPaymentProcessing(true);
    try {
      const paymentId = `pay_rzp_${Date.now().toString(36).toUpperCase()}`;
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/subscription/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: checkoutOrder.orderId,
          paymentId,
          planSlug: checkoutOrder.planSlug,
          billingCycle: checkoutOrder.billingCycle,
          couponCode: couponApplied?.code,
          paymentMethod: method === 'RAZORPAY_UPI' ? 'RAZORPAY_UPI' : 'RAZORPAY_CARD',
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setPaymentSuccessData(json.data);
        setUpgradeSuccess(`Payment of ₹${json.data.invoice?.amountTotal} successful! Plan activated.`);
        setCouponCode('');
        setCouponApplied(null);
        await loadData();
      } else {
        alert(json.error?.message || json.message || 'Payment verification failed');
      }
    } catch (err: any) {
      alert(`Payment error: ${err.message}`);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Pricing calculations
  const targetPlan = data?.availablePlans?.find((p) => p.slug === selectedPlanSlug);
  const basePrice = targetPlan
    ? billingCycle === 'ANNUAL'
      ? targetPlan.priceAnnual
      : targetPlan.priceMonthly
    : 0;

  let discountAmount = 0;
  if (couponApplied) {
    if (couponApplied.discountType === 'PERCENTAGE') {
      discountAmount = (basePrice * couponApplied.discountValue) / 100;
    } else {
      discountAmount = couponApplied.discountValue;
    }
  }
  const taxableAmount = Math.max(0, basePrice - discountAmount);
  const gstAmount = Number(((taxableAmount * 18) / 100).toFixed(2));
  const finalTotal = Number((taxableAmount + gstAmount).toFixed(2));

  return (
    <BusinessShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enterprise Billing & Subscriptions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Subscription & GST Invoices
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage your SaaS plan, apply discount coupons, and download 100% compliant Indian GST tax invoices.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl self-start sm:self-center">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'subscription'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Subscription & Plans
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'invoices'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>GST Invoices</span>
              {invoices.length > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  {invoices.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ======================= TAB 1: SUBSCRIPTION ======================= */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Current Plan Overview Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-4 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                      {data?.currentSubscription?.status || 'Active Plan'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {data?.currentSubscription?.daysRemaining ?? 30} Days Remaining
                    </span>
                  </div>

                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">
                      {data?.currentSubscription?.planName || 'Growth Business Tier'}
                    </h2>
                    <p className="text-slate-300 text-sm mt-1">
                      Your business workspace is currently unlocked with high-volume customer CRM, automated campaigns, and staff roles.
                    </p>
                  </div>

                  {/* Resource Usage Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                      <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1.5">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          Customers
                        </span>
                        <span className="font-bold text-white">
                          {data?.usage.customersCount || 0} / {data?.usage.maxCustomers || 2000}
                        </span>
                      </div>
                      <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                ((data?.usage.customersCount || 0) / (data?.usage.maxCustomers || 2000)) * 100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                      <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1.5">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          Team Staff
                        </span>
                        <span className="font-bold text-white">
                          {data?.usage.staffCount || 0} / {data?.usage.maxStaff || 5}
                        </span>
                      </div>
                      <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-400 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                ((data?.usage.staffCount || 0) / (data?.usage.maxStaff || 5)) * 100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                      <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1.5">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-amber-400" />
                          Branches
                        </span>
                        <span className="font-bold text-white">
                          {data?.usage.branchesCount || 1} / {data?.usage.maxBranches || 3}
                        </span>
                      </div>
                      <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                ((data?.usage.branchesCount || 1) / (data?.usage.maxBranches || 3)) * 100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side renewal CTA */}
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 flex flex-col justify-between shrink-0 lg:w-72">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-medium">Valid Until</span>
                    <p className="text-lg font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      {data?.currentSubscription?.currentPeriodEnd
                        ? new Date(data.currentSubscription.currentPeriodEnd).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Active Renewal'}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/10 mt-4">
                    <button
                      onClick={() => {
                        const el = document.getElementById('upgrade-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      Upgrade or Renew
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification messages */}
            {upgradeSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm font-semibold">{upgradeSuccess}</span>
              </div>
            )}
            {upgradeError && (
              <div className="p-4 bg-red-50 border border-red-300 text-red-900 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="text-sm font-semibold">{upgradeError}</span>
              </div>
            )}

            {/* Upgrade & Plan Matrix */}
            <div id="upgrade-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Choose Your Plan</h3>
                  <p className="text-sm text-slate-500">
                    Transparent pricing. Zero hidden fees. Instant GST tax invoices.
                  </p>
                </div>

                {/* Monthly / Annual Toggle */}
                <div className="inline-flex items-center gap-2 bg-slate-100 p-1 rounded-2xl self-start">
                  <button
                    onClick={() => setBillingCycle('MONTHLY')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      billingCycle === 'MONTHLY'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('ANNUAL')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      billingCycle === 'ANNUAL'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Annual Billing</span>
                    <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-950 text-[10px] font-black rounded-md">
                      2 MONTHS FREE
                    </span>
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(data?.availablePlans || [
                  {
                    id: '1',
                    slug: 'starter',
                    name: 'Starter Tier',
                    description: 'Ideal for single-location businesses, fitness studios, salons, clinics, and retail stores.',
                    priceMonthly: 499,
                    priceAnnual: 4990,
                    maxCustomers: 500,
                    maxStaff: 3,
                    maxBranches: 1,
                    isCurrent: false,
                  },
                  {
                    id: '2',
                    slug: 'growth',
                    name: 'Growth Tier',
                    description: 'Scale your business with multi-staff roles and high-volume WhatsApp automation.',
                    priceMonthly: 999,
                    priceAnnual: 9990,
                    maxCustomers: 2000,
                    maxStaff: 8,
                    maxBranches: 2,
                    isCurrent: true,
                  },
                  {
                    id: '3',
                    slug: 'enterprise',
                    name: 'Professional Tier',
                    description: 'Unlimited possibilities for multi-branch business chains, academies, and franchises.',
                    priceMonthly: 1999,
                    priceAnnual: 19990,
                    maxCustomers: 10000,
                    maxStaff: 25,
                    maxBranches: 5,
                    isCurrent: false,
                  },
                ]).map((plan) => {
                  const isSelected = selectedPlanSlug === plan.slug;
                  const price = billingCycle === 'ANNUAL' ? plan.priceAnnual : plan.priceMonthly;

                  return (
                    <div
                      key={plan.slug}
                      onClick={() => setSelectedPlanSlug(plan.slug)}
                      className={`relative rounded-3xl p-6 transition-all cursor-pointer border-2 flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/30 shadow-md ring-4 ring-emerald-100'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {plan.slug === 'growth' && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-extrabold uppercase rounded-full shadow-sm tracking-wide">
                          Most Popular
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-extrabold text-lg text-slate-900">{plan.name}</h4>
                          <input
                            type="radio"
                            name="planSelect"
                            checked={isSelected}
                            onChange={() => setSelectedPlanSlug(plan.slug)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>
                        <p className="text-xs text-slate-500 min-h-[32px]">{plan.description}</p>

                        <div className="my-5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900">
                              ₹{price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">
                              /{billingCycle === 'ANNUAL' ? 'year' : 'month'} + GST
                            </span>
                          </div>
                          {billingCycle === 'ANNUAL' && (
                            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                              Effective ₹{Math.round(price / 12).toLocaleString('en-IN')}/mo (Saved 2 Months!)
                            </p>
                          )}
                        </div>

                        {/* Features list */}
                        <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Up to <strong>{plan.maxCustomers.toLocaleString()}</strong> Active Customers
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Up to <strong>{plan.maxStaff}</strong> Team Staff Members
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Up to <strong>{plan.maxBranches}</strong> Business Branches
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Automated WhatsApp Reminders</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Instant GST Tax Invoices</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4">
                        <button
                          type="button"
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? 'Selected Plan' : 'Select Tier'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Checkout / Coupon Calculation Box */}
              <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 mt-8 space-y-6">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  Order Summary & Discount Coupons
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {/* Coupon Code Input */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700">Have a Promo Coupon Code?</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="e.g. WELCOME50 or DIWALI50"
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold tracking-wider uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        {validatingCoupon ? 'Validating...' : 'Apply Code'}
                      </button>
                    </div>

                    {couponApplied && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>{couponApplied.code}</strong>: {couponApplied.description}
                          </span>
                        </div>
                        <button
                          onClick={() => setCouponApplied(null)}
                          className="text-emerald-700 hover:text-emerald-900 font-bold underline ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {couponError && (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {couponError}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-400">
                      💡 Tip: Try <strong>WELCOME50</strong> or <strong>DIWALI50</strong> for instant 50% discount!
                    </p>
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-3">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Base Plan Price ({targetPlan?.name || 'Growth'}, {billingCycle}):</span>
                      <span className="font-semibold text-slate-900">₹{basePrice.toLocaleString('en-IN')}</span>
                    </div>

                    {couponApplied && (
                      <div className="flex justify-between text-xs text-emerald-600 font-bold">
                        <span>Coupon Discount ({couponApplied.code}):</span>
                        <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Taxable Subtotal:</span>
                      <span className="font-semibold text-slate-900">₹{taxableAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-600">
                      <span>18% GST (9% CGST + 9% SGST):</span>
                      <span className="font-semibold text-slate-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                      <div>
                        <span className="text-sm font-black text-slate-900">Total Payable Amount:</span>
                        <p className="text-[10px] text-slate-400">Inclusive of all Indian taxes</p>
                      </div>
                      <span className="text-2xl font-black text-emerald-700">
                        ₹{finalTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={handleInitiateCheckout}
                      disabled={checkoutLoading}
                      className="w-full mt-3 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
                    >
                      {checkoutLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Preparing Secure Checkout...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>Proceed to Payment (₹{finalTotal.toLocaleString('en-IN')})</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: GST INVOICES ======================= */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Billing History & GST Invoices</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download GST-compliant tax invoices for input tax credit (ITC) claims.
                </p>
              </div>
              <button
                onClick={loadData}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Invoices</span>
              </button>
            </div>

            {invoices.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No GST Invoices Found Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  When you renew or upgrade your SaaS plan, automated Indian GST tax invoices will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Plan / Tier</th>
                      <th className="py-3 px-4 text-right">Taxable Amount</th>
                      <th className="py-3 px-4 text-right">CGST (9%)</th>
                      <th className="py-3 px-4 text-right">SGST (9%)</th>
                      <th className="py-3 px-4 text-right">Total Paid</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{inv.planName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono">
                          ₹{inv.amountSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          ₹{inv.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          ₹{inv.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{inv.amountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase">
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View / Print</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================= RAZORPAY & UPI GATEWAY CHECKOUT MODAL ======================= */}
        {checkoutModalOpen && checkoutOrder && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
              {/* Top Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm block">Webin10 Gateway Checkout</span>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      256-bit SSL &bull; Razorpay & UPI Certified
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCheckoutModalOpen(false);
                    setPaymentSuccessData(null);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!paymentSuccessData ? (
                <div className="p-6 sm:p-7 space-y-6">
                  {/* Order Summary Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Subscribing To:</span>
                      <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                        {checkoutOrder.planName}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold uppercase">
                          {checkoutOrder.billingCycle}
                        </span>
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">Order: {checkoutOrder.orderId}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-medium">Payable Amount:</span>
                      <div className="text-2xl font-black text-emerald-700">
                        ₹{checkoutOrder.amountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-slate-400">Incl. 18% GST (₹{checkoutOrder.taxAmount})</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCheckoutTab('upi')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        checkoutTab === 'upi'
                          ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>Instant UPI & QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutTab('card')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        checkoutTab === 'card'
                          ? 'bg-white text-indigo-800 shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Razorpay Cards & Netbanking</span>
                    </button>
                  </div>

                  {/* TAB 1: UPI & QR CODE */}
                  {checkoutTab === 'upi' && (
                    <div className="space-y-4 text-center">
                      <div className="p-4 bg-white border-2 border-emerald-500/30 rounded-3xl inline-block shadow-md">
                        <svg
                          className="w-40 h-40 mx-auto"
                          viewBox="0 0 200 200"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="200" height="200" rx="10" fill="white" />
                          <rect x="15" y="15" width="45" height="45" rx="6" fill="#0f172a" />
                          <rect x="23" y="23" width="29" height="29" rx="3" fill="white" />
                          <rect x="30" y="30" width="15" height="15" fill="#0f172a" />

                          <rect x="140" y="15" width="45" height="45" rx="6" fill="#0f172a" />
                          <rect x="148" y="23" width="29" height="29" rx="3" fill="white" />
                          <rect x="155" y="30" width="15" height="15" fill="#0f172a" />

                          <rect x="15" y="140" width="45" height="45" rx="6" fill="#0f172a" />
                          <rect x="23" y="148" width="29" height="29" rx="3" fill="white" />
                          <rect x="30" y="155" width="15" height="15" fill="#0f172a" />

                          <rect x="70" y="20" width="10" height="10" fill="#0f172a" />
                          <rect x="90" y="20" width="10" height="10" fill="#0f172a" />
                          <rect x="110" y="20" width="10" height="10" fill="#0f172a" />
                          <rect x="70" y="40" width="10" height="10" fill="#0f172a" />
                          <rect x="100" y="40" width="10" height="10" fill="#0f172a" />
                          <rect x="120" y="40" width="10" height="10" fill="#0f172a" />
                          
                          <rect x="20" y="70" width="10" height="10" fill="#0f172a" />
                          <rect x="40" y="70" width="10" height="10" fill="#0f172a" />
                          <rect x="60" y="70" width="10" height="10" fill="#0f172a" />
                          <rect x="80" y="70" width="10" height="10" fill="#0f172a" />
                          <rect x="110" y="70" width="10" height="10" fill="#0f172a" />
                          <rect x="140" y="70" width="10" height="10" fill="#0f172a" />
                          <rect x="170" y="70" width="10" height="10" fill="#0f172a" />

                          <rect x="70" y="90" width="10" height="10" fill="#0f172a" />
                          <rect x="120" y="90" width="10" height="10" fill="#0f172a" />
                          <rect x="150" y="90" width="10" height="10" fill="#0f172a" />

                          <rect x="70" y="110" width="10" height="10" fill="#0f172a" />
                          <rect x="90" y="110" width="10" height="10" fill="#0f172a" />
                          <rect x="130" y="110" width="10" height="10" fill="#0f172a" />
                          <rect x="160" y="110" width="10" height="10" fill="#0f172a" />

                          <rect x="70" y="140" width="10" height="10" fill="#0f172a" />
                          <rect x="90" y="140" width="10" height="10" fill="#0f172a" />
                          <rect x="110" y="140" width="10" height="10" fill="#0f172a" />
                          <rect x="140" y="140" width="10" height="10" fill="#0f172a" />

                          <rect x="80" y="160" width="10" height="10" fill="#0f172a" />
                          <rect x="110" y="160" width="10" height="10" fill="#0f172a" />
                          <rect x="150" y="160" width="10" height="10" fill="#0f172a" />

                          <circle cx="100" cy="100" r="14" fill="#059669" />
                          <path d="M96 100L99 103L105 97" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">SCAN WITH GPAY / PHONEPE / PAYTM</p>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-xs font-mono bg-slate-100 py-2 px-3 rounded-xl max-w-xs mx-auto border border-slate-200">
                        <span className="text-slate-500 font-sans">UPI VPA:</span>
                        <span className="font-bold text-slate-900">{checkoutOrder.upiVpa}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(checkoutOrder.upiVpa);
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2000);
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500"
                          title="Copy UPI Address"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConfirmPayment('RAZORPAY_UPI')}
                        disabled={paymentProcessing}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                      >
                        {paymentProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verifying UPI Transaction & Issuing Invoice...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm & Complete UPI Payment (₹{checkoutOrder.amountRupees})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* TAB 2: RAZORPAY CARDS */}
                  {checkoutTab === 'card' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-bold text-slate-700">Razorpay Test Card (Auto-Filled)</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Instant Sandbox Mode
                          </span>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500">Card Number</label>
                          <input
                            type="text"
                            readOnly
                            value="4111 2222 3333 4444"
                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-500">Expiry Date</label>
                            <input
                              type="text"
                              readOnly
                              value="12/28"
                              className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-500">CVV</label>
                            <input
                              type="text"
                              readOnly
                              value="123"
                              className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConfirmPayment('RAZORPAY_CARD')}
                        disabled={paymentProcessing}
                        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                      >
                        {paymentProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing via Razorpay Gateway...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-300" />
                            <span>Pay ₹{checkoutOrder.amountRupees} with Razorpay ⚡</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* CELEBRATION / PAYMENT VERIFIED SUCCESS SCREEN */
                <div className="p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                      Payment Captured
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">
                      Payment of ₹{paymentSuccessData.invoice?.amountTotal} Successful! 🎉
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Your {paymentSuccessData.subscription?.plan?.name || 'SaaS Plan'} is now active. Official Indian GST Tax Invoice has been generated.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction ID:</span>
                      <span className="font-mono font-bold text-slate-900">{paymentSuccessData.paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice Number:</span>
                      <span className="font-mono font-bold text-indigo-700">{paymentSuccessData.invoice?.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Status:</span>
                      <span className="font-bold text-emerald-700">PAID (Instant Settlement)</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setViewInvoice(paymentSuccessData.invoice);
                        setCheckoutModalOpen(false);
                      }}
                      className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View & Print GST Tax Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutModalOpen(false);
                        setPaymentSuccessData(null);
                      }}
                      className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all"
                    >
                      Return to Subscriptions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= GST INVOICE MODAL ======================= */}
        {viewInvoice && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm">Tax Invoice: {viewInvoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / PDF</span>
                  </button>
                  <button
                    onClick={() => setViewInvoice(null)}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Body */}
              <div id="invoice-print-area" className="p-8 space-y-6 text-slate-800 text-xs">
                {/* Invoice Top: Brand + Metadata */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                        W
                      </div>
                      <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                        Webin10 Platform Ltd.
                      </span>
                    </div>
                    <p className="text-slate-500">Cloud Enterprise Software Solutions</p>
                    <p className="text-slate-500">Cyber City, DLF Phase II, Gurugram, HR - 122002</p>
                    <p className="text-slate-500 font-mono mt-1">
                      GSTIN: <strong>06AAACW1234F1Z8</strong>
                    </p>
                    <p className="text-slate-500">State: Haryana (06)</p>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs uppercase tracking-wider">
                      ORIGINAL TAX INVOICE
                    </span>
                    <div className="mt-3 space-y-1">
                      <p>
                        Invoice #: <strong className="font-mono text-slate-900">{viewInvoice.invoiceNumber}</strong>
                      </p>
                      <p>
                        Date:{' '}
                        <strong>
                          {new Date(viewInvoice.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                      </p>
                      <p>
                        SAC Code: <strong>998314</strong> (IT SaaS Services)
                      </p>
                      <p>
                        Payment Status:{' '}
                        <span className="text-emerald-700 font-bold uppercase">{viewInvoice.status}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Billed To (Buyer Information) */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Billed To (Customer):
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm">{viewInvoice.tenantName}</h4>
                    <p className="text-slate-600 mt-1">{viewInvoice.tenantAddress || 'Registered Business Address'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Buyer GSTIN & Tax Details:
                    </span>
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      {viewInvoice.tenantGstin || 'URP (Unregistered Person)'}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-1">Place of Supply: State Code of Registration</p>
                  </div>
                </div>

                {/* Itemized Table */}
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3 border border-slate-200">#</th>
                      <th className="py-2.5 px-3 border border-slate-200">Description of Service</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center">SAC</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right">Taxable Val (₹)</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right">CGST (9%)</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right">SGST (9%)</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3 px-3 border border-slate-200 font-bold">1</td>
                      <td className="py-3 px-3 border border-slate-200">
                        <strong className="text-slate-900">{viewInvoice.planName} Subscription</strong>
                        <p className="text-[11px] text-slate-500">
                          Automated Business OS, Customer CRM, WhatsApp & Cloud Management
                        </p>
                      </td>
                      <td className="py-3 px-3 border border-slate-200 text-center font-mono">998314</td>
                      <td className="py-3 px-3 border border-slate-200 text-right font-mono">
                        ₹{viewInvoice.amountSubtotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 border border-slate-200 text-right font-mono">
                        ₹{viewInvoice.cgstAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 border border-slate-200 text-right font-mono">
                        ₹{viewInvoice.sgstAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 border border-slate-200 text-right font-mono font-bold text-slate-900">
                        ₹{viewInvoice.amountTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={3} className="py-2.5 px-3 border border-slate-200 text-right uppercase text-[11px]">
                        Total Subtotal & Taxes:
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200 text-right font-mono">
                        ₹{viewInvoice.amountSubtotal.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200 text-right font-mono">
                        ₹{viewInvoice.cgstAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200 text-right font-mono">
                        ₹{viewInvoice.sgstAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200 text-right font-mono text-emerald-800 text-sm">
                        ₹{viewInvoice.amountTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Footer Notes & Digital Seal */}
                <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                  <div className="text-[10px] text-slate-500 space-y-1 max-w-sm">
                    <p className="font-bold text-slate-700">Tax Invoice Declaration:</p>
                    <p>
                      We declare that this invoice shows the actual price of the goods or services described and that all
                      particulars are true and correct. Electronically generated invoice; physical signature is not
                      required.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-block p-2 border border-dashed border-emerald-500 rounded-lg bg-emerald-50 text-[10px] text-emerald-800 font-bold">
                      ✓ Digitally Certified & Verified
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 mt-2">For Webin10 Platform Ltd.</p>
                    <p className="text-[10px] text-slate-400">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BusinessShell>
  );
}
