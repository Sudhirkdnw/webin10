'use client';

import React, { useState } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  Pill,
  Calendar,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  Phone,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';

export default function MedicineRefillPage() {
  const { tenantName } = useActiveTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [refills, setRefills] = useState([
    {
      id: 'ref-1',
      patientName: 'Subhash Chandra Gupta',
      phone: '+91 98199 44332',
      medicines: 'Metformin 500mg, Telmisartan 40mg',
      dosageDays: '30 Days Supply',
      nextDueDate: 'Tomorrow (27 Nov)',
      status: 'DUE_SOON',
      doctor: 'Dr. A. K. Sen',
      totalCost: '₹1,240',
    },
    {
      id: 'ref-2',
      patientName: 'Manju Devi',
      phone: '+91 97223 11099',
      medicines: 'Thyronorm 50mcg, Calcium D3',
      dosageDays: '60 Days Supply',
      nextDueDate: 'In 3 Days',
      status: 'REMINDER_SENT',
      doctor: 'Dr. Meenakshi Roy',
      totalCost: '₹680',
    },
    {
      id: 'ref-3',
      patientName: 'Kishore Trivedi',
      phone: '+91 99345 88776',
      medicines: 'Atorvastatin 10mg, Ecosprin 75mg',
      dosageDays: '30 Days Supply',
      nextDueDate: 'Yesterday (Overdue)',
      status: 'OVERDUE',
      doctor: 'Dr. Vivek Mehra',
      totalCost: '₹950',
    },
  ]);

  const [newRefill, setNewRefill] = useState({
    patientName: '',
    phone: '',
    medicines: '',
    dosageDays: '30 Days',
    totalCost: '₹1,000',
  });

  const handleAddRefill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefill.patientName) return;
    setRefills([
      ...refills,
      {
        id: `ref-${Date.now()}`,
        patientName: newRefill.patientName,
        phone: newRefill.phone || '+91 90000 00000',
        medicines: newRefill.medicines || 'Prescription Items',
        dosageDays: newRefill.dosageDays,
        nextDueDate: 'In 30 Days',
        status: 'DUE_SOON',
        doctor: 'Attending Physician',
        totalCost: newRefill.totalCost,
      },
    ]);
    setIsAddModalOpen(false);
    setNewRefill({ patientName: '', phone: '', medicines: '', dosageDays: '30 Days', totalCost: '₹1,000' });
  };

  const filteredRefills = refills.filter(
    (r) =>
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.medicines.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery)
  );

  return (
    <BusinessShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Pill className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Prescriptions & Medicine Refill Hub</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated chronic disease refills, prescription reminders, and 1-click WhatsApp re-order for {tenantName}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Patient Refill Schedule</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Due This Week</div>
            <div className="text-2xl font-extrabold text-amber-600">
              {refills.filter((r) => r.status === 'DUE_SOON' || r.status === 'REMINDER_SENT').length} Patients
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Ready for re-order packet</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Overdue Follow-ups</div>
            <div className="text-2xl font-extrabold text-rose-600">
              {refills.filter((r) => r.status === 'OVERDUE').length} Patient
            </div>
            <div className="text-[11px] text-rose-500 mt-1">Requires immediate call</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Monthly Recurring Pharmacy Sale</div>
            <div className="text-2xl font-extrabold text-slate-900">₹42,850</div>
            <div className="text-[11px] text-emerald-600 mt-1">Guaranteed regular pharmacy revenue</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, phone, medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredRefills.map((r) => (
              <div
                key={r.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{r.patientName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : r.status === 'REMINDER_SENT'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                    <span className="font-medium text-slate-800 flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5 text-emerald-600" />
                      {r.medicines}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{r.dosageDays}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-amber-700">Due: {r.nextDueDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{r.totalCost}</div>
                    <div className="text-[11px] text-slate-400">{r.phone}</div>
                  </div>
                  <button
                    onClick={() => alert(`WhatsApp Refill Reminder queued for ${r.patientName}!`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reminder</span>
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
              <h3 className="text-base font-bold text-slate-900 mb-1">Add Patient Refill Schedule</h3>
              <p className="text-xs text-slate-500 mb-4">Set up automated recurring medicine reminders.</p>

              <form onSubmit={handleAddRefill} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={newRefill.patientName}
                    onChange={(e) => setNewRefill({ ...newRefill, patientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newRefill.phone}
                    onChange={(e) => setNewRefill({ ...newRefill, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medicines / Rx Items</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Metformin 500mg, Atorva 10mg"
                    value={newRefill.medicines}
                    onChange={(e) => setNewRefill({ ...newRefill, medicines: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage Period</label>
                    <select
                      value={newRefill.dosageDays}
                      onChange={(e) => setNewRefill({ ...newRefill, dosageDays: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days (Monthly)</option>
                      <option value="60 Days">60 Days</option>
                      <option value="90 Days">90 Days (Quarterly)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Package Price</label>
                    <input
                      type="text"
                      placeholder="₹1,200"
                      value={newRefill.totalCost}
                      onChange={(e) => setNewRefill({ ...newRefill, totalCost: e.target.value })}
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
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Save Refill Schedule
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
