'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  Boxes,
  Flag,
  CreditCard,
  Sliders,
  Network,
  ShieldAlert,
  Users2,
  LifeBuoy,
  UserCheck,
  Mail,
  Settings,
  MessageSquare,
  Receipt,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Businesses (Tenants)', href: '/tenants', icon: Building2 },
  { name: 'Categories (Verticals)', href: '/categories', icon: FolderTree },
  { name: 'Platform Modules', href: '/modules', icon: Boxes },
  { name: 'Feature Flags', href: '/features', icon: Flag },
  { name: 'Subscription Plans', href: '/plans', icon: CreditCard },
  { name: 'Revenue & Billing Hub', href: '/billing', icon: Receipt },
  { name: 'WhatsApp & Messaging', href: '/whatsapp-management', icon: MessageSquare },
  { name: 'Dynamic Config', href: '/configurations', icon: Sliders },
  { name: 'Email Templates', href: '/email-templates', icon: Mail },
  { name: 'System Settings', href: '/settings', icon: Settings },
  { name: 'Support Sessions', href: '/support', icon: LifeBuoy },
  { name: 'Platform Team', href: '/admins', icon: Users2 },
  { name: 'Admin Profile', href: '/profile', icon: UserCheck },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
            W
          </div>
          <div>
            <h1 className="font-bold text-white leading-none">Webin10</h1>
            <span className="text-[10px] tracking-wider text-indigo-400 font-semibold uppercase">Super Admin</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <p>Webin10 SaaS Platform v1.0</p>
        <p className="text-[10px] text-slate-600">Production Baseline</p>
      </div>
    </aside>
  );
}
