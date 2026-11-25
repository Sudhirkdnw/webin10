'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePlatformSettings } from '@/lib/platform-settings-context';
import { LogOut, ShieldCheck, User, Sun, Moon, Menu } from 'lucide-react';

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const { effectiveMode, toggleColorMode } = usePlatformSettings();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10 transition-colors duration-200">
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Open navigation menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Platform Online
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* 1-Click Color Mode Quick Switch */}
        <button
          type="button"
          onClick={toggleColorMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          title={effectiveMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {effectiveMode === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        <Link
          href="/profile"
          className="flex items-center gap-2.5 text-right p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Manage Admin Profile & Credentials"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user?.name || 'Admin'} className="w-full h-full object-cover" />
            ) : user?.name ? (
              user.name.trim().slice(0, 2).toUpperCase()
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">{user?.name || 'Super Admin'}</p>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">{user?.role || 'PLATFORM_OWNER'}</p>
          </div>
        </Link>

        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
