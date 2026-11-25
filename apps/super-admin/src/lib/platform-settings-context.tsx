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

export type ColorMode = 'light' | 'dark' | 'system';

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  colorMode?: ColorMode;
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
  colorMode: 'light',
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
  colorMode: ColorMode;
  effectiveMode: 'light' | 'dark';
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
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
  colorMode: 'light',
  effectiveMode: 'light',
  setColorMode: () => {},
  toggleColorMode: () => {},
  updateSettings: () => {},
  updateTheme: () => {},
  refreshSettings: async () => {},
  isLoading: false,
});

export function PlatformSettingsProvider({ children }: { children: React.ReactNode }) {
  const [general, setGeneral] = useState<GeneralSettings>(DEFAULT_GENERAL);
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [colorMode, setColorModeState] = useState<ColorMode>('light');
  const [systemIsDark, setSystemIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load cached settings from localStorage after initial client mount to guarantee 100% hydration match
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const cachedGen = localStorage.getItem('webin10_general_settings');
      if (cachedGen) {
        setGeneral((prev) => ({ ...prev, ...JSON.parse(cachedGen) }));
      }
    } catch {}

    try {
      const cachedTheme = localStorage.getItem('webin10_theme_settings');
      if (cachedTheme) {
        const parsed = JSON.parse(cachedTheme);
        setTheme((prev) => ({ ...prev, ...parsed }));
        if (parsed.colorMode) {
          setColorModeState(parsed.colorMode);
        }
      }
    } catch {}

    try {
      const savedMode = localStorage.getItem('webin10_color_mode') as ColorMode;
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setColorModeState(savedMode);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const effectiveMode: 'light' | 'dark' =
    colorMode === 'system' ? (systemIsDark ? 'dark' : 'light') : colorMode;

  const applyClassMode = useCallback((mode: 'light' | 'dark') => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    if (mode === 'dark') {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
    }
  }, []);

  // Toggle .dark class on <html> document element and body
  useEffect(() => {
    applyClassMode(effectiveMode);
  }, [effectiveMode, applyClassMode]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('webin10_color_mode', mode);
      const isDark =
        mode === 'dark' ||
        (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      applyClassMode(isDark ? 'dark' : 'light');

      // Auto-sync to backend in background if admin token exists
      const token = localStorage.getItem('webin10_admin_token');
      if (token) {
        apiRequest('/super-admin/settings/theme', {
          method: 'PUT',
          body: JSON.stringify({ value: { colorMode: mode } }),
        }).catch(() => {});
      }
    }
    setTheme((prev) => {
      const next = { ...prev, colorMode: mode };
      if (typeof window !== 'undefined') {
        localStorage.setItem('webin10_theme_settings', JSON.stringify(next));
      }
      return next;
    });
  }, [applyClassMode]);

  const toggleColorMode = useCallback(() => {
    setColorMode(effectiveMode === 'dark' ? 'light' : 'dark');
  }, [effectiveMode, setColorMode]);

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
            if (mergedTheme.colorMode) {
              setColorModeState(mergedTheme.colorMode);
              localStorage.setItem('webin10_color_mode', mergedTheme.colorMode);
            }
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
          colorMode: b.colorMode || prev.colorMode,
        }));
        if (b.colorMode) {
          setColorModeState(b.colorMode);
          localStorage.setItem('webin10_color_mode', b.colorMode);
        }
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
    if (newTheme.colorMode) {
      setColorModeState(newTheme.colorMode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('webin10_color_mode', newTheme.colorMode);
      }
    }
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
        colorMode,
        effectiveMode,
        setColorMode,
        toggleColorMode,
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
