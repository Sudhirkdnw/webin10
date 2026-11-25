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
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';

export default function KhataPage() {
  const { tenantName } = useActiveTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [entries, setEntries] = useState([
    {
      id: 'k-1',
      customerName: 'Gupta Kirana & General Store',
      phone: '+91 98234 11223',
      balanceDue: 4500,
      lastTxType: 'CREDIT',
      lastTxDate: '24 Nov 2026',
      status: 'OVERDUE',
    },
    {
      id: 'k-2',
      customerName: 'Sunil Kumar (Sharma Ji)',
      phone: '+91 99341 55667',
      balanceDue: 1850,
      lastTxType: 'CREDIT',
      lastTxDate: 'Yesterday',
      status: 'PENDING',
    },
    {
      id: 'k-3',
      customerName: 'Kailash Textiles',
      phone: '+91 97112 33445',
      balanceDue: 0,
      lastTxType: 'PAYMENT',
      lastTxDate: '22 Nov 2026',
      status: 'SETTLED',
    },
    {
      id: 'k-4',
      customerName: 'Manoj Dairy Parlour',
      phone: '+91 98990 00112',
      balanceDue: 6200,
      lastTxType: 'CREDIT',
      lastTxDate: '18 Nov 2026',
      status: 'OVERDUE',
    },
  ]);

  const [newEntry, setNewEntry] = useState({
    customerName: '',
    phone: '',
    amount: '',
    type: 'CREDIT',
  });

  const handleAddKhata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.customerName || !newEntry.amount) return;
    const amt = parseFloat(newEntry.amount) || 0;
    setEntries([
      ...entries,
      {
        id: `k-${Date.now()}`,
        customerName: newEntry.customerName,
        phone: newEntry.phone || '+91 90000 00000',
        balanceDue: amt,
        lastTxType: newEntry.type,
        lastTxDate: 'Today',
        status: 'PENDING',
      },
    ]);
    setIsAddModalOpen(false);
    setNewEntry({ customerName: '', phone: '', amount: '', type: 'CREDIT' });
  };

  const totalDue = entries.reduce((sum, e) => sum + e.balanceDue, 0);

  const filteredEntries = entries.filter(
    (e) =>
      e.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.phone.includes(searchQuery)
  );

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
                  {e.balanceDue > 0 && (
                    <button
                      onClick={() => alert(`WhatsApp payment reminder sent to ${e.customerName} with UPI Pay Link!`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Payment Link</span>
                    </button>
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
      </div>
    </BusinessShell>
  );
}
