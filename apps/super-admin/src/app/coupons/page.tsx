'use client';

import React, { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Check,
  Trash2,
  Edit,
  Tag,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface CouponItem {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscount?: number | null;
  minPurchase?: number | null;
  validFrom: string;
  validUntil?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  perTenantLimit: number;
  applicablePlans?: string[] | null;
  isEnabled: boolean;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalRedemptions: 0,
    estimatedDiscountDistributed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 20,
    maxDiscount: '',
    minPurchase: '0',
    validUntil: '',
    usageLimit: '100',
    perTenantLimit: '1',
    isEnabled: true,
  });

  useEffect(() => {
    fetchCoupons();
    fetchMetrics();
  }, []);

  async function fetchCoupons() {
    setLoading(true);
    try {
      const res = await apiRequest<CouponItem[]>('/super-admin/coupons');
      if (res.success && Array.isArray(res.data)) {
        setCoupons(res.data);
      }
    } catch (err) {
      console.error('Failed to load coupons', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetrics() {
    try {
      const res = await apiRequest<any>('/super-admin/coupons/metrics');
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch {}
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  async function handleToggleStatus(coupon: CouponItem) {
    try {
      const res = await apiRequest<CouponItem>(`/super-admin/coupons/${coupon.id}/toggle`, {
        method: 'POST',
      });
      if (res.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isEnabled: !c.isEnabled } : c))
        );
        fetchMetrics();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle coupon status');
    }
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Are you sure you want to delete coupon '${code}'?`)) return;

    try {
      const res = await apiRequest(`/super-admin/coupons/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        fetchMetrics();
      } else {
        alert(res.error || 'Failed to delete coupon');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting coupon');
    }
  }

  function openCreateModal() {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxDiscount: '',
      minPurchase: '0',
      validUntil: '',
      usageLimit: '100',
      perTenantLimit: '1',
      isEnabled: true,
    });
    setIsModalOpen(true);
  }

  function openEditModal(coupon: CouponItem) {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      minPurchase: String(coupon.minPurchase || 0),
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      perTenantLimit: String(coupon.perTenantLimit || 1),
      isEnabled: coupon.isEnabled,
    });
    setIsModalOpen(true);
  }

  async function handleSaveCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.code.trim()) {
      alert('Please enter a valid coupon code');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        minPurchase: Number(formData.minPurchase || 0),
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        perTenantLimit: Number(formData.perTenantLimit || 1),
        isEnabled: formData.isEnabled,
      };

      if (editingCoupon) {
        const res = await apiRequest(`/super-admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setIsModalOpen(false);
          fetchCoupons();
          fetchMetrics();
        } else {
          alert(res.error || 'Failed to update coupon');
        }
      } else {
        const res = await apiRequest('/super-admin/coupons', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setIsModalOpen(false);
          fetchCoupons();
          fetchMetrics();
        } else {
          alert(res.error || 'Failed to create coupon');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error saving coupon');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter === 'ACTIVE') return matchesSearch && c.isEnabled;
    if (statusFilter === 'INACTIVE') return matchesSearch && !c.isEnabled;
    return matchesSearch;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Ticket className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Promotional Coupons & Vouchers
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Drive customer acquisition with custom discount codes, usage limits, and plan incentives.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Code</span>
          </button>
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Created</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.totalCoupons}</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>Platform Promo Catalog</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active Codes</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.activeCoupons}</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span>Ready for checkout</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Total Redemptions</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{metrics.totalRedemptions}</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-indigo-500" />
              <span>Businesses claimed</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Discount Distributed</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              ₹{metrics.estimatedDiscountDistributed.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-amber-500" />
              <span>Total customer savings</span>
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coupon by code or description..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filter:</span>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  statusFilter === filter
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Coupons List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
            <p className="text-xs">Loading coupons catalog...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <Ticket className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No promotional coupons found</p>
            <p className="text-xs text-slate-400 mt-1">Click "Create Promo Code" to launch your first promotional offer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCoupons.map((coupon) => {
              const usagePercent = coupon.usageLimit
                ? Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100))
                : 0;

              return (
                <div
                  key={coupon.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    coupon.isEnabled
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Code Badge + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 tracking-wider">
                          {coupon.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(coupon.code)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                          title="Copy Code"
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(coupon)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                          coupon.isEnabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400'
                            : 'bg-slate-200 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {coupon.isEnabled ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    {/* Discount Value */}
                    <div>
                      <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {coupon.discountType === 'PERCENTAGE'
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue} FLAT OFF`}
                      </p>
                      {coupon.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {coupon.description}
                        </p>
                      )}
                    </div>

                    {/* Criteria Details */}
                    <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {coupon.minPurchase ? (
                        <p>Min Purchase: ₹{coupon.minPurchase}</p>
                      ) : (
                        <p>No minimum purchase</p>
                      )}
                      {coupon.maxDiscount && coupon.discountType === 'PERCENTAGE' && (
                        <p>Max Savings Cap: ₹{coupon.maxDiscount}</p>
                      )}
                      {coupon.validUntil ? (
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Valid till: {new Date(coupon.validUntil).toLocaleDateString()}</span>
                        </p>
                      ) : (
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          <span>Never expires</span>
                        </p>
                      )}
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        <span>Used: {coupon.usedCount}</span>
                        <span>{coupon.usageLimit ? `Limit: ${coupon.usageLimit}` : 'Unlimited'}</span>
                      </div>
                      {coupon.usageLimit && (
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              usagePercent >= 90 ? 'bg-rose-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(coupon.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(coupon)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                        title="Edit Coupon"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create or Edit Promo Code */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingCoupon ? 'Edit Promotional Coupon' : 'Create New Promotional Code'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Coupon Promo Code:*
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. LAUNCH50 or DIWALI2026"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description / Promotion Note:
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. 50% discount on first year SaaS plan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Discount Type:*
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountType: e.target.value as 'PERCENTAGE' | 'FIXED',
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="PERCENTAGE">Percentage (% Discount)</option>
                      <option value="FIXED">Fixed Amount (₹ Flat OFF)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Discount Value ({formData.discountType === 'PERCENTAGE' ? '%' : '₹'}):*
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={formData.discountType === 'PERCENTAGE' ? 100 : 100000}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Min Purchase Required (₹):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.minPurchase}
                      onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                      placeholder="0 for none"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  {formData.discountType === 'PERCENTAGE' && (
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Max Cap (₹):
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.maxDiscount}
                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                        placeholder="Leave blank for no cap"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Usage Limit (Total uses):
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="e.g. 100 uses"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Expiry Date:
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="couponEnabled"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="couponEnabled" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Enable coupon immediately upon creation
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingCoupon ? 'Update Promo Code' : 'Save & Publish Promo Code'}</span>
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
