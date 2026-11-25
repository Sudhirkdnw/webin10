'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from './api';

export interface GeneralSettings {
  appName: string;
  email: string;
  phone: string;
  planExpireNotificationDays: number;
  address: string;
  defaultLanguage: string;
  userDefaultLanguage: string;
  dateTimeFormat: string;
  defaultCountryCode: string;
  defaultCurrencyFormat: string;
  timezone: string;
  appLogo?: string;
}

const DEFAULT_SETTINGS: GeneralSettings = {
  appName: 'Webin10',
  email: 'webin10.in@gmail.com',
  phone: '+91 7070799200',
  planExpireNotificationDays: 5,
  address: 'Narkatiaganj, West Champaran, Bihar, 845455',
  defaultLanguage: 'English',
  userDefaultLanguage: 'English',
  dateTimeFormat: 'Day Month, Year',
  defaultCountryCode: 'in',
  defaultCurrencyFormat: '₹ - INR Indian Rupee',
  timezone: 'Asia/Kolkata',
};

interface PlatformSettingsContextType {
  settings: GeneralSettings;
  appName: string;
  currencySymbol: string;
  updateSettings: (newSettings: Partial<GeneralSettings>) => void;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
}

const PlatformSettingsContext = createContext<PlatformSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  appName: DEFAULT_SETTINGS.appName,
  currencySymbol: '₹',
  updateSettings: () => {},
  refreshSettings: async () => {},
  isLoading: false,
});

export function PlatformSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GeneralSettings>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('webin10_general_settings');
      if (cached) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
        } catch {
          // Fallback to default
        }
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('webin10_admin_token') : null;
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await apiRequest<any>('/super-admin/settings/general');
      if (res.success && res.data?.value) {
        const merged = { ...DEFAULT_SETTINGS, ...res.data.value };
        setSettings(merged);
        localStorage.setItem('webin10_general_settings', JSON.stringify(merged));
      }
    } catch (e) {
      // Fail silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback((newSettings: Partial<GeneralSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('webin10_general_settings', JSON.stringify(next));
        if (next.appName) {
          document.title = `${next.appName} | Super Admin Control Panel`;
        }
      }
      return next;
    });
  }, []);

  const currencySymbol = (settings.defaultCurrencyFormat || '₹').split(' - ')[0].trim();

  return (
    <PlatformSettingsContext.Provider
      value={{
        settings,
        appName: settings.appName || 'Webin10',
        currencySymbol,
        updateSettings,
        refreshSettings,
        isLoading,
      }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  return useContext(PlatformSettingsContext);
}
