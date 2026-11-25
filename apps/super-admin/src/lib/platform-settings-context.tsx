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
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
}

const DEFAULT_GENERAL: GeneralSettings = {
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

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#00D09C',
  secondaryColor: '#0F172A',
  accentColor: '#F59E0B',
  logoUrl: '',
  faviconUrl: '',
};

interface PlatformSettingsContextType {
  appName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  currencySymbol: string;
  settings: GeneralSettings;
  theme: ThemeSettings;
  updateSettings: (newSettings: Partial<GeneralSettings>) => void;
  updateTheme: (newTheme: Partial<ThemeSettings>) => void;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
}

const PlatformSettingsContext = createContext<PlatformSettingsContextType>({
  appName: DEFAULT_GENERAL.appName,
  logoUrl: DEFAULT_THEME.logoUrl,
  faviconUrl: DEFAULT_THEME.faviconUrl,
  primaryColor: DEFAULT_THEME.primaryColor,
  secondaryColor: DEFAULT_THEME.secondaryColor,
  accentColor: DEFAULT_THEME.accentColor,
  currencySymbol: '₹',
  settings: DEFAULT_GENERAL,
  theme: DEFAULT_THEME,
  updateSettings: () => {},
  updateTheme: () => {},
  refreshSettings: async () => {},
  isLoading: false,
});

export function PlatformSettingsProvider({ children }: { children: React.ReactNode }) {
  const [general, setGeneral] = useState<GeneralSettings>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('webin10_general_settings');
      if (cached) {
        try {
          return { ...DEFAULT_GENERAL, ...JSON.parse(cached) };
        } catch {}
      }
    }
    return DEFAULT_GENERAL;
  });

  const [theme, setTheme] = useState<ThemeSettings>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('webin10_theme_settings');
      if (cached) {
        try {
          return { ...DEFAULT_THEME, ...JSON.parse(cached) };
        } catch {}
      }
    }
    return DEFAULT_THEME;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Apply dynamic CSS variables and Favicon to document root
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Dynamic document Title
    if (general.appName) {
      document.title = `${general.appName} | Super Admin Control Panel`;
    }

    // 2. Inject CSS Theme Colors
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', theme.primaryColor || '#00D09C');
    root.style.setProperty('--brand-secondary', theme.secondaryColor || '#0F172A');
    root.style.setProperty('--brand-accent', theme.accentColor || '#F59E0B');

    // 3. Dynamic Favicon injection
    if (theme.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = theme.faviconUrl;
    }
  }, [general.appName, theme.primaryColor, theme.secondaryColor, theme.accentColor, theme.faviconUrl]);

  // Fetch latest settings from backend
  const refreshSettings = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('webin10_admin_token') : null;

    setIsLoading(true);
    try {
      if (token) {
        const res = await apiRequest<Record<string, any>>('/super-admin/settings');
        if (res.success && res.data) {
          if (res.data.general?.value) {
            const mergedGen = { ...DEFAULT_GENERAL, ...res.data.general.value };
            setGeneral(mergedGen);
            localStorage.setItem('webin10_general_settings', JSON.stringify(mergedGen));
          }
          if (res.data.theme?.value) {
            const mergedTheme = { ...DEFAULT_THEME, ...res.data.theme.value };
            setTheme(mergedTheme);
            localStorage.setItem('webin10_theme_settings', JSON.stringify(mergedTheme));
          }
          return;
        }
      }

      // Unauthenticated fallback (e.g. login screen or initial load)
      const pubRes = await apiRequest<any>('/public/branding');
      if (pubRes.success && pubRes.data) {
        const b = pubRes.data;
        if (b.appName) {
          setGeneral((prev) => ({ ...prev, appName: b.appName }));
        }
        setTheme((prev) => ({
          ...prev,
          logoUrl: b.logoUrl || prev.logoUrl,
          faviconUrl: b.faviconUrl || prev.faviconUrl,
          primaryColor: b.primaryColor || prev.primaryColor,
          secondaryColor: b.secondaryColor || prev.secondaryColor,
          accentColor: b.accentColor || prev.accentColor,
        }));
      }
    } catch {
      // Fail gracefully
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback((newGen: Partial<GeneralSettings>) => {
    setGeneral((prev) => {
      const next = { ...prev, ...newGen };
      if (typeof window !== 'undefined') {
        localStorage.setItem('webin10_general_settings', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const updateTheme = useCallback((newTheme: Partial<ThemeSettings>) => {
    setTheme((prev) => {
      const next = { ...prev, ...newTheme };
      if (typeof window !== 'undefined') {
        localStorage.setItem('webin10_theme_settings', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const currencySymbol = (general.defaultCurrencyFormat || '₹').split(' - ')[0].trim();

  return (
    <PlatformSettingsContext.Provider
      value={{
        appName: general.appName || 'Webin10',
        logoUrl: theme.logoUrl || '',
        faviconUrl: theme.faviconUrl || '',
        primaryColor: theme.primaryColor || '#00D09C',
        secondaryColor: theme.secondaryColor || '#0F172A',
        accentColor: theme.accentColor || '#F59E0B',
        currencySymbol,
        settings: general,
        theme,
        updateSettings,
        updateTheme,
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
