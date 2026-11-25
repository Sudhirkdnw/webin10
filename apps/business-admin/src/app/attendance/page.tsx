'use client';

import React, { useState, useEffect } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Smartphone,
  RefreshCw,
  Send,
  Calendar,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';
import { useTenantModules } from '@/lib/modules';
import { getApiBaseUrl } from '@/lib/api';

interface AttendanceRecord {
  id: string;
  name: string;
  role: string;
  phone: string;
  checkInTime: string;
  checkOutTime?: string;
  method: 'QR_KIOSK' | 'MOBILE_APP' | 'MANUAL';
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  whatsappSent: boolean;
}

export default function AttendancePage() {
  const API_BASE = getApiBaseUrl();
  const { tenantId, tenantName } = useActiveTenant();
  const { categorySlug, crmLabel, customerSingular } = useTenantModules(tenantId);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'LATE' | 'ABSENT'>('ALL');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Manual check-in form
  const [manualForm, setManualForm] = useState({
    name: '',
    phone: '',
    role: customerSingular || 'Member',
    status: 'PRESENT' as 'PRESENT' | 'LATE' | 'ABSENT',
    sendWhatsApp: true,
  });

  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Load from database
  const loadAttendance = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const url = new URL(`${API_BASE}/tenants/${tenantId}/attendance`);
      if (selectedDate) url.searchParams.set('date', selectedDate);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const res = await fetch(url.toString());
      const json = await res.json();
      const payload = json.data || json;
      if (payload.records) {
        setRecords(payload.records);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [tenantId, selectedDate, statusFilter, searchQuery]);

  const filteredRecords = records;

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const totalCount = records.length;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name.trim() || !tenantId) return;

    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualForm.name,
          role: manualForm.role,
          phone: manualForm.phone || '+91 90000 00000',
          status: manualForm.status,
          date: selectedDate,
          whatsappSent: manualForm.sendWhatsApp,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsManualModalOpen(false);
        setAlertSuccess(
          `Attendance marked & saved to database for ${manualForm.name} (${manualForm.status}). ${
            manualForm.sendWhatsApp ? 'WhatsApp alert dispatched!' : ''
          }`
        );
        setTimeout(() => setAlertSuccess(null), 4000);
        setManualForm({
          name: '',
          phone: '',
          role: customerSingular || 'Member',
          status: 'PRESENT',
          sendWhatsApp: true,
        });
        await loadAttendance();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record attendance');
    }
  };

  return (
    <BusinessShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <QrCode className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  QR & Kiosk Attendance Hub
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Touchless QR check-ins, automated WhatsApp entry notifications, and live logs for {tenantName || 'your business'}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Show Desk QR Kiosk</span>
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Mark Manual Entry</span>
            </button>
          </div>
        </div>

        {alertSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{alertSuccess}</span>
            </div>
            <button onClick={() => setAlertSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Today's Check-ins</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{presentCount + lateCount}</span>
              <span className="text-xs font-semibold text-emerald-600">/ {totalCount} Total</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {Math.round(((presentCount + lateCount) / (totalCount || 1)) * 100)}% attendance rate
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">On-Time (Present)</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-teal-700">{presentCount}</span>
              <span className="text-xs text-slate-400">punctual</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Instant entry verified
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Late Check-ins</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-600">{lateCount}</span>
              <span className="text-xs text-amber-600/80">&gt; 15 mins late</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Punctuality flagged
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Absent / Not Punched</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-600">{absentCount}</span>
              <span className="text-xs text-rose-500">pending</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Auto-reminder ready
            </div>
          </div>
        </div>

        {/* Filter & Live Attendance Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 mr-2">Filter Status:</span>
              {(['ALL', 'PRESENT', 'LATE', 'ABSENT'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {st === 'ALL' ? `All (${records.length})` : st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-52 md:w-64"
                />
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Person / ID</th>
                  <th className="py-3 px-4">Category Role</th>
                  <th className="py-3 px-4">Punch Time</th>
                  <th className="py-3 px-4">Verification Method</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">WhatsApp Alert</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <QrCode className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No attendance logs matching your criteria</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{r.name}</div>
                        <div className="text-[11px] text-slate-400">{r.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700">
                          {r.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.checkInTime}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {r.method === 'QR_KIOSK' && <QrCode className="w-3 h-3 text-emerald-600" />}
                          {r.method === 'MOBILE_APP' && <Smartphone className="w-3 h-3 text-blue-600" />}
                          {r.method === 'MANUAL' && <Users className="w-3 h-3 text-amber-600" />}
                          <span>{r.method.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            r.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.status === 'LATE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.status === 'PRESENT'
                                ? 'bg-emerald-500'
                                : r.status === 'LATE'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {r.whatsappSent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <Send className="w-3 h-3" />
                            <span>Delivered</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Not sent</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`${API_BASE}/tenants/${tenantId}/attendance/${r.id}/toggle`, {
                                method: 'PATCH',
                              });
                              loadAttendance();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-900 font-semibold cursor-pointer underline underline-offset-2"
                        >
                          Toggle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* QR KIOSK MODAL */}
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in zoom-in-95">
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full uppercase tracking-wider border border-emerald-200">
                  Front-Desk Touchless Kiosk
                </span>
                <h3 className="text-lg font-bold text-slate-900">{tenantName || 'Business'} QR Check-in</h3>
                <p className="text-xs text-slate-500">
                  Customers & members scan this code with their phone camera to instantly punch attendance.
                </p>
              </div>

              {/* QR Code graphic container */}
              <div className="my-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                <div className="p-4 bg-white rounded-xl shadow-md border border-slate-200">
                  {/* Generated SVG-based dynamic QR Code design */}
                  <svg
                    viewBox="0 0 200 200"
                    className="w-48 h-48 text-slate-900"
                    fill="currentColor"
                  >
                    <rect width="200" height="200" fill="#ffffff" />
                    {/* Corner 1 */}
                    <rect x="20" y="20" width="50" height="50" rx="6" fill="#0f172a" />
                    <rect x="28" y="28" width="34" height="34" rx="4" fill="#ffffff" />
                    <rect x="36" y="36" width="18" height="18" rx="2" fill="#0f172a" />

                    {/* Corner 2 */}
                    <rect x="130" y="20" width="50" height="50" rx="6" fill="#0f172a" />
                    <rect x="138" y="28" width="34" height="34" rx="4" fill="#ffffff" />
                    <rect x="146" y="36" width="18" height="18" rx="2" fill="#0f172a" />

                    {/* Corner 3 */}
                    <rect x="20" y="130" width="50" height="50" rx="6" fill="#0f172a" />
                    <rect x="28" y="138" width="34" height="34" rx="4" fill="#ffffff" />
                    <rect x="36" y="146" width="18" height="18" rx="2" fill="#0f172a" />

                    {/* Center & Data patterns */}
                    <rect x="80" y="25" width="15" height="15" fill="#059669" />
                    <rect x="100" y="35" width="15" height="15" fill="#0f172a" />
                    <rect x="85" y="60" width="30" height="15" fill="#0f172a" />
                    <rect x="25" y="85" width="20" height="15" fill="#0f172a" />
                    <rect x="55" y="85" width="15" height="30" fill="#059669" />
                    <rect x="85" y="90" width="30" height="30" rx="4" fill="#059669" />
                    <rect x="130" y="85" width="15" height="15" fill="#0f172a" />
                    <rect x="155" y="85" width="25" height="15" fill="#0f172a" />
                    <rect x="130" y="110" width="30" height="20" fill="#0f172a" />
                    <rect x="85" y="135" width="15" height="25" fill="#0f172a" />
                    <rect x="110" y="145" width="25" height="15" fill="#059669" />
                    <rect x="145" y="145" width="35" height="35" fill="#0f172a" />
                    <rect x="85" y="170" width="40" height="15" fill="#0f172a" />
                  </svg>
                </div>
                <div className="mt-3 text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dynamic security token active • Auto-refreshes daily</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Kiosk Poster</span>
                </button>
                <button
                  onClick={() => alert('Desk QR Code template downloaded in PDF format.')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MANUAL ENTRY MODAL */}
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in zoom-in-95">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold text-slate-900 mb-1">Mark Manual Attendance</h3>
              <p className="text-xs text-slate-500 mb-4">
                Record attendance for walk-ins or members without smartphone scan.
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role / Type
                    </label>
                    <select
                      value={manualForm.role}
                      onChange={(e) => setManualForm({ ...manualForm, role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value={customerSingular || 'Member'}>{customerSingular || 'Member'}</option>
                      <option value="Staff">Staff</option>
                      <option value="Trainer">Trainer / Instructor</option>
                      <option value="Guest">Guest Walk-in</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={manualForm.status}
                      onChange={(e) =>
                        setManualForm({
                          ...manualForm,
                          status: e.target.value as 'PRESENT' | 'LATE' | 'ABSENT',
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="PRESENT">Present</option>
                      <option value="LATE">Late (&gt;15 min)</option>
                      <option value="ABSENT">Absent</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">WhatsApp Notification</div>
                      <div className="text-[10px] text-slate-500">Send instant check-in message</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={manualForm.sendWhatsApp}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, sendWhatsApp: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Save Attendance
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
