'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { LogOut, ShieldCheck, User } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Platform Online
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 text-right p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          title="Manage Admin Profile & Credentials"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user?.name || 'Admin'} className="w-full h-full object-cover" />
            ) : user?.name ? (
              user.name.trim().slice(0, 2).toUpperCase()
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name || 'Super Admin'}</p>
            <p className="text-[10px] text-indigo-600 font-medium">{user?.role || 'PLATFORM_OWNER'}</p>
          </div>
        </Link>

        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
