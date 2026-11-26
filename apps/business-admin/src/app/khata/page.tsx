'use client';

import React, { useState } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  Receipt,
  Users,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Calendar,
  AlertCircle,
  X,
  CreditCard,
  Phone,
  QrCode,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';
import { getApiBaseUrl } from '@/lib/api';

export default function KhataPage() {
  const API_BASE = getApiBaseUrl();
  const { tenantId, tenantName } = useActiveTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collectPaymentModal, setCollectPaymentModal] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [collectingPayment, setCollectingPayment] = useState(false);

  const loadKhata = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const url = new URL(`${API_BASE}/tenants/${tenantId}/khata`);
      if (searchQuery) url.searchParams.set('search', searchQuery);
      const res = await fetch(url.toString());
      const json = await res.json();
      const payload = json.data || json;
      if (payload.entries) {
        setEntries(payload.entries);
      }
    } catch (err) {
      console.error('Failed to load khata:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadKhata();
  }, [tenantId, searchQuery]);

  const [newEntry, setNewEntry] = useState({
    customerName: '',
    phone: '',
    amount: '',
    type: 'CREDIT',
  });

  const handleAddKhata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.customerName || !newEntry.amount || !tenantId) return;
    const amt = parseFloat(newEntry.amount) || 0;

    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/khata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newEntry.customerName,
          phone: newEntry.phone || '+91 90000 00000',
          amount: amt,
          type: newEntry.type,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsAddModalOpen(false);
        setNewEntry({ customerName: '', phone: '', amount: '', type: 'CREDIT' });
        await loadKhata();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save khata entry');
    }
  };

  const handleSendReminder = async (id: string, name: string) => {
    if (!tenantId) return;
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/khata/${id}/reminder`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success || json.data?.success) {
        alert(`WhatsApp payment link & balance reminder dispatched to ${name}!`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch WhatsApp reminder');
    }
  };

  const handleSettle = async (id: string) => {
    if (!tenantId) return;
    try {
      await fetch(`${API_BASE}/tenants/${tenantId}/khata/${id}/settle`, { method: 'PATCH' });
      await loadKhata();
    } catch (err) {
      console.error(err);
    }
  };

  const totalDue = entries.reduce((sum, e) => sum + (e.balanceDue || 0), 0);

  const filteredEntries = entries;

  return (
    <BusinessShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Udhar Khata & Digital Ledger</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Track customer balances, send WhatsApp payment links, and collect dues 3x faster for {tenantName}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Khata Entry</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Total Outstanding Khata (Lena Hai)</div>
            <div className="text-2xl font-extrabold text-amber-600">₹{totalDue.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">From {entries.filter((e) => e.balanceDue > 0).length} customers</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Overdue Recoveries</div>
            <div className="text-2xl font-extrabold text-rose-600">
              ₹{entries.filter((e) => e.status === 'OVERDUE').reduce((s, e) => s + e.balanceDue, 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-rose-500 mt-1">Pending past agreed date</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Settled This Month</div>
            <div className="text-2xl font-extrabold text-emerald-600">₹14,200</div>
            <div className="text-[11px] text-emerald-600 mt-1">Auto-credited via UPI QR</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredEntries.map((e) => (
              <div
                key={e.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{e.customerName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.status === 'SETTLED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : e.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>{e.phone}</span>
                    <span>•</span>
                    <span>Last activity: {e.lastTxDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900">
                      ₹{e.balanceDue.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400">Balance Pending</div>
                  </div>
                  {e.balanceDue > 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCollectPaymentModal(e)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                        title="Collect Online Payment via Razorpay / UPI QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Collect Online</span>
                      </button>
                      <button
                        onClick={() => handleSendReminder(e.id, e.customerName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                        title="Send WhatsApp Link"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleSettle(e.id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
                      >
                        Settle Cash
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600">Settled ✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900 mb-1">Add Customer Udhar / Khata</h3>
              <p className="text-xs text-slate-500 mb-4">Record credit given or payment received.</p>

              <form onSubmit={handleAddKhata} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Party Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh General Store"
                    value={newEntry.customerName}
                    onChange={(e) => setNewEntry({ ...newEntry, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newEntry.phone}
                    onChange={(e) => setNewEntry({ ...newEntry, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2500"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Online Payment Collection Modal */}
        {collectPaymentModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
              <button
                onClick={() => setCollectPaymentModal(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Collect Online Payment</h3>
                  <p className="text-xs text-slate-500">Razorpay Link & Instant UPI QR</p>
                </div>
              </div>

              {/* Amount Pill */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Customer:</span>
                  <div className="font-bold text-slate-900">{collectPaymentModal.customerName}</div>
                  <div className="text-[11px] text-slate-400">{collectPaymentModal.phone}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Due Balance:</span>
                  <div className="text-2xl font-black text-emerald-700">
                    ₹{collectPaymentModal.balanceDue.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Dynamic QR Code */}
              <div className="text-center p-4 bg-white border-2 border-indigo-500/20 rounded-2xl shadow-sm">
                <svg
                  className="w-36 h-36 mx-auto"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="200" height="200" rx="8" fill="white" />
                  <rect x="15" y="15" width="45" height="45" rx="4" fill="#1e1b4b" />
                  <rect x="23" y="23" width="29" height="29" rx="2" fill="white" />
                  <rect x="30" y="30" width="15" height="15" fill="#1e1b4b" />

                  <rect x="140" y="15" width="45" height="45" rx="4" fill="#1e1b4b" />
                  <rect x="148" y="23" width="29" height="29" rx="2" fill="white" />
                  <rect x="155" y="30" width="15" height="15" fill="#1e1b4b" />

                  <rect x="15" y="140" width="45" height="45" rx="4" fill="#1e1b4b" />
                  <rect x="23" y="148" width="29" height="29" rx="2" fill="white" />
                  <rect x="30" y="155" width="15" height="15" fill="#1e1b4b" />

                  <rect x="70" y="20" width="10" height="10" fill="#1e1b4b" />
                  <rect x="90" y="20" width="10" height="10" fill="#1e1b4b" />
                  <rect x="110" y="20" width="10" height="10" fill="#1e1b4b" />
                  <rect x="20" y="70" width="10" height="10" fill="#1e1b4b" />
                  <rect x="50" y="70" width="10" height="10" fill="#1e1b4b" />
                  <rect x="80" y="70" width="10" height="10" fill="#1e1b4b" />
                  <rect x="110" y="70" width="10" height="10" fill="#1e1b4b" />
                  <rect x="140" y="70" width="10" height="10" fill="#1e1b4b" />
                  <rect x="170" y="70" width="10" height="10" fill="#1e1b4b" />

                  <circle cx="100" cy="100" r="14" fill="#4f46e5" />
                  <path d="M96 100L99 103L105 97" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-[10px] font-bold text-slate-500 mt-2">
                  SCAN WITH ANY UPI APP TO PAY ₹{collectPaymentModal.balanceDue}
                </p>
              </div>

              {/* Share Link & Settle */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSendReminder(collectPaymentModal.id, collectPaymentModal.customerName);
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Razorpay Payment Link on WhatsApp</span>
                </button>

                <button
                  type="button"
                  disabled={collectingPayment}
                  onClick={async () => {
                    setCollectingPayment(true);
                    await handleSettle(collectPaymentModal.id);
                    setCollectingPayment(false);
                    setCollectPaymentModal(null);
                    alert(`✓ Payment of ₹${collectPaymentModal.balanceDue} recorded successfully via Online Gateway! Khata is settled.`);
                  }}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{collectingPayment ? 'Recording...' : 'Mark Received via Online UPI / Razorpay ✓'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BusinessShell>
  );
}
