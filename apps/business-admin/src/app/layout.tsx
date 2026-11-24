import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Webin10 Business OS — Smart Operating System for Modern Businesses',
  description: 'Manage customers, memberships, QR attendance, automated WhatsApp marketing and billing in one unified workspace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
