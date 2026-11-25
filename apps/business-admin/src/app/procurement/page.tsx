'use client';

import React, { useState } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  Truck,
  Building,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  X,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';

export default function ProcurementPage() {
  const { tenantName } = useActiveTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [orders, setOrders] = useState([
    {
      id: 'po-1',
      poNumber: 'PO-2026-089',
      vendor: 'Sun Pharma Distribution Ltd',
      itemsCount: 14,
      totalAmount: '₹34,200',
      expectedDate: '28 Nov 2026',
      status: 'DISPATCHED',
    },
    {
      id: 'po-2',
      poNumber: 'PO-2026-090',
      vendor: 'Cipla Healthcare Wholesalers',
      itemsCount: 8,
      totalAmount: '₹18,500',
      expectedDate: '01 Dec 2026',
      status: 'ORDER_PLACED',
    },
    {
      id: 'po-3',
      poNumber: 'PO-2026-088',
      vendor: 'Apollo Med Supply Hub',
      itemsCount: 22,
      totalAmount: '₹62,000',
      expectedDate: '23 Nov 2026',
      status: 'RECEIVED',
    },
  ]);

  const [newPo, setNewPo] = useState({
    vendor: '',
    itemsCount: '5',
    totalAmount: '',
    expectedDate: '',
  });

  const handleAddPo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPo.vendor) return;
    setOrders([
      ...orders,
      {
        id: `po-${Date.now()}`,
        poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
        vendor: newPo.vendor,
        itemsCount: parseInt(newPo.itemsCount) || 1,
        totalAmount: newPo.totalAmount || '₹10,000',
        expectedDate: newPo.expectedDate || 'Within 3 Days',
        status: 'ORDER_PLACED',
      },
    ]);
    setIsAddModalOpen(false);
    setNewPo({ vendor: '', itemsCount: '5', totalAmount: '', expectedDate: '' });
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.poNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BusinessShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 text-slate-800 rounded-xl border border-slate-200">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase & Vendor Procurement</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Purchase orders, Goods Received Notes (GRN), and vendor payment balances for {tenantName}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order (PO)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Active POs in Transit</div>
            <div className="text-2xl font-extrabold text-blue-600">
              {orders.filter((o) => o.status !== 'RECEIVED').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Pending arrival at warehouse</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Suppliers & Wholesalers</div>
            <div className="text-2xl font-extrabold text-slate-900">12 Verified</div>
            <div className="text-[11px] text-emerald-600 mt-1">Direct GST-invoiced</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Total Procurement Cost (Nov)</div>
            <div className="text-2xl font-extrabold text-slate-900">₹1,14,700</div>
            <div className="text-[11px] text-slate-400 mt-1">Input tax credit eligible</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendor or PO number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredOrders.map((o) => (
              <div
                key={o.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{o.vendor}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.status === 'RECEIVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.status === 'DISPATCHED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="font-mono text-slate-700 font-semibold">{o.poNumber}</span>
                    <span>•</span>
                    <span>{o.itemsCount} Items</span>
                    <span>•</span>
                    <span>ETA: {o.expectedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900">{o.totalAmount}</div>
                    <div className="text-[11px] text-slate-400">PO Total Value</div>
                  </div>
                  {o.status !== 'RECEIVED' && (
                    <button
                      onClick={() => {
                        setOrders(
                          orders.map((item) =>
                            item.id === o.id ? { ...item, status: 'RECEIVED' } : item
                          )
                        );
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg border border-emerald-200 cursor-pointer"
                    >
                      Mark GRN Received
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
              <h3 className="text-base font-bold text-slate-900 mb-1">Create Purchase Order</h3>
              <p className="text-xs text-slate-500 mb-4">Draft new vendor PO for goods procurement.</p>

              <form onSubmit={handleAddPo} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Distributor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MedSupply Hub India"
                    value={newPo.vendor}
                    onChange={(e) => setNewPo({ ...newPo, vendor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Items Count</label>
                    <input
                      type="number"
                      placeholder="10"
                      value={newPo.itemsCount}
                      onChange={(e) => setNewPo({ ...newPo, itemsCount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Total Expected (₹)</label>
                    <input
                      type="text"
                      placeholder="₹25,000"
                      value={newPo.totalAmount}
                      onChange={(e) => setNewPo({ ...newPo, totalAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={newPo.expectedDate}
                    onChange={(e) => setNewPo({ ...newPo, expectedDate: e.target.value })}
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
                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Create PO
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
