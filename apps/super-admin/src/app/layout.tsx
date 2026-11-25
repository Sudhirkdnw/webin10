import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { PlatformSettingsProvider } from '@/lib/platform-settings-context';

export const metadata: Metadata = {
  title: 'Webin10 | Super Admin Control Panel',
  description: 'Enterprise Central Management System for Webin10 Business OS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen transition-colors duration-200">
        <AuthProvider>
          <PlatformSettingsProvider>
            {children}
          </PlatformSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
