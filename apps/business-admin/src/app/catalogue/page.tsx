'use client';

import React, { useState } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  ShoppingBag,
  Tag,
  Plus,
  Search,
  CheckCircle2,
  Sparkles,
  Percent,
  X,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';

export default function CataloguePage() {
  const { tenantName } = useActiveTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [items, setItems] = useState([
    {
      id: 'cat-1',
      title: 'Full Body Spa & Aromatherapy (60 min)',
      type: 'SERVICE',
      price: '₹2,199',
      duration: '60 Mins',
      taxRate: '18% GST',
      status: 'AVAILABLE',
    },
    {
      id: 'cat-2',
      title: 'Personal Training Annual Subscription',
      type: 'MEMBERSHIP',
      price: '₹24,000',
      duration: '365 Days',
      taxRate: '18% GST',
      status: 'AVAILABLE',
    },
    {
      id: 'cat-3',
      title: 'Class 10 Foundation Science Course Pack',
      type: 'COURSE',
      price: '₹14,500',
      duration: '1 Year',
      taxRate: 'Exempt',
      status: 'AVAILABLE',
    },
    {
      id: 'cat-4',
      title: 'Multivitamin Health Booster Pack',
      type: 'PRODUCT',
      price: '₹750',
      duration: 'Retail Pack',
      taxRate: '12% GST',
      status: 'AVAILABLE',
    },
  ]);

  const [newItem, setNewItem] = useState({
    title: '',
    type: 'SERVICE',
    price: '',
    duration: '',
    taxRate: '18% GST',
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title) return;
    setItems([
      ...items,
      {
        id: `cat-${Date.now()}`,
        title: newItem.title,
        type: newItem.type,
        price: newItem.price || '₹500',
        duration: newItem.duration || 'Standard',
        taxRate: newItem.taxRate,
        status: 'AVAILABLE',
      },
    ]);
    setIsAddModalOpen(false);
    setNewItem({ title: '', type: 'SERVICE', price: '', duration: '', taxRate: '18% GST' });
  };

  const filteredItems = items.filter(
    (i) =>
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BusinessShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Service & Rate Card Catalogue</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Standardized price menu, package bundles, duration, and GST slabs for {tenantName}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Offering / Plan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Catalogued Offerings</div>
            <div className="text-2xl font-extrabold text-slate-900">{items.length} Offerings</div>
            <div className="text-[11px] text-purple-600 mt-1">Ready for 1-click invoicing</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Most Booked Offering</div>
            <div className="text-2xl font-extrabold text-slate-900">Annual Membership</div>
            <div className="text-[11px] text-slate-400 mt-1">High-margin offering</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">GST Compliance</div>
            <div className="text-2xl font-extrabold text-emerald-600">100% Tax Mapped</div>
            <div className="text-[11px] text-emerald-600 mt-1">SAC / HSN codes assigned</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalogue items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {item.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>Duration: {item.duration}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">{item.taxRate}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-purple-700">{item.price}</div>
                  <div className="text-[11px] text-emerald-600 font-semibold">{item.status}</div>
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
              <h3 className="text-base font-bold text-slate-900 mb-1">Add Rate Card Item</h3>
              <p className="text-xs text-slate-500 mb-4">Add a new service, course, or product package.</p>

              <form onSubmit={handleAddItem} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Offering Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6-Month Gold Gym Pass"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                    <select
                      value={newItem.type}
                      onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="SERVICE">Service</option>
                      <option value="MEMBERSHIP">Membership Plan</option>
                      <option value="COURSE">Course / Batch</option>
                      <option value="PRODUCT">Physical Product</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Price</label>
                    <input
                      type="text"
                      placeholder="₹2,500"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Duration / Valid</label>
                    <input
                      type="text"
                      placeholder="e.g. 60 Mins or 180 Days"
                      value={newItem.duration}
                      onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GST Slab</label>
                    <select
                      value={newItem.taxRate}
                      onChange={(e) => setNewItem({ ...newItem, taxRate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="18% GST">18% GST</option>
                      <option value="12% GST">12% GST</option>
                      <option value="5% GST">5% GST</option>
                      <option value="Exempt">Exempt / Zero-rated</option>
                    </select>
                  </div>
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
                    className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Save Offering
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
