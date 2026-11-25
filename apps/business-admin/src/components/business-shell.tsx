'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CreditCard,
  CalendarCheck,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Building2,
  Sparkles,
  Zap,
  Menu,
  X,
  ShieldAlert,
  LogOut,
  Mail,
  UserCheck,
  QrCode,
  BookOpen,
  Calendar,
  Pill,
  Receipt,
  Boxes,
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';
import { useTenantModules } from '@/lib/modules';
import { getApiBaseUrl } from '@/lib/api';
import { AnnouncementBanner } from './announcement-banner';

interface BusinessShellProps {
  children: React.ReactNode;
}

export function BusinessShell({ children }: BusinessShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { tenantId, tenantName, isImpersonating, isReady, exitImpersonation } = useActiveTenant();
  const { activeKeys, crmLabel, categoryName } = useTenantModules(tenantId);
  const [subInfo, setSubInfo] = useState<{ planName: string; status: string; daysRemaining: number } | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    const API_BASE = getApiBaseUrl();
    fetch(`${API_BASE}/tenants/${tenantId}/subscription`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.currentSubscription) {
          setSubInfo(d.data.currentSubscription);
        }
      })
      .catch(() => {});
  }, [tenantId]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('webin10_active_tenant_id');
      localStorage.removeItem('webin10_active_tenant_name');
      localStorage.removeItem('webin10_is_support_mode');
      localStorage.removeItem('webin10_impersonate_tenant_id');
      localStorage.removeItem('webin10_impersonate_tenant_name');
      localStorage.removeItem('webin10_auth_token');
      localStorage.removeItem('webin10_refresh_token');

      if (isImpersonating) {
        exitImpersonation();
      } else {
        window.location.href = '/login';
      }
    }
  };

  // Helper for 2-letter initials
  const initials = tenantName
    ? tenantName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('')
    : 'BZ';

  // If no tenant is active or if the tenant was deleted from the database:
  if (isReady && !tenantId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">No Active Business Workspace</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This workspace has been deleted or expired in the database. Please sign in with your active business credentials or register a new workspace.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <Link
              href="/login"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Sign In to Your Business</span>
            </Link>
            <Link
              href="/register"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all border border-slate-700 flex items-center justify-center gap-2"
            >
              <span>Register New Business (14-Day Free Trial)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: crmLabel || 'Customers & CRM', href: '/customers', icon: Users },
    ...(activeKeys?.includes('attendance_qr')
      ? [{ name: 'Attendance & QR', href: '/attendance', icon: QrCode }]
      : []),
    ...(activeKeys?.includes('courses_batches')
      ? [{ name: 'Batches & Courses', href: '/batches', icon: BookOpen }]
      : []),
    ...(activeKeys?.includes('appointments')
      ? [{ name: 'Appointments & Slots', href: '/appointments', icon: Calendar }]
      : []),
    ...(activeKeys?.includes('medicine_refill')
      ? [{ name: 'Prescriptions & Refills', href: '/refills', icon: Pill }]
      : []),
    ...(activeKeys?.includes('udhar_khata')
      ? [{ name: 'Udhar Khata & Ledger', href: '/khata', icon: Receipt }]
      : []),
    {
      name: 'WhatsApp Hub',
      href: '/whatsapp',
      icon: MessageSquare,
      highlight: true,
      badge: 'Live Auto',
    },
    {
      name: 'Email Hub',
      href: '/email',
      icon: Mail,
      badge: 'New',
    },
    { name: 'Plan & Billing', href: '/billing', icon: CreditCard },
    { name: 'Team & Staff', href: '/team', icon: UserCheck },
    {
      name: 'Feature Modules',
      href: '/modules',
      icon: Boxes,
      badge: 'Apps',
    },
    { name: 'Business Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ⚠️ SUPER ADMIN IMPERSONATION RED BAR (Only visible to Super Admin in Support Mode) */}
      {isImpersonating && (
        <div className="bg-red-600 text-white font-medium px-4 py-2.5 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-0 z-50 border-b border-red-700">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <div className="truncate">
              <span>
                ⚠️ You are viewing <strong>{tenantName}</strong> in Super Admin Support Mode (Audited)
              </span>
            </div>
          </div>
          <button
            onClick={exitImpersonation}
            className="px-3.5 py-1.5 bg-white hover:bg-red-50 text-red-700 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Exit Support Mode and Return to Super Admin"
          >
            <LogOut className="w-3.5 h-3.5 text-red-700" />
            <span>Exit & Return to Super Admin</span>
          </button>
        </div>
      )}

      <div className="flex-1 flex">
        {/* SIDEBAR (Desktop) */}
        <aside className={`hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-slate-200 fixed z-30 ${isImpersonating ? 'top-10 bottom-0' : 'inset-y-0'}`}>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 tracking-tight text-sm block leading-tight truncate">
                  {tenantName}
                </span>
                <span className={`text-[11px] font-medium flex items-center gap-1 mt-0.5 ${isImpersonating ? 'text-red-600 font-semibold' : 'text-emerald-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isImpersonating ? 'bg-red-600 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
                  {isImpersonating ? 'Support Mode (Audited)' : 'Active Workspace'}
                </span>
              </div>
            </div>
          </div>

          {/* Tenant Active Plan Status */}
          <div className="p-3 mx-3 my-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-950 truncate">
                  {subInfo?.planName || 'Active Workspace'}
                </p>
                <p className="text-[10px] font-semibold text-emerald-700">
                  {subInfo?.daysRemaining !== undefined ? `${subInfo.daysRemaining} days left` : 'Live SaaS'}
                </p>
              </div>
            </div>
            <Link
              href="/billing"
              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-white px-2 py-1 rounded shadow-2xs border border-emerald-200 shrink-0"
            >
              Manage
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? item.highlight
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'bg-slate-900 text-white shadow-xs'
                      : item.highlight
                      ? 'text-emerald-700 hover:bg-emerald-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.highlight
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer info */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{tenantName}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {isImpersonating ? 'Super Admin (Support)' : 'Business Owner'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                title="Log Out of Workspace"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 truncate">
                <span>Webin10 Business OS</span>
                <span>/</span>
                <span className="text-slate-900 font-bold truncate">{tenantName}</span>
                {isImpersonating && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                    Support Mode
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all border border-emerald-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Register New Business</span>
              </Link>

              {/* NOTE: Regular business owners have NO link/button to Super Admin here! Only pure business notifications & profile */}
              <div className="relative">
                <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 relative">
                  <Bell className="w-4 h-4" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
                </button>
              </div>

              <div className="h-5 w-px bg-slate-200"></div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                  {initials}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline truncate max-w-[120px]">
                  {tenantName}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-1 flex items-center gap-1.5 text-xs font-bold border border-slate-200/80 cursor-pointer"
                  title="Log out of Business Workspace"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 shadow-lg">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold ${
                    pathname === item.href
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Platform-Wide Announcement Banner (Broadcast from Super Admin) */}
          <AnnouncementBanner tenantId={tenantId} />

          {/* Page Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
