'use client';

import React, { useState } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Sparkles,
  Phone,
  Send,
  X,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';
import { getApiBaseUrl } from '@/lib/api';

export default function AppointmentsPage() {
  const API_BASE = getApiBaseUrl();
  const { tenantId, tenantName } = useActiveTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAppointments = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const url = new URL(`${API_BASE}/tenants/${tenantId}/appointments`);
      if (selectedStatus !== 'ALL') url.searchParams.set('status', selectedStatus);
      if (searchQuery) url.searchParams.set('search', searchQuery);
      const res = await fetch(url.toString());
      const json = await res.json();
      const payload = json.data || json;
      if (payload.appointments) {
        setAppointments(payload.appointments);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadAppointments();
  }, [tenantId, selectedStatus, searchQuery]);

  const [newApt, setNewApt] = useState({
    clientName: '',
    phone: '',
    service: '',
    stylist: '',
    timeSlot: '12:00 PM',
    amount: '₹1,000',
  });

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApt.clientName || !tenantId) return;

    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: newApt.clientName,
          phone: newApt.phone || '+91 90000 00000',
          service: newApt.service || 'General Service',
          stylist: newApt.stylist || 'Assigned Specialist',
          timeSlot: newApt.timeSlot,
          amount: newApt.amount,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsAddModalOpen(false);
        setNewApt({ clientName: '', phone: '', service: '', stylist: '', timeSlot: '12:00 PM', amount: '₹1,000' });
        await loadAppointments();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to book appointment');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!tenantId) return;
    const nextStatus = currentStatus === 'COMPLETED' ? 'CONFIRMED' : 'COMPLETED';
    try {
      await fetch(`${API_BASE}/tenants/${tenantId}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredApts = appointments;

  return (
    <BusinessShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-pink-50 text-pink-600 rounded-xl border border-pink-100">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Appointments & Booking Desk</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time slot bookings, stylist scheduling, and automated WhatsApp slot reminders for {tenantName}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-pink-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Slot</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Today's Total Slots</div>
            <div className="text-2xl font-extrabold text-slate-900">{appointments.length}</div>
            <div className="text-[11px] text-emerald-600 mt-1">100% Booked slots</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Confirmed</div>
            <div className="text-2xl font-extrabold text-pink-600">
              {appointments.filter((a) => a.status === 'CONFIRMED').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Upcoming today</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">In Chair / Service</div>
            <div className="text-2xl font-extrabold text-amber-600">
              {appointments.filter((a) => a.status === 'IN_PROGRESS').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Active right now</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Estimated Bookings</div>
            <div className="text-2xl font-extrabold text-slate-900">
              ₹8,749
            </div>
            <div className="text-[11px] text-emerald-600 mt-1">Today's expected revenue</div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search client, service, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredApts.map((a) => (
              <div
                key={a.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{a.clientName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === 'CONFIRMED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : a.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {a.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Scissors className="w-3.5 h-3.5 text-pink-500" />
                      {a.service}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Assigned: {a.stylist}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {a.timeSlot}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{a.amount}</div>
                    <div className="text-[11px] text-slate-400">{a.phone}</div>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(a.id, a.status)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
                  >
                    {a.status === 'COMPLETED' ? 'Reopen' : 'Mark Done'}
                  </button>
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
              <h3 className="text-base font-bold text-slate-900 mb-1">Book New Appointment Slot</h3>
              <p className="text-xs text-slate-500 mb-4">Enter client details, service, and timing.</p>

              <form onSubmit={handleAddAppointment} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Radhika Sharma"
                    value={newApt.clientName}
                    onChange={(e) => setNewApt({ ...newApt, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newApt.phone}
                    onChange={(e) => setNewApt({ ...newApt, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Requested</label>
                  <input
                    type="text"
                    placeholder="e.g. Hair Colour & Highlights"
                    value={newApt.service}
                    onChange={(e) => setNewApt({ ...newApt, service: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Stylist / Doctor</label>
                    <input
                      type="text"
                      placeholder="e.g. Kavita Roy"
                      value={newApt.stylist}
                      onChange={(e) => setNewApt({ ...newApt, stylist: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
                    <input
                      type="text"
                      placeholder="02:30 PM - 03:30 PM"
                      value={newApt.timeSlot}
                      onChange={(e) => setNewApt({ ...newApt, timeSlot: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Cost</label>
                  <input
                    type="text"
                    placeholder="₹1,500"
                    value={newApt.amount}
                    onChange={(e) => setNewApt({ ...newApt, amount: e.target.value })}
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
                    className="flex-1 py-2.5 bg-pink-600 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Confirm Booking
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
