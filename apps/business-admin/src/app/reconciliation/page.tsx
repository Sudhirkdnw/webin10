'use client';

import React, { useState } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  CheckCheck,
  Building2,
  Smartphone,
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Download,
  Filter,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';

export default function ReconciliationPage() {
  const { tenantName } = useActiveTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'MATCHED' | 'DISCREPANCY'>('ALL');

  const [txs, setTxs] = useState([
    {
      id: 'rec-1',
      source: 'UPI QR (PhonePe / GPay)',
      refNo: 'UPI/2026/8891024',
      systemAmount: 2499,
      bankAmount: 2499,
      feeDeducted: 0,
      settlementDate: '25 Nov 2026 (T+0)',
      status: 'MATCHED',
    },
    {
      id: 'rec-2',
      source: 'POS Card Swipe Machine (HDFC)',
      refNo: 'POS/TXN/55410',
      systemAmount: 18000,
      bankAmount: 17640,
      feeDeducted: 360,
      settlementDate: '24 Nov 2026 (T+1)',
      status: 'MATCHED',
    },
    {
      id: 'rec-3',
      source: 'Cash Register Drop',
      refNo: 'CASH/CLOSE/089',
      systemAmount: 5400,
      bankAmount: 5200,
      feeDeducted: 0,
      settlementDate: 'Yesterday',
      status: 'DISCREPANCY',
    },
    {
      id: 'rec-4',
      source: 'Online Payment Gateway (Razorpay)',
      refNo: 'pay_PqL92019a',
      systemAmount: 12000,
      bankAmount: 11760,
      feeDeducted: 240,
      settlementDate: '23 Nov 2026',
      status: 'MATCHED',
    },
  ]);

  const filteredTxs = txs.filter((t) => {
    const matchesSearch =
      t.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.refNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'ALL' || t.status === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <BusinessShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payment Reconciliation & Settlement</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily match between your business software invoices, UPI payouts, POS machine swipes, and actual bank deposits for {tenantName}.
              </p>
            </div>
          </div>
          <button
            onClick={() => alert('Bank statement reconciliation report exported in Excel / CSV.')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Bank Recon Sheet</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Total Settled In Bank</div>
            <div className="text-2xl font-extrabold text-emerald-600">₹37,899</div>
            <div className="text-[11px] text-slate-400 mt-1">Directly credited to linked current account</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Gateway MDR / Fees Deducted</div>
            <div className="text-2xl font-extrabold text-slate-900">₹600</div>
            <div className="text-[11px] text-slate-400 mt-1">Card MDR (2%) & Gateway handling</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Unmatched Variance (Discrepancy)</div>
            <div className="text-2xl font-extrabold text-amber-600">₹200</div>
            <div className="text-[11px] text-amber-600 mt-1">1 Cash counter drawer shortage</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {(['ALL', 'MATCHED', 'DISCREPANCY'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterType(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    filterType === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference ID, channel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTxs.map((t) => (
              <div
                key={t.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{t.source}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'MATCHED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="font-mono text-slate-600 text-[11px]">{t.refNo}</span>
                    <span>•</span>
                    <span>Settled: {t.settlementDate}</span>
                    {t.feeDeducted > 0 && <span>• Fee: ₹{t.feeDeducted}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">System Recorded</div>
                    <div className="text-sm font-bold text-slate-700">₹{t.systemAmount.toLocaleString()}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Bank Actual Deposit</div>
                    <div className="text-sm font-extrabold text-emerald-600">
                      ₹{t.bankAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BusinessShell>
  );
}
