'use client';

import React, { useState } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  Package,
  Boxes,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  TrendingDown,
  X,
  Layers,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';

export default function InventoryPage() {
  const { tenantName } = useActiveTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [items, setItems] = useState([
    {
      id: 'inv-1',
      name: 'Amoxicillin 500mg Capsules',
      category: 'Antibiotics',
      sku: 'MED-AMX-500',
      stock: 45,
      minStock: 50,
      unitPrice: '₹140',
      status: 'LOW_STOCK',
    },
    {
      id: 'inv-2',
      name: 'Paracetamol 650mg (Dolo)',
      category: 'Analgesics',
      sku: 'MED-PCM-650',
      stock: 240,
      minStock: 60,
      unitPrice: '₹32',
      status: 'IN_STOCK',
    },
    {
      id: 'inv-3',
      name: 'Whey Protein Isolate 1kg',
      category: 'Supplements',
      sku: 'SUP-WPI-1KG',
      stock: 8,
      minStock: 10,
      unitPrice: '₹3,200',
      status: 'LOW_STOCK',
    },
    {
      id: 'inv-4',
      name: 'Organic Basmati Rice 5kg',
      category: 'Groceries',
      sku: 'GRC-RCE-05',
      stock: 65,
      minStock: 20,
      unitPrice: '₹480',
      status: 'IN_STOCK',
    },
  ]);

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    sku: '',
    stock: '',
    minStock: '10',
    unitPrice: '',
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;
    const stockQty = parseInt(newItem.stock) || 0;
    const minQty = parseInt(newItem.minStock) || 10;
    setItems([
      ...items,
      {
        id: `inv-${Date.now()}`,
        name: newItem.name,
        category: newItem.category || 'General',
        sku: newItem.sku || `SKU-${Date.now().toString().slice(-4)}`,
        stock: stockQty,
        minStock: minQty,
        unitPrice: newItem.unitPrice || '₹100',
        status: stockQty <= minQty ? 'LOW_STOCK' : 'IN_STOCK',
      },
    ]);
    setIsAddModalOpen(false);
    setNewItem({ name: '', category: '', sku: '', stock: '', minStock: '10', unitPrice: '' });
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BusinessShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory & Stock Tracking</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Batch numbers, expiry alerts, barcode SKUs, and low-stock reorder automation for {tenantName}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Total SKUs in Catalog</div>
            <div className="text-2xl font-extrabold text-slate-900">{items.length}</div>
            <div className="text-[11px] text-emerald-600 mt-1">Live tracking active</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Low Stock Alerts</div>
            <div className="text-2xl font-extrabold text-amber-600">
              {items.filter((i) => i.status === 'LOW_STOCK').length} Items
            </div>
            <div className="text-[11px] text-amber-600 mt-1">Below minimum threshold</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Total Stock Asset Value</div>
            <div className="text-2xl font-extrabold text-slate-900">₹1,84,500</div>
            <div className="text-[11px] text-slate-400 mt-1">Warehouse valuation</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product name, SKU, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'LOW_STOCK'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="font-medium text-slate-700">{item.category}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400 text-[11px]">SKU: {item.sku}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900">
                      {item.stock} <span className="text-xs font-normal text-slate-500">units left</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Min Alert: {item.minStock} units</div>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <div className="text-sm font-bold text-slate-800">{item.unitPrice}</div>
                    <div className="text-[10px] text-slate-400">Retail Rate</div>
                  </div>
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
              <h3 className="text-base font-bold text-slate-900 mb-1">Add Stock Product</h3>
              <p className="text-xs text-slate-500 mb-4">Enter SKU details and starting inventory levels.</p>

              <form onSubmit={handleAddItem} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 650mg"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Pharmacy / Groceries"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Barcode</label>
                    <input
                      type="text"
                      placeholder="e.g. MED-001"
                      value={newItem.sku}
                      onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Qty</label>
                    <input
                      type="number"
                      placeholder="50"
                      value={newItem.stock}
                      onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Min Alert</label>
                    <input
                      type="number"
                      placeholder="10"
                      value={newItem.minStock}
                      onChange={(e) => setNewItem({ ...newItem, minStock: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Price</label>
                    <input
                      type="text"
                      placeholder="₹120"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
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
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Save SKU
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
