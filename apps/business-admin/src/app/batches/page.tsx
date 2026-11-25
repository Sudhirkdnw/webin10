'use client';

import React, { useState } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  X,
  ChevronRight,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';

export default function BatchesCoursesPage() {
  const { tenantName } = useActiveTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [batches, setBatches] = useState([
    {
      id: 'b-1',
      name: 'Class 12 - Physics & Chemistry Target 2027',
      instructor: 'Er. Alok Verma',
      schedule: 'Mon, Wed, Fri (05:00 PM - 07:00 PM)',
      enrolled: 32,
      capacity: 40,
      fee: '₹18,000 / year',
      status: 'ACTIVE',
    },
    {
      id: 'b-2',
      name: 'NEET Dropper Medical Batch A',
      instructor: 'Dr. Neha Saxena',
      schedule: 'Daily (09:00 AM - 01:00 PM)',
      enrolled: 45,
      capacity: 45,
      fee: '₹35,000 / year',
      status: 'FULL',
    },
    {
      id: 'b-3',
      name: 'Class 10 CBSE Board Crash Course',
      instructor: 'S. K. Gupta',
      schedule: 'Tue, Thu, Sat (04:00 PM - 06:00 PM)',
      enrolled: 18,
      capacity: 35,
      fee: '₹12,000 / batch',
      status: 'ACTIVE',
    },
  ]);

  const [newBatch, setNewBatch] = useState({
    name: '',
    instructor: '',
    schedule: '',
    capacity: '30',
    fee: '',
  });

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name) return;
    setBatches([
      ...batches,
      {
        id: `b-${Date.now()}`,
        name: newBatch.name,
        instructor: newBatch.instructor || 'Lead Instructor',
        schedule: newBatch.schedule || 'Flexible Timetable',
        enrolled: 1,
        capacity: parseInt(newBatch.capacity) || 30,
        fee: newBatch.fee || '₹10,000',
        status: 'ACTIVE',
      },
    ]);
    setIsAddModalOpen(false);
    setNewBatch({ name: '', instructor: '', schedule: '', capacity: '30', fee: '' });
  };

  const filteredBatches = batches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BusinessShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Courses & Batches Management</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Organize classrooms, assign faculty, monitor seat capacities, and student schedules.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Batch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Total Active Batches</div>
            <div className="text-2xl font-extrabold text-slate-900">{batches.length}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Ongoing Academic Year</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Enrolled Students</div>
            <div className="text-2xl font-extrabold text-indigo-600">
              {batches.reduce((sum, b) => sum + b.enrolled, 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across all courses</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Average Batch Capacity</div>
            <div className="text-2xl font-extrabold text-slate-900">
              {Math.round(
                (batches.reduce((sum, b) => sum + b.enrolled, 0) /
                  batches.reduce((sum, b) => sum + b.capacity, 0)) *
                  100
              )}
              %
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Occupancy rate</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search batch or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredBatches.map((b) => (
              <div key={b.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'FULL'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                      {b.instructor}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {b.schedule}
                    </span>
                    <span className="font-semibold text-slate-700">{b.fee}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-800">
                      {b.enrolled} / {b.capacity} Students
                    </div>
                    <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (b.enrolled / b.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900 mb-1">Create New Batch</h3>
              <p className="text-xs text-slate-500 mb-4">Set batch title, instructor, and capacity.</p>

              <form onSubmit={handleAddBatch} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch / Course Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class 11 Chemistry Mastery"
                    value={newBatch.name}
                    onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty / Instructor</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. R. K. Sharma"
                    value={newBatch.instructor}
                    onChange={(e) => setNewBatch({ ...newBatch, instructor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule</label>
                    <input
                      type="text"
                      placeholder="Mon-Wed-Fri 5-7 PM"
                      value={newBatch.schedule}
                      onChange={(e) => setNewBatch({ ...newBatch, schedule: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Seats</label>
                    <input
                      type="number"
                      placeholder="35"
                      value={newBatch.capacity}
                      onChange={(e) => setNewBatch({ ...newBatch, capacity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Structure</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹15,000 / semester"
                    value={newBatch.fee}
                    onChange={(e) => setNewBatch({ ...newBatch, fee: e.target.value })}
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
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Save Batch
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
