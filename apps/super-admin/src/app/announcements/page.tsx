'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Flame,
  Clock,
  Eye,
  Trash2,
  Edit,
  X,
  ExternalLink,
  Calendar,
  Building2,
  Layers,
  ArrowRight,
  ShieldAlert,
  BellRing,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'PROMOTION';
  displayType: 'TOP_BANNER' | 'MODAL_POPUP';
  targetAudience: 'ALL_BUSINESSES' | 'SPECIFIC_CATEGORY' | 'SPECIFIC_PLAN';
  targetCategoryId: string | null;
  targetPlanId: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  isDismissible: boolean;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  priority: number;
  createdAt: string;
  liveStatus: 'active' | 'scheduled' | 'expired' | 'inactive';
  category?: { id: string; name: string; slug: string } | null;
  plan?: { id: string; name: string; slug: string } | null;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'PROMOTION'>('PROMOTION');
  const [displayType, setDisplayType] = useState<'TOP_BANNER' | 'MODAL_POPUP'>('TOP_BANNER');
  const [targetAudience, setTargetAudience] = useState<'ALL_BUSINESSES' | 'SPECIFIC_CATEGORY' | 'SPECIFIC_PLAN'>('ALL_BUSINESSES');
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [targetPlanId, setTargetPlanId] = useState('');
  const [ctaText, setCtaText] = useState('Explore Now');
  const [ctaUrl, setCtaUrl] = useState('/settings');
  const [isDismissible, setIsDismissible] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [priority, setPriority] = useState(1);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    let query = `?search=${encodeURIComponent(search)}`;
    if (statusFilter) query += `&status=${statusFilter}`;
    if (typeFilter) query += `&type=${typeFilter}`;

    const [annRes, catRes, planRes] = await Promise.all([
      apiRequest<{ items: Announcement[]; total: number }>(`/super-admin/announcements${query}`),
      apiRequest<any[]>('/super-admin/categories'),
      apiRequest<any[]>('/super-admin/plans'),
    ]);

    if (annRes.success && annRes.data) {
      setAnnouncements(annRes.data.items || []);
    }
    if (catRes.success && catRes.data) {
      setCategories(catRes.data || []);
    }
    if (planRes.success && planRes.data) {
      setPlans(planRes.data || []);
    }
    setLoading(false);
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setTitle('Webin10 AI Diet Planner Launch! 🥗');
    setMessage('We are thrilled to launch AI Diet Planner tonight at 12 AM for all gym partners. Enjoy auto-generated calorie and macro charts for your members!');
    setType('PROMOTION');
    setDisplayType('TOP_BANNER');
    setTargetAudience('ALL_BUSINESSES');
    setTargetCategoryId('');
    setTargetPlanId('');
    setCtaText('Explore AI Feature');
    setCtaUrl('/customers');
    setIsDismissible(true);
    setIsActive(true);
    setStartsAt('');
    setExpiresAt('');
    setPriority(1);
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: Announcement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setMessage(item.message);
    setType(item.type);
    setDisplayType(item.displayType);
    setTargetAudience(item.targetAudience);
    setTargetCategoryId(item.targetCategoryId || '');
    setTargetPlanId(item.targetPlanId || '');
    setCtaText(item.ctaText || '');
    setCtaUrl(item.ctaUrl || '');
    setIsDismissible(item.isDismissible);
    setIsActive(item.isActive);
    setStartsAt(item.startsAt ? item.startsAt.slice(0, 16) : '');
    setExpiresAt(item.expiresAt ? item.expiresAt.slice(0, 16) : '');
    setPriority(item.priority);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title,
      message,
      type,
      displayType,
      targetAudience,
      targetCategoryId: targetAudience === 'SPECIFIC_CATEGORY' ? targetCategoryId : undefined,
      targetPlanId: targetAudience === 'SPECIFIC_PLAN' ? targetPlanId : undefined,
      ctaText: ctaText.trim() ? ctaText.trim() : undefined,
      ctaUrl: ctaUrl.trim() ? ctaUrl.trim() : undefined,
      isDismissible,
      isActive,
      startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      priority: Number(priority),
    };

    const endpoint = editingId ? `/super-admin/announcements/${editingId}` : '/super-admin/announcements';
    const method = editingId ? 'PUT' : 'POST';

    const res = await apiRequest(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setModalOpen(false);
      fetchAnnouncements();
    } else {
      setError(res.error || 'Failed to save announcement');
    }
    setSaving(false);
  };

  const handleToggleActive = async (id: string) => {
    const res = await apiRequest(`/super-admin/announcements/${id}/toggle`, {
      method: 'PATCH',
    });
    if (res.success) {
      fetchAnnouncements();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete announcement "${name}"? This action cannot be undone.`)) {
      return;
    }
    const res = await apiRequest(`/super-admin/announcements/${id}`, {
      method: 'DELETE',
    });
    if (res.success) {
      fetchAnnouncements();
    }
  };

  // Type styling helpers
  const getTypeBadge = (t: string) => {
    switch (t) {
      case 'PROMOTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-600" /> Promotion / Offer
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="w-3 h-3 text-red-600" /> Critical Alert
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Notice / Maintenance
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Milestone / Success
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3 text-blue-600" /> General Info
          </span>
        );
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live Now
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" /> Scheduled
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Inactive
          </span>
        );
    }
  };

  // Banner Live Preview Color Scheme Generator
  const getPreviewBannerStyle = (t: string) => {
    switch (t) {
      case 'PROMOTION':
        return {
          wrapper: 'bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white border-purple-500/40',
          badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
          button: 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/30',
          icon: <Sparkles className="w-4 h-4 text-purple-300" />,
        };
      case 'CRITICAL':
        return {
          wrapper: 'bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-white border-red-500/50',
          badge: 'bg-red-500/20 text-red-300 border border-red-500/40',
          button: 'bg-white hover:bg-red-50 text-red-700 shadow-red-900/30',
          icon: <ShieldAlert className="w-4 h-4 text-red-300 animate-bounce" />,
        };
      case 'WARNING':
        return {
          wrapper: 'bg-gradient-to-r from-amber-950 via-orange-950 to-amber-950 text-white border-amber-500/40',
          badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          button: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30',
          icon: <AlertTriangle className="w-4 h-4 text-amber-300" />,
        };
      case 'SUCCESS':
        return {
          wrapper: 'bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 text-white border-emerald-500/40',
          badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          button: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-300" />,
        };
      default:
        return {
          wrapper: 'bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white border-blue-500/40',
          badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
          button: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30',
          icon: <Info className="w-4 h-4 text-blue-300" />,
        };
    }
  };

  const previewStyle = getPreviewBannerStyle(type);

  // Quick stats
  const activeCount = announcements.filter((a) => a.liveStatus === 'active').length;
  const scheduledCount = announcements.filter((a) => a.liveStatus === 'scheduled').length;

  return (
    <AdminShell>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Dashboard Announcement Banners & Popups
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                  {activeCount} Live Nationwide
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Broadcast instant promotional banners, festival offers, and critical maintenance notices directly onto gym owner dashboards across India
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Broadcast New Announcement</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Active Live Banners</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <BellRing className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{activeCount}</div>
            <p className="text-[11px] text-slate-500">Currently blinking on active gym owner dashboards</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Scheduled Upcoming</span>
              <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{scheduledCount}</div>
            <p className="text-[11px] text-slate-500">Configured to auto-activate on schedule</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Target Coverage</span>
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Building2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">100% Pan-India</div>
            <p className="text-[11px] text-slate-500">Target All Businesses or Specific Categories / Plans</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="">All Statuses</option>
              <option value="active">Live Now</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="">All Notice Types</option>
              <option value="PROMOTION">Promotions & Offers</option>
              <option value="INFO">General Info</option>
              <option value="WARNING">Maintenance / Warning</option>
              <option value="CRITICAL">Critical Alert</option>
              <option value="SUCCESS">Milestone</option>
            </select>
          </div>
        </div>

        {/* Announcements List */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-purple-600" />
              Configured Announcements ({announcements.length})
            </h2>
            <span className="text-xs text-slate-500">Highest priority notices render at the top</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Loading platform announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No announcements found</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Create your first platform notice to broadcast festival discounts, AI feature releases, or maintenance alerts to all business dashboards.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Broadcast Announcement
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {announcements.map((item) => (
                <div key={item.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {item.displayType === 'TOP_BANNER' ? 'Top Banner' : 'Popup Modal'}
                        </span>
                        {getTypeBadge(item.type)}
                        {getStatusBadge(item.liveStatus)}
                        {item.targetAudience === 'ALL_BUSINESSES' ? (
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            All Businesses
                          </span>
                        ) : item.targetAudience === 'SPECIFIC_CATEGORY' ? (
                          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            Category: {item.category?.name || 'Category'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                            Plan: {item.plan?.name || 'Plan'}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">Priority: #{item.priority}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl line-clamp-2">
                        {item.message}
                      </p>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      {/* Live Toggle */}
                      <button
                        onClick={() => handleToggleActive(item.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Toggle active status"
                      >
                        {item.isActive ? 'Active (ON)' : 'Disabled (OFF)'}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit announcement"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100 font-mono">
                    {item.ctaText && (
                      <div className="flex items-center gap-1 text-indigo-600 font-medium">
                        <span>CTA: "{item.ctaText}"</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-slate-500 truncate max-w-[150px]">{item.ctaUrl}</span>
                      </div>
                    )}
                    {item.startsAt && (
                      <div>Starts: {new Date(item.startsAt).toLocaleDateString()} {new Date(item.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    )}
                    {item.expiresAt ? (
                      <div>Expires: {new Date(item.expiresAt).toLocaleDateString()} {new Date(item.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    ) : (
                      <div>No Expiry (Until Disabled)</div>
                    )}
                    <div>Dismissible: {item.isDismissible ? 'Yes' : 'No (Persistent)'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create / Edit Modal with REAL-TIME LIVE PREVIEW */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 py-6 sm:py-10">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {editingId ? 'Edit Announcement Banner' : 'Create & Broadcast Announcement Banner'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Instantly alerts all business owners when they visit their dashboard
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form & Live Preview Grid */}
              <form onSubmit={handleSave} className="p-6 space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* 🌟 LIVE REAL-TIME PREVIEW BOX */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-purple-600" />
                      Live Real-Time Preview (What Gym Owners Will See)
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Updates dynamically as you type</span>
                  </div>

                  <div className={`p-4 rounded-xl border shadow-md transition-all ${previewStyle.wrapper}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                          {previewStyle.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold tracking-tight text-white">{title || 'Your Announcement Title'}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${previewStyle.badge}`}>
                              {type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 mt-0.5 line-clamp-2">
                            {message || 'Your announcement message will appear here for all business admins...'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {ctaText && (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${previewStyle.button}`}>
                            <span>{ctaText}</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                        {isDismissible && (
                          <span className="p-1 text-slate-300 hover:text-white rounded-lg cursor-pointer">
                            <X className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* Title */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Announcement Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Webin10 AI Diet Planner Launch! 🥗 or Festival 50% Upgrade Offer"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  {/* Message */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Detailed Message Copy *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Enter the full message for gym owners..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                    />
                  </div>

                  {/* Notice Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Notice Type (Color Scheme)</label>
                    <select
                      value={type}
                      onChange={(e: any) => setType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="PROMOTION">Promotion / Feature Launch (Purple Gradient)</option>
                      <option value="CRITICAL">Critical Alert (Red Urgent)</option>
                      <option value="WARNING">Maintenance / Warning (Amber)</option>
                      <option value="SUCCESS">Milestone / Update (Emerald Green)</option>
                      <option value="INFO">General Information (Blue)</option>
                    </select>
                  </div>

                  {/* Display Format */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Display Format</label>
                    <select
                      value={displayType}
                      onChange={(e: any) => setDisplayType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="TOP_BANNER">Sticky Top Dashboard Banner</option>
                      <option value="MODAL_POPUP">Center Modal Dialog (Upon Login)</option>
                    </select>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Target Audience</label>
                    <select
                      value={targetAudience}
                      onChange={(e: any) => setTargetAudience(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="ALL_BUSINESSES">All Businesses & Gyms (Pan-India)</option>
                      <option value="SPECIFIC_CATEGORY">Specific Business Category</option>
                      <option value="SPECIFIC_PLAN">Specific Subscription Plan</option>
                    </select>
                  </div>

                  {/* Target Category (if selected) */}
                  {targetAudience === 'SPECIFIC_CATEGORY' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Select Category</label>
                      <select
                        value={targetCategoryId}
                        onChange={(e) => setTargetCategoryId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="">Select a Category...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.slug})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Target Plan (if selected) */}
                  {targetAudience === 'SPECIFIC_PLAN' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Select Plan</label>
                      <select
                        value={targetPlanId}
                        onChange={(e) => setTargetPlanId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="">Select a Plan...</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.priceMonthly}/mo)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* CTA Text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Call to Action Button Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Upgrade Now, Learn More, Explore"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  {/* CTA URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Call to Action Link / Path</label>
                    <input
                      type="text"
                      placeholder="e.g. /settings/billing or https://..."
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  {/* Schedule Starts At */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Schedule Start (Optional)</label>
                    <input
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  {/* Schedule Expires At */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Schedule Expiry (Optional)</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  {/* Priority & Toggles */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Display Priority (Higher = Top)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-col justify-end space-y-2 pb-1">
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDismissible}
                        onChange={(e) => setIsDismissible(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Allow gym owners to dismiss/close this notice</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Active immediately upon saving</span>
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm shadow-purple-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>{saving ? 'Broadcasting...' : editingId ? 'Update Announcement' : 'Broadcast to All Dashboards'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
