'use client';

import React, { useState } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  Clock,
  Users,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Coffee,
  X,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';

export default function WorkforcePage() {
  const { tenantName } = useActiveTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [shifts, setShifts] = useState([
    {
      id: 'sh-1',
      employee: 'Vikram Singh (Senior Trainer)',
      shiftName: 'Morning Opening Shift',
      timing: '06:00 AM - 02:00 PM',
      days: 'Mon - Sat',
      status: 'ON_DUTY',
    },
    {
      id: 'sh-2',
      employee: 'Pooja Nair (Front Desk Executive)',
      shiftName: 'General Front Office',
      timing: '09:00 AM - 06:00 PM',
      days: 'Mon - Sat',
      status: 'ON_DUTY',
    },
    {
      id: 'sh-3',
      employee: 'Rajesh Meena (Floor Coach)',
      shiftName: 'Evening Peak Shift',
      timing: '02:00 PM - 10:00 PM',
      days: 'Mon - Sat',
      status: 'UPCOMING',
    },
    {
      id: 'sh-4',
      employee: 'Simran Kaur (Nutritionist)',
      shiftName: 'Weekly Off / Leave',
      timing: 'N/A',
      days: 'Sunday Off',
      status: 'ON_LEAVE',
    },
  ]);

  const [newShift, setNewShift] = useState({
    employee: '',
    shiftName: '',
    timing: '09:00 AM - 06:00 PM',
    days: 'Mon - Sat',
  });

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.employee) return;
    setShifts([
      ...shifts,
      {
        id: `sh-${Date.now()}`,
        employee: newShift.employee,
        shiftName: newShift.shiftName || 'General Duty',
        timing: newShift.timing,
        days: newShift.days,
        status: 'UPCOMING',
      },
    ]);
    setIsAddModalOpen(false);
    setNewShift({ employee: '', shiftName: '', timing: '09:00 AM - 06:00 PM', days: 'Mon - Sat' });
  };

  const filteredShifts = shifts.filter(
    (s) =>
      s.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.shiftName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BusinessShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Roster & Shift Scheduling</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage work shifts, weekly offs, overtime calculation, and staff rotations for {tenantName}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Staff Shift</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Staff Currently On Duty</div>
            <div className="text-2xl font-extrabold text-teal-600">
              {shifts.filter((s) => s.status === 'ON_DUTY').length} Staff
            </div>
            <div className="text-[11px] text-emerald-600 mt-1">Floor coverage 100%</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Upcoming Afternoon Shift</div>
            <div className="text-2xl font-extrabold text-slate-900">
              {shifts.filter((s) => s.status === 'UPCOMING').length} Staff
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Reporting at 02:00 PM</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Approved Leave Today</div>
            <div className="text-2xl font-extrabold text-amber-600">
              {shifts.filter((s) => s.status === 'ON_LEAVE').length} Staff
            </div>
            <div className="text-[11px] text-amber-600 mt-1">Weekly off / Casual Leave</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff employee, shift..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredShifts.map((s) => (
              <div
                key={s.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{s.employee}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'ON_DUTY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.status === 'UPCOMING'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="font-medium text-slate-700">{s.shiftName}</span>
                    <span>•</span>
                    <span>{s.days}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>{s.timing}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Shift Timings</div>
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
              <h3 className="text-base font-bold text-slate-900 mb-1">Assign Shift Roster</h3>
              <p className="text-xs text-slate-500 mb-4">Assign work timing to an employee.</p>

              <form onSubmit={handleAddShift} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newShift.employee}
                    onChange={(e) => setNewShift({ ...newShift, employee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Role / Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning Shift Instructor"
                    value={newShift.shiftName}
                    onChange={(e) => setNewShift({ ...newShift, shiftName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Working Hours</label>
                    <input
                      type="text"
                      placeholder="06:00 AM - 02:00 PM"
                      value={newShift.timing}
                      onChange={(e) => setNewShift({ ...newShift, timing: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Days</label>
                    <input
                      type="text"
                      placeholder="Mon - Sat"
                      value={newShift.days}
                      onChange={(e) => setNewShift({ ...newShift, days: e.target.value })}
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
                    className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Save Shift
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
