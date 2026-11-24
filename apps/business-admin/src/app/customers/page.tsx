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
  MessageSquare,
  Clock,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

const DEMO_TENANT_ID = '1ccc2ab5-30fa-40a4-abc6-557bc6495b8a';

export default function CustomersPage() {
  const API_BASE = getApiBaseUrl();
  const [customers, setCustomers] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({ total: 0, active: 0, expired: 0, feeDue: 0, leads: 0 });
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // New Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    membershipPlan: 'Quarterly Fitness & Gym',
    pendingAmount: '0',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, [selectedStatus, searchQuery]);

  async function loadCustomers() {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/whatsapp/customers/${DEMO_TENANT_ID}`);
      if (selectedStatus !== 'ALL') url.searchParams.set('status', selectedStatus);
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data.customers || []);
        if (data.data.counts) setCounts(data.data.counts);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/whatsapp/customers/${DEMO_TENANT_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to add customer');
      }

      setSuccessNotice(`Member "${formData.firstName}" added successfully! Welcome WhatsApp message triggered.`);
      setShowAddModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        status: 'ACTIVE',
        membershipPlan: 'Quarterly Fitness & Gym',
        pendingAmount: '0',
      });
      loadCustomers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <BusinessShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer CRM & Members Directory</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage member registrations, pending dues, subscription renewals, and automated WhatsApp communication
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Member</span>
          </button>
        </div>

        {/* Notice */}
        {successNotice && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {successNotice}
            </span>
            <button onClick={() => setSuccessNotice(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'All Contacts', count: counts.total, status: 'ALL' },
            { label: 'Active Members', count: counts.active, status: 'ACTIVE' },
            { label: 'Fee Overdue', count: counts.feeDue, status: 'FEE_DUE' },
            { label: 'Expired', count: counts.expired, status: 'EXPIRED' },
            { label: 'New Leads', count: counts.leads, status: 'LEAD' },
          ].map((item) => (
            <button
              key={item.status}
              onClick={() => setSelectedStatus(item.status)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedStatus === item.status
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-600'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-medium text-slate-500 block">{item.label}</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{item.count}</p>
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by member name, phone or email..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-900"
            />
          </div>

          <button
            onClick={loadCustomers}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Members Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Membership Plan</th>
                  <th className="py-3 px-4">Pending Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {c.firstName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.firstName} {c.lastName || ''}</p>
                          <p className="text-[11px] text-slate-500">{c.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-800 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {c.phone}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {c.membershipPlan || 'General'}
                    </td>
                    <td className="py-3 px-4">
                      {Number(c.pendingAmount) > 0 ? (
                        <span className="font-bold text-rose-600">₹{c.pendingAmount}</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Cleared (₹0)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'EXPIRED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {new Date(c.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD MEMBER MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 text-sm">Register New Member</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">&times;</button>
              </div>

              <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="e.g. Ramesh"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="e.g. Kumar"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@gmail.com"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Membership Plan</label>
                    <input
                      type="text"
                      value={formData.membershipPlan}
                      onChange={(e) => setFormData({ ...formData, membershipPlan: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pending Due (₹)</label>
                    <input
                      type="number"
                      value={formData.pendingAmount}
                      onChange={(e) => setFormData({ ...formData, pendingAmount: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>An automated WhatsApp Welcome greeting will be sent to this number automatically!</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm"
                  >
                    {isSubmitting ? 'Registering...' : 'Save & Trigger WhatsApp'}
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
