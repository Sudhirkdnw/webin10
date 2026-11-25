'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlatformSettings } from '@/lib/platform-settings-context';
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  Boxes,
  Flag,
  CreditCard,
  Sliders,
  ShieldAlert,
  Users2,
  LifeBuoy,
  UserCheck,
  Mail,
  Settings,
  MessageSquare,
  Receipt,
  Activity,
  Megaphone,
  Ticket,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Businesses (Tenants)', href: '/tenants', icon: Building2 },
  { name: 'Categories (Verticals)', href: '/categories', icon: FolderTree },
  { name: 'Platform Modules', href: '/modules', icon: Boxes },
  { name: 'Feature Flags', href: '/features', icon: Flag },
  { name: 'Subscription Plans', href: '/plans', icon: CreditCard },
  { name: 'Revenue & Billing Hub', href: '/billing', icon: Receipt },
  { name: 'Coupons & Vouchers', href: '/coupons', icon: Ticket },
  { name: 'Announcements & Banners', href: '/announcements', icon: Megaphone },
  { name: 'System Telemetry & Health', href: '/system-telemetry', icon: Activity },
  { name: 'WhatsApp & Messaging', href: '/whatsapp-management', icon: MessageSquare },
  { name: 'Dynamic Config', href: '/configurations', icon: Sliders },
  { name: 'Email Hub & Broadcasts', href: '/email', icon: Mail },
  { name: 'System Settings', href: '/settings', icon: Settings },
  { name: 'Support Sessions', href: '/support', icon: LifeBuoy },
  { name: 'Platform Team', href: '/admins', icon: Users2 },
  { name: 'Admin Profile', href: '/profile', icon: UserCheck },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert },
];

interface SidebarProps {
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpenOnMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { appName, logoUrl, primaryColor } = usePlatformSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const brandInitial = appName ? appName.trim().charAt(0).toUpperCase() : 'W';

  const renderContent = (isMobile = false) => (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden" suppressHydrationWarning>
          {mounted && logoUrl ? (
            <img
              src={logoUrl}
              alt={appName || 'Platform Logo'}
              className="w-8 h-8 max-h-8 max-w-[36px] object-contain rounded-md shrink-0 shadow-xs"
            />
          ) : (
            <div
              style={{ backgroundColor: primaryColor || '#00D09C' }}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-md text-sm shrink-0 transition-colors"
            >
              {brandInitial}
            </div>
          )}
          <div className="overflow-hidden min-w-0">
            <h1 className="font-bold text-slate-900 dark:text-white leading-none truncate max-w-[145px]">{appName || 'Webin10'}</h1>
            <span className="text-[10px] tracking-wider text-slate-500 dark:text-slate-400 font-semibold uppercase block mt-1">Super Admin</span>
          </div>
        </div>

        {isMobile && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (isMobile && onCloseMobile) {
                  onCloseMobile();
                }
              }}
              style={
                isActive
                  ? { backgroundColor: primaryColor || '#00D09C', color: '#ffffff' }
                  : {}
              }
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <p className="font-medium text-slate-700 dark:text-slate-300">{appName || 'Webin10'} SaaS Platform v1.0</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">Enterprise Control Center</p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 transition-colors duration-200">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenOnMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col shrink-0 shadow-2xl z-10 transition-transform duration-200">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
