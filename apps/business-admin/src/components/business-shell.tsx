'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useActiveTenant } from '@/lib/tenant';

interface BusinessShellProps {
  children: React.ReactNode;
}

export function BusinessShell({ children }: BusinessShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { tenantId, tenantName, isImpersonating, exitImpersonation } = useActiveTenant();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Customers & CRM', href: '/customers', icon: Users, badge: '5' },
    {
      name: 'WhatsApp Hub',
      href: '/whatsapp',
      icon: MessageSquare,
      highlight: true,
      badge: 'Live Auto',
    },
    { name: 'Memberships & Plans', href: '/memberships', icon: CalendarCheck },
    { name: 'Billing & Invoices', href: '/billing', icon: CreditCard },
    { name: 'Business Settings', href: '/settings', icon: Settings },
  ];

  // Helper for 2-letter initials
  const initials = tenantName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'BZ';

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

          {/* Tenant Switcher & Quick Credits */}
          <div className="p-3 mx-3 my-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-emerald-950">WhatsApp Credits</p>
                <p className="text-xs font-bold text-emerald-700">₹500.00 balance</p>
              </div>
            </div>
            <Link
              href="/whatsapp"
              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-white px-2 py-1 rounded shadow-2xs border border-emerald-200"
            >
              Recharge
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
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{tenantName}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {isImpersonating ? 'Super Admin (Support)' : 'Business Owner'}
                </p>
              </div>
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
            </div>
          )}

          {/* Page Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
