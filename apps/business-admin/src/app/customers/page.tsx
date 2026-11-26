'use client';

import React, { useState, useEffect } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Plus,
  Edit2,
  Eye,
  GraduationCap,
  BookOpen,
  DollarSign,
  Receipt,
  ShieldCheck,
  ChevronRight,
  X,
  MessageCircle,
  FileText,
  Building,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useActiveTenant } from '@/lib/tenant';
import { useTenantModules } from '@/lib/modules';

export default function CustomersPage() {
  const API_BASE = getApiBaseUrl();
  const { tenantId, tenantName } = useActiveTenant();
  const { crmLabel, categoryName } = useTenantModules(tenantId);

  const isEducation =
    crmLabel?.includes('Student') ||
    categoryName?.toLowerCase().includes('coaching') ||
    categoryName?.toLowerCase().includes('education') ||
    categoryName?.toLowerCase().includes('academy') ||
    categoryName?.toLowerCase().includes('tuition');

  const [customers, setCustomers] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({ total: 0, active: 0, expired: 0, feeDue: 0, leads: 0 });
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // 360° Profile Preview State
  const [previewStudent, setPreviewStudent] = useState<any | null>(null);
  const [previewTab, setPreviewTab] = useState<'OVERVIEW' | 'FEES' | 'ACADEMIC' | 'PARENT'>('OVERVIEW');

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Quick Collect Fee Modal State
  const [collectFeeStudent, setCollectFeeStudent] = useState<any | null>(null);
  const [feeCollectAmount, setFeeCollectAmount] = useState<number>(0);
  const [feeCollectMode, setFeeCollectMode] = useState<string>('UPI');
  const [feeCollectNote, setFeeCollectNote] = useState<string>('Term Fee Payment');
  const [isCollectingFee, setIsCollectingFee] = useState(false);

  // New Student Admission Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    batchName: 'NEET Dropper Medical Batch A',
    batchTiming: 'Daily (09:00 AM - 01:00 PM)',
    instructor: 'Dr. Neha Saxena',
    rollNo: '',
    totalFee: 35000,
    feePaid: 15000,
    paymentMode: 'UPI',
    parentName: '',
    parentPhone: '',
    joinedAt: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    loadCustomers();
  }, [tenantId, selectedStatus, searchQuery]);

  async function loadCustomers() {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/whatsapp/customers/${tenantId}`);
      if (selectedStatus !== 'ALL') url.searchParams.set('status', selectedStatus);
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data.customers || []);
        if (data.data.counts) setCounts(data.data.counts);

        // If preview modal is open, sync it
        if (previewStudent) {
          const fresh = (data.data.customers || []).find((c: any) => c.id === previewStudent.id);
          if (fresh) setPreviewStudent(fresh);
        }
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  }

  // Open Edit Modal with populated data
  const handleOpenEdit = (student: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const meta = student.metadata || {};
    const totalFee = Number(meta.totalFee || Number(student.pendingAmount) + Number(meta.feePaid || 0));
    const feePaid = Number(meta.feePaid || 0);

    setEditingStudent(student);
    setEditFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      phone: student.phone || '',
      email: student.email || '',
      status: student.status || 'ACTIVE',
      rollNo: meta.rollNo || '',
      batchName: meta.batchName || student.membershipPlan || 'General Batch',
      batchTiming: meta.batchTiming || '',
      instructor: meta.instructor || '',
      roomNo: meta.roomNo || '',
      totalFee: totalFee,
      feePaid: feePaid,
      pendingAmount: student.pendingAmount !== undefined ? Number(student.pendingAmount) : Math.max(0, totalFee - feePaid),
      parentName: meta.parentName || '',
      parentPhone: meta.parentPhone || '',
      joinedAt: student.joinedAt ? new Date(student.joinedAt).toISOString().split('T')[0] : '',
      notes: student.notes || '',
    });
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsUpdating(true);

    try {
      const totalFee = Number(editFormData.totalFee || 0);
      const feePaid = Number(editFormData.feePaid || 0);
      const pendingAmount = Math.max(0, totalFee - feePaid);

      const payload = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        phone: editFormData.phone,
        email: editFormData.email,
        status: editFormData.status,
        membershipPlan: editFormData.batchName,
        pendingAmount,
        joinedAt: editFormData.joinedAt ? new Date(editFormData.joinedAt).toISOString() : undefined,
        notes: editFormData.notes,
        metadata: {
          ...(editingStudent.metadata || {}),
          rollNo: editFormData.rollNo,
          batchName: editFormData.batchName,
          batchTiming: editFormData.batchTiming,
          instructor: editFormData.instructor,
          roomNo: editFormData.roomNo,
          parentName: editFormData.parentName,
          parentPhone: editFormData.parentPhone,
          totalFee,
          feePaid,
        },
      };

      const res = await fetch(`${API_BASE}/whatsapp/customers/${tenantId}/${editingStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update student');
      }

      setSuccessNotice(`Student "${editFormData.firstName}" updated successfully!`);
      setEditingStudent(null);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Error updating student record');
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Quick Fee Collection Modal
  const handleOpenCollectFee = (student: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const meta = student.metadata || {};
    const pending = Number(student.pendingAmount || 0);
    setCollectFeeStudent(student);
    setFeeCollectAmount(pending > 0 ? pending : 5000);
    setFeeCollectMode('UPI');
    setFeeCollectNote(`Tuition / Term Fee Payment for ${meta.batchName || student.membershipPlan || 'Course'}`);
  };

  // Submit Quick Fee Collection
  const handleSubmitFeePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectFeeStudent || feeCollectAmount <= 0) return;
    setIsCollectingFee(true);

    try {
      const res = await fetch(`${API_BASE}/whatsapp/customers/${tenantId}/${collectFeeStudent.id}/fee-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(feeCollectAmount),
          mode: feeCollectMode,
          note: feeCollectNote,
          receiptNo: `REC-${Date.now().toString().slice(-6)}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to record fee payment');
      }

      setSuccessNotice(`Fee of ₹${feeCollectAmount.toLocaleString('en-IN')} received successfully from ${collectFeeStudent.firstName}!`);
      setCollectFeeStudent(null);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Error collecting fee');
    } finally {
      setIsCollectingFee(false);
    }
  };

  // Handle Add New Student
  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const totalFee = Number(formData.totalFee || 0);
      const feePaid = Number(formData.feePaid || 0);
      const pendingAmount = Math.max(0, totalFee - feePaid);

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        status: formData.status,
        customerType: 'COACHING_STUDENT',
        membershipPlan: formData.batchName,
        batchName: formData.batchName,
        batchTiming: formData.batchTiming,
        rollNo: formData.rollNo || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        totalFee,
        feePaid,
        pendingAmount,
        paymentMode: formData.paymentMode,
        joinedAt: formData.joinedAt ? new Date(formData.joinedAt).toISOString() : new Date().toISOString(),
        notes: formData.notes,
      };

      const res = await fetch(`${API_BASE}/whatsapp/customers/${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to enroll student');
      }

      setSuccessNotice(`Student "${formData.firstName}" enrolled successfully! Welcome WhatsApp notification scheduled.`);
      setShowAddModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        status: 'ACTIVE',
        batchName: 'NEET Dropper Medical Batch A',
        batchTiming: 'Daily (09:00 AM - 01:00 PM)',
        instructor: 'Dr. Neha Saxena',
        rollNo: '',
        totalFee: 35000,
        feePaid: 15000,
        paymentMode: 'UPI',
        parentName: '',
        parentPhone: '',
        joinedAt: new Date().toISOString().split('T')[0],
        notes: '',
      });
      loadCustomers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filter batches for quick dropdown
  const uniqueBatches = Array.from(
    new Set(
      customers
        .map((c) => c.metadata?.batchName || c.membershipPlan)
        .filter(Boolean)
    )
  );

  const filteredCustomers = customers.filter((c) => {
    if (batchFilter !== 'ALL') {
      const b = c.metadata?.batchName || c.membershipPlan;
      if (b !== batchFilter) return false;
    }
    return true;
  });

  return (
    <BusinessShell>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {isEducation ? 'Student Admissions & Batch Directory' : 'Customer CRM & Member Directory'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {tenantName || 'Institute Portal'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Monitor admission dates, batch schedules, fees paid vs balance due, and click any student for a 360° academic profile.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isEducation ? 'Enroll New Student' : 'Add New Member'}</span>
            </button>
          </div>
        </div>

        {/* Notice */}
        {successNotice && (
          <div className="p-4 rounded-2xl text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {successNotice}
            </span>
            <button onClick={() => setSuccessNotice(null)} className="text-slate-400 hover:text-slate-600 p-1">
              &times;
            </button>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: isEducation ? 'Total Enrolled' : 'All Contacts', count: counts.total, status: 'ALL', color: 'slate' },
            { label: isEducation ? 'Active Students' : 'Active Members', count: counts.active, status: 'ACTIVE', color: 'emerald' },
            { label: 'Fee Overdue', count: counts.feeDue, status: 'FEE_DUE', color: 'rose' },
            { label: 'Inactive / Left', count: counts.expired, status: 'EXPIRED', color: 'slate' },
            { label: 'New Admissions', count: counts.leads, status: 'LEAD', color: 'amber' },
          ].map((item) => (
            <button
              key={item.status}
              onClick={() => setSelectedStatus(item.status)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedStatus === item.status
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-semibold text-slate-500 block">{item.label}</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{item.count}</p>
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll number, phone, email, or batch..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
            />
          </div>

          {uniqueBatches.length > 0 && (
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Batch:</span>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Batches</option>
                {uniqueBatches.map((b, i) => (
                  <option key={i} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={loadCustomers}
            className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Students Table */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3.5 px-5">Student / Roll No</th>
                  <th className="py-3.5 px-4">Batch & Course</th>
                  <th className="py-3.5 px-4">Admission Date</th>
                  <th className="py-3.5 px-4">Fees Status & Paid</th>
                  <th className="py-3.5 px-4">Parent / Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading student records...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No student records found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const meta = c.metadata || {};
                    const totalFee = Number(meta.totalFee || Number(c.pendingAmount) + Number(meta.feePaid || 0));
                    const feePaid = Number(meta.feePaid || 0);
                    const pending = Number(c.pendingAmount || 0);
                    const paidPct = totalFee > 0 ? Math.min(100, Math.round((feePaid / totalFee) * 100)) : 100;
                    const rollNo = meta.rollNo || `STU-${c.id.substring(0, 4).toUpperCase()}`;
                    const batchName = meta.batchName || c.membershipPlan || 'General Batch';
                    const batchTiming = meta.batchTiming || 'Standard Schedule';

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setPreviewStudent(c)}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                      >
                        {/* Student Name & Roll No */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                              {c.firstName[0]}
                              {c.lastName?.[0] || ''}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {c.firstName} {c.lastName || ''}
                                </p>
                                <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 font-mono font-bold text-slate-600 rounded">
                                  {rollNo}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{c.email || c.phone}</p>
                            </div>
                          </div>
                        </td>

                        {/* Batch & Timing */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{batchName}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{batchTiming}</span>
                            </p>
                          </div>
                        </td>

                        {/* Admission / Join Date */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {c.joinedAt
                                ? new Date(c.joinedAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Recent'}
                            </span>
                          </div>
                        </td>

                        {/* Fees Paid vs Total Breakdown */}
                        <td className="py-4 px-4 min-w-[170px]">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-slate-900">
                                ₹{feePaid.toLocaleString('en-IN')}{' '}
                                <span className="text-[11px] text-slate-400 font-normal">
                                  / ₹{totalFee.toLocaleString('en-IN')}
                                </span>
                              </span>
                              {pending > 0 ? (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  Due ₹{pending.toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Paid 100%
                                </span>
                              )}
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  paidPct === 100
                                    ? 'bg-emerald-500'
                                    : paidPct > 50
                                    ? 'bg-indigo-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${paidPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Parent & Phone */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <p className="text-slate-800 font-medium flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="font-mono">{c.phone}</span>
                            </p>
                            {meta.parentName && (
                              <p className="text-[11px] text-slate-500">
                                Parent: <span className="font-semibold">{meta.parentName}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              c.status === 'ACTIVE'
                                ? pending > 0
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.status === 'EXPIRED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {c.status === 'ACTIVE' ? (pending > 0 ? 'Fee Due' : 'Active') : c.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleOpenCollectFee(c, e)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Collect Fee Installment"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEdit(c, e)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Student Data (Admin)"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewStudent(c)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View Full Profile"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 360° STUDENT PROFILE PREVIEW MODAL / DRAWER                     */}
        {/* ============================================================== */}
        {previewStudent && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 relative animate-in zoom-in-95">
              <button
                onClick={() => setPreviewStudent(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Top Banner Info */}
              {(() => {
                const meta = previewStudent.metadata || {};
                const totalFee = Number(meta.totalFee || Number(previewStudent.pendingAmount) + Number(meta.feePaid || 0));
                const feePaid = Number(meta.feePaid || 0);
                const pending = Number(previewStudent.pendingAmount || 0);
                const rollNo = meta.rollNo || `STU-${previewStudent.id.substring(0, 4).toUpperCase()}`;
                const batchName = meta.batchName || previewStudent.membershipPlan || 'General Batch';
                const installments = Array.isArray(meta.feeInstallments) ? meta.feeInstallments : [];

                return (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 pr-8">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md">
                          {previewStudent.firstName[0]}
                          {previewStudent.lastName?.[0] || ''}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-slate-900">
                              {previewStudent.firstName} {previewStudent.lastName || ''}
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {rollNo}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <span>Admitted: {new Date(previewStudent.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">{batchName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button
                          onClick={() => handleOpenCollectFee(previewStudent)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Collect Fee</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(previewStudent)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Data</span>
                        </button>
                      </div>
                    </div>

                    {/* Stat Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[11px] font-medium text-slate-500">Total Course Fee</span>
                        <p className="text-xl font-black text-slate-900 mt-1">
                          ₹{totalFee.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                        <span className="text-[11px] font-medium text-emerald-700">Total Fee Paid</span>
                        <p className="text-xl font-black text-emerald-800 mt-1">
                          ₹{feePaid.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
                        <span className="text-[11px] font-medium text-rose-700">Balance Pending</span>
                        <p className="text-xl font-black text-rose-800 mt-1">
                          ₹{pending.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
                        <span className="text-[11px] font-medium text-indigo-700">Admission Date</span>
                        <p className="text-sm font-extrabold text-indigo-950 mt-1">
                          {new Date(previewStudent.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-200">
                      {[
                        { key: 'OVERVIEW', label: 'Batch & Academic Info' },
                        { key: 'FEES', label: `Fee Installments (${installments.length})` },
                        { key: 'PARENT', label: 'Parent & Communication' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setPreviewTab(tab.key as any)}
                          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer ${
                            previewTab === tab.key
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* TAB CONTENT 1: OVERVIEW & ACADEMIC */}
                    {previewTab === 'OVERVIEW' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                              Class & Batch Assignment
                            </h4>
                            <div className="space-y-2 text-xs text-slate-700">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Assigned Batch:</span>
                                <span className="font-bold text-slate-900">{batchName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Timing & Schedule:</span>
                                <span className="font-semibold text-slate-800">{meta.batchTiming || 'Mon, Wed, Fri (05:00 PM - 07:00 PM)'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Lead Faculty:</span>
                                <span className="font-semibold text-slate-800">{meta.instructor || 'Senior Faculty'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Room / Hall No:</span>
                                <span className="font-semibold text-slate-800">{meta.roomNo || 'Room 101'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Enrollment Status
                            </h4>
                            <div className="space-y-2 text-xs text-slate-700">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Admission Status:</span>
                                <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 text-[10px]">
                                  {previewStudent.status}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Fee Status:</span>
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${pending > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                  {pending > 0 ? `₹${pending.toLocaleString('en-IN')} Due` : '100% Cleared'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Registered Phone:</span>
                                <span className="font-mono font-bold text-slate-900">{previewStudent.phone}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Email Address:</span>
                                <span className="font-medium text-slate-800">{previewStudent.email || 'None provided'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {previewStudent.notes && (
                          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 text-xs text-amber-900">
                            <span className="font-bold block mb-1">Teacher / Counselor Remarks:</span>
                            <p>{previewStudent.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB CONTENT 2: FEES INSTALLMENT LEDGER */}
                    {previewTab === 'FEES' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Fee Payment & Receipts History
                          </h4>
                          <button
                            onClick={() => handleOpenCollectFee(previewStudent)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Collect Another Installment</span>
                          </button>
                        </div>

                        {installments.length === 0 ? (
                          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                            No installment payments recorded yet. Click &quot;Collect Fee&quot; to log initial fee receipt.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                            {installments.map((inst: any, idx: number) => (
                              <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-900 text-sm">
                                      ₹{Number(inst.amount).toLocaleString('en-IN')}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      {inst.mode || 'CASH'}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400">
                                      {inst.receiptNo || `REC-${idx + 1}`}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500">{inst.note || 'Fee installment'}</p>
                                </div>

                                <div className="text-right">
                                  <span className="text-[11px] font-medium text-slate-500">
                                    {new Date(inst.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  <span className="block text-[10px] font-bold text-emerald-600">Verified Receipt</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB CONTENT 3: PARENT & WHATSAPP */}
                    {previewTab === 'PARENT' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            Parent / Guardian Details
                          </h4>
                          <div className="space-y-2.5 text-xs text-slate-700">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Father / Mother Name:</span>
                              <span className="font-extrabold text-slate-900">{meta.parentName || 'Not recorded'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Parent Mobile Number:</span>
                              <span className="font-mono font-bold text-slate-900">{meta.parentPhone || previewStudent.phone}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Fee Reminder WhatsApp:</span>
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Automated Alerts Enabled
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <a
                            href={`https://wa.me/91${(meta.parentPhone || previewStudent.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Dear ${meta.parentName || 'Parent'}, this is from ${tenantName || 'Apex Career Institute'}. Regarding student ${previewStudent.firstName} (Batch: ${batchName}), current pending fee balance is ₹${pending.toLocaleString('en-IN')}. Thank you.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Send WhatsApp Fee Notice to Parent</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* EDIT STUDENT DATA MODAL (ADMIN CAPABILITY)                      */}
        {/* ============================================================== */}
        {editingStudent && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 relative animate-in zoom-in-95">
              <button
                onClick={() => setEditingStudent(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-1">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Student Information & Fee Structure
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Admin privileged control: Modify personal details, change assigned batch, join date, and fee ledger.
              </p>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Student Roll No</label>
                    <input
                      type="text"
                      value={editFormData.rollNo}
                      onChange={(e) => setEditFormData({ ...editFormData, rollNo: e.target.value })}
                      placeholder="e.g. APEX-2026-042"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admission / Join Date *</label>
                    <input
                      type="date"
                      required
                      value={editFormData.joinedAt}
                      onChange={(e) => setEditFormData({ ...editFormData, joinedAt: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Enrollment Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="ACTIVE">Active (Enrolled)</option>
                      <option value="EXPIRED">Inactive / Left</option>
                      <option value="LEAD">Prospective / Inquiry</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Batch / Course *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.batchName}
                      onChange={(e) => setEditFormData({ ...editFormData, batchName: e.target.value })}
                      placeholder="e.g. NEET Dropper Medical Batch A"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Schedule / Timing</label>
                    <input
                      type="text"
                      value={editFormData.batchTiming}
                      onChange={(e) => setEditFormData({ ...editFormData, batchTiming: e.target.value })}
                      placeholder="Daily (09:00 AM - 01:00 PM)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Instructor / Faculty</label>
                    <input
                      type="text"
                      value={editFormData.instructor}
                      onChange={(e) => setEditFormData({ ...editFormData, instructor: e.target.value })}
                      placeholder="e.g. Dr. Neha Saxena"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Fee Section */}
                  <div className="col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Total Course Fee (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={editFormData.totalFee}
                        onChange={(e) => setEditFormData({ ...editFormData, totalFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Paid So Far (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={editFormData.feePaid}
                        onChange={(e) => setEditFormData({ ...editFormData, feePaid: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Calculated Balance Due:</span>
                      <span className="font-bold text-rose-600">
                        ₹{Math.max(0, (editFormData.totalFee || 0) - (editFormData.feePaid || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                    <input
                      type="text"
                      value={editFormData.parentName}
                      onChange={(e) => setEditFormData({ ...editFormData, parentName: e.target.value })}
                      placeholder="e.g. Rajesh Gupta"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Mobile Number</label>
                    <input
                      type="text"
                      value={editFormData.parentPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, parentPhone: e.target.value })}
                      placeholder="e.g. 9822334400"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Counselor / Teacher Notes</label>
                  <textarea
                    rows={2}
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    placeholder="Notes regarding academic performance or fee commitment..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {isUpdating ? 'Saving...' : 'Save & Update Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* QUICK COLLECT FEE PAYMENT MODAL                                */}
        {/* ============================================================== */}
        {collectFeeStudent && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95">
              <button
                onClick={() => setCollectFeeStudent(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Collect Student Fee</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Record payment receipt for{' '}
                <strong className="text-slate-900">{collectFeeStudent.firstName} {collectFeeStudent.lastName || ''}</strong>.
              </p>

              <form onSubmit={handleSubmitFeePayment} className="space-y-3.5">
                <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-800">Current Balance Due:</span>
                  <span className="font-black text-rose-600 text-sm">
                    ₹{Number(collectFeeStudent.pendingAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Collect (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={feeCollectAmount}
                    onChange={(e) => setFeeCollectAmount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={feeCollectMode}
                    onChange={(e) => setFeeCollectMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash at Desk</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="ONLINE">Bank Transfer (NEFT/IMPS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Description / Receipt Note</label>
                  <input
                    type="text"
                    value={feeCollectNote}
                    onChange={(e) => setFeeCollectNote(e.target.value)}
                    placeholder="e.g. Term 2 Fee Payment"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCollectFeeStudent(null)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCollectingFee}
                    className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {isCollectingFee ? 'Processing...' : 'Confirm & Generate Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* NEW STUDENT ADMISSION MODAL                                    */}
        {/* ============================================================== */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 relative animate-in zoom-in-95">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Enroll New Student</h3>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Register student admission, assign batch & timetable, and configure course fee breakdown.
              </p>

              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sahil"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jain"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Student Phone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="student@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admission / Join Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.joinedAt}
                      onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Student Roll No (Auto or Custom)</label>
                    <input
                      type="text"
                      placeholder="e.g. APEX-2026-095"
                      value={formData.rollNo}
                      onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Batch / Course *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NEET Dropper Medical Batch A"
                      value={formData.batchName}
                      onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Schedule & Timings</label>
                    <input
                      type="text"
                      placeholder="Daily (09:00 AM - 01:00 PM)"
                      value={formData.batchTiming}
                      onChange={(e) => setFormData({ ...formData, batchTiming: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Instructor / Faculty</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Neha Saxena"
                      value={formData.instructor}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Fee Breakdown */}
                  <div className="col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Total Course Fee (₹) *</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formData.totalFee}
                        onChange={(e) => setFormData({ ...formData, totalFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Fee Paid at Admission (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.feePaid}
                        onChange={(e) => setFormData({ ...formData, feePaid: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Calculated Balance Due:</span>
                      <span className="font-bold text-rose-600">
                        ₹{Math.max(0, formData.totalFee - formData.feePaid).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Rajesh Jain"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876500000"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Enrolling...' : 'Confirm Admission'}
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
