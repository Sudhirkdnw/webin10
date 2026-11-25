'use client';

import React, { useState } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  DollarSign,
  TrendingDown,
  Plus,
  Search,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  X,
  PieChart,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';

export default function ExpensesPage() {
  const { tenantName } = useActiveTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [expenses, setExpenses] = useState([
    {
      id: 'exp-1',
      title: 'Electricity & Power Bill (Commercial)',
      category: 'Utilities',
      amount: 14500,
      paidVia: 'UPI / NetBanking',
      date: '20 Nov 2026',
    },
    {
      id: 'exp-2',
      title: 'Premises Monthly Rent',
      category: 'Rent',
      amount: 45000,
      paidVia: 'Bank Transfer (IMPS)',
      date: '01 Nov 2026',
    },
    {
      id: 'exp-3',
      title: 'Cleaning, Sanitation & Pest Control',
      category: 'Maintenance',
      amount: 3200,
      paidVia: 'Cash',
      date: '15 Nov 2026',
    },
    {
      id: 'exp-4',
      title: 'High-speed Fiber Internet & Telephony',
      category: 'Utilities',
      amount: 1800,
      paidVia: 'Corporate Card',
      date: '10 Nov 2026',
    },
  ]);

  const [newExp, setNewExp] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    paidVia: 'UPI',
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.title || !newExp.amount) return;
    setExpenses([
      ...expenses,
      {
        id: `exp-${Date.now()}`,
        title: newExp.title,
        category: newExp.category,
        amount: parseFloat(newExp.amount) || 0,
        paidVia: newExp.paidVia,
        date: 'Today',
      },
    ]);
    setIsAddModalOpen(false);
    setNewExp({ title: '', category: 'Utilities', amount: '', paidVia: 'UPI' });
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BusinessShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Expenses & Petty Cashbook</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Track operational costs, rent, utilities, staff chai/snacks, and monthly P&L for {tenantName}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Total Expenses (This Month)</div>
            <div className="text-2xl font-extrabold text-rose-600">₹{totalExpense.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">From {expenses.length} recorded entries</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Top Expense Category</div>
            <div className="text-2xl font-extrabold text-slate-900">Premises Rent</div>
            <div className="text-[11px] text-slate-400 mt-1">₹45,000 / month fixed</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Tax-Deductible Operating Costs</div>
            <div className="text-2xl font-extrabold text-emerald-600">100%</div>
            <div className="text-[11px] text-emerald-600 mt-1">Receipts attached for ITR</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search expense description, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{exp.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium text-[11px]">
                      {exp.category}
                    </span>
                    <span>•</span>
                    <span>{exp.paidVia}</span>
                    <span>•</span>
                    <span>{exp.date}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-rose-600">
                    - ₹{exp.amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400">Debit Voucher</div>
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
              <h3 className="text-base font-bold text-slate-900 mb-1">Record Expense Entry</h3>
              <p className="text-xs text-slate-500 mb-4">Add operating expense to cash ledger.</p>

              <form onSubmit={handleAddExpense} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Stationery & Printer Paper"
                    value={newExp.title}
                    onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={newExp.category}
                      onChange={(e) => setNewExp({ ...newExp, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="Utilities">Utilities & Power</option>
                      <option value="Rent">Rent & Lease</option>
                      <option value="Maintenance">Maintenance & Repairs</option>
                      <option value="Staff Welfare">Staff Welfare & Tea</option>
                      <option value="Marketing">Marketing & Ads</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Paid Via</label>
                    <select
                      value={newExp.paidVia}
                      onChange={(e) => setNewExp({ ...newExp, paidVia: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="UPI">UPI / GPay / Paytm</option>
                      <option value="Cash">Cash (Petty)</option>
                      <option value="Bank IMPS">Bank IMPS / NEFT</option>
                      <option value="Card">Debit / Credit Card</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={newExp.amount}
                    onChange={(e) => setNewExp({ ...newExp, amount: e.target.value })}
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
                    className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Save Expense
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
