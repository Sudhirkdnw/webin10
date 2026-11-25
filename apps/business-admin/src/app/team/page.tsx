'use client';

import React, { useState, useEffect } from 'react';
import { BusinessShell } from '@/components/business-shell';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Search,
  UserCheck,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useActiveTenant } from '@/lib/tenant';

interface StaffMember {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    phone: string | null;
    fullName: string;
    isActive: boolean;
  };
}

const ROLE_OPTIONS = [
  { value: 'BUSINESS_OWNER', label: 'Business Owner', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'BUSINESS_MANAGER', label: 'Business Manager', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'BRANCH_MANAGER', label: 'Branch Manager', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'RECEPTIONIST', label: 'Front Desk / Receptionist', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'ACCOUNTANT', label: 'Accountant & Billing', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'TRAINER', label: 'Trainer / Coach', color: 'bg-teal-100 text-teal-800 border-teal-200' },
];

export default function TeamPage() {
  const API_BASE = getApiBaseUrl();
  const { tenantId, tenantName } = useActiveTenant();

  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'BUSINESS_MANAGER',
  });

  // Edit Role Modal
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Load Members
  const loadMembers = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/members`);
      const json = await res.json();
      if (json.success && json.data) {
        setMembers(json.data);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [tenantId]);

  // Handle Invite Staff
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setInviting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Staff member ${inviteForm.fullName} added successfully with role ${inviteForm.role}!`);
        setShowInviteModal(false);
        setInviteForm({ fullName: '', email: '', phone: '', role: 'BUSINESS_MANAGER' });
        await loadMembers();
      } else {
        setErrorMsg(json.error?.message || 'Failed to add staff member.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating staff member');
    } finally {
      setInviting(false);
    }
  };

  // Handle Update Role
  const handleUpdateRole = async () => {
    if (!tenantId || !editingMember) return;
    setUpdatingRole(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/members/${editingMember.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Role updated to ${newRole} for ${editingMember.user.fullName}!`);
        setEditingMember(null);
        await loadMembers();
      } else {
        setErrorMsg(json.error?.message || 'Failed to update member role.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating member role');
    } finally {
      setUpdatingRole(false);
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async (member: StaffMember) => {
    if (!tenantId) return;
    if (member.role === 'BUSINESS_OWNER') {
      alert('The Business Owner role cannot be removed.');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${member.user.fullName} from your business team?`)) {
      return;
    }

    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/members/${member.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Staff member ${member.user.fullName} has been removed.`);
        await loadMembers();
      } else {
        setErrorMsg(json.error?.message || 'Failed to remove member.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error removing member');
    }
  };

  // Filtered members
  const filtered = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.user.fullName.toLowerCase().includes(q) ||
      m.user.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.user.phone && m.user.phone.includes(q))
    );
  });

  const getRoleBadge = (role: string) => {
    const match = ROLE_OPTIONS.find((r) => r.value === role);
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
          match ? match.color : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
      >
        {match?.label || role}
      </span>
    );
  };

  return (
    <BusinessShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Multi-Role Staff Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Staff & Team Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Invite team members, assign operational roles (Managers, Front Desk, Accountants, Trainers), and manage permissions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={loadMembers}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
              title="Refresh staff roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Staff Member</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-300 text-red-900 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Total Staff Roster</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{members.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Active Accounts</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {members.filter((m) => m.user.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Operational Roles</span>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {new Set(members.map((m) => m.role)).size}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Table & Search */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900">Assigned Team Members</h3>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, email, role..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">No Staff Members Found</h4>
              <p className="text-xs text-slate-400 mt-1">
                Click &quot;Invite Staff Member&quot; to add your first manager, receptionist, or trainer.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Role & Permissions</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filtered.map((member) => {
                    const initials =
                      member.user.fullName
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join('') || 'ST';

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Member Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block text-sm">
                                {member.user.fullName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                {member.user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">{getRoleBadge(member.role)}</td>

                        {/* Contact */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-slate-600">
                            {member.user.phone ? (
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {member.user.phone}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">No phone listed</span>
                            )}
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(member.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              member.user.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {member.user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingMember(member);
                                setNewRole(member.role);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                              title="Change Role"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Role</span>
                            </button>

                            {member.role !== 'BUSINESS_OWNER' && (
                              <button
                                onClick={() => handleRemoveMember(member)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Remove Staff Member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ======================= INVITE STAFF MODAL ======================= */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm">Invite Team Member</span>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="ramesh@fitzone.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    placeholder="+91 98765 12345"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Assign Operational Role *</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {ROLE_OPTIONS.filter((r) => r.value !== 'BUSINESS_OWNER').map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Front Desk / Receptionist can manage check-ins and customer CRM. Accountants can view billing and GST invoices.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    {inviting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Send Invite</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================= CHANGE ROLE MODAL ======================= */}
        {editingMember && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-sm">Update Role: {editingMember.user.fullName}</span>
                </div>
                <button
                  onClick={() => setEditingMember(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Select New Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateRole}
                    disabled={updatingRole}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    {updatingRole ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Save Role</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BusinessShell>
  );
}
