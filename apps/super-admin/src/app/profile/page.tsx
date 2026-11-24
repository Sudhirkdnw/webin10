'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ImageUploader } from '@/components/image-uploader';
import {
  User,
  ShieldCheck,
  Lock,
  Laptop,
  Check,
  AlertCircle,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser, login } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Form
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      apiRequest('/auth/super-admin/me'),
      apiRequest('/auth/super-admin/sessions'),
    ]);

    if (pRes.success) {
      setProfile(pRes.data);
      setName(pRes.data.name);
      setAvatarUrl(pRes.data.avatarUrl || '');
    }
    if (sRes.success) {
      setSessions(sRes.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    setNameSuccess(false);

    const res = await apiRequest('/auth/super-admin/me', {
      method: 'PATCH',
      body: JSON.stringify({ name, avatarUrl }),
    });

    if (res.success) {
      setNameSuccess(true);
      if (authUser) {
        const token = localStorage.getItem('webin10_admin_token') || '';
        login(token, { ...authUser, name: res.data.name });
      }
      setTimeout(() => setNameSuccess(false), 3000);
    } else {
      alert(res.error || 'Failed to update profile');
    }
    setSavingName(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setSavingPassword(true);
    const res = await apiRequest('/auth/super-admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (res.success) {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
      fetchProfile();
    } else {
      setPasswordError(res.error || 'Failed to change password');
    }
    setSavingPassword(false);
  };

  const handleRevokeSession = async (sessionId: string) => {
    const res = await apiRequest(`/auth/super-admin/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      fetchProfile();
    } else {
      alert(res.error || 'Failed to revoke session');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Profile & Security</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal credentials, password, platform authority role, and active device sessions
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 overflow-hidden flex items-center justify-center text-indigo-700 text-2xl font-bold shrink-0">
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarUrl} alt={profile?.name} className="w-full h-full object-cover" />
              ) : profile?.name ? (
                profile.name.slice(0, 2).toUpperCase()
              ) : (
                'SA'
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">{profile?.name || 'Super Admin'}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {profile?.role || 'PLATFORM_OWNER'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{profile?.email}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Account registered: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateName} className="space-y-4 pt-4 border-t border-slate-100 max-w-md">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <ImageUploader
                label="Profile Photo (Cloudinary)"
                value={avatarUrl}
                onChange={setAvatarUrl}
                folder="profiles"
                aspect="circle"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingName}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {savingName ? 'Saving...' : 'Save Profile Changes'}
              </button>
              {nameSuccess && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Updated successfully!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Change Password</h2>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Changing password will automatically invalidate all other remote login sessions
          </p>

          {passwordError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Password updated successfully! Other sessions have been revoked.</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">New Password (min 8 characters)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {savingPassword ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>

        {/* Active Sessions Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Laptop className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Active Login Sessions</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            List of devices currently authenticated with your administrator account
          </p>

          <div className="divide-y divide-slate-100">
            {sessions.map((s, idx) => (
              <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {idx === 0 ? 'Current Active Session' : 'Device Session'}
                    </span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        This Device
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">
                    {s.userAgent || 'Web Browser'} • IP: {s.ipAddress || 'localhost'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Logged in: {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>

                {idx !== 0 && (
                  <button
                    onClick={() => handleRevokeSession(s.id)}
                    className="px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
