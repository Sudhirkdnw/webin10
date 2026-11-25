'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useAuth } from '@/lib/auth-context';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { isLoading, token } = useAuth();

  if (isLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Authenticating Super Admin session...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        <main className="p-8 flex-1 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">{children}</main>
      </div>
    </div>
  );
}
