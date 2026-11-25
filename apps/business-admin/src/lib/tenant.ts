'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSuperAdminUrl } from './api';

export const DEFAULT_TENANT_ID = '1ccc2ab5-30fa-40a4-abc6-557bc6495b8a';
export const DEFAULT_TENANT_NAME = 'FitZone Club';

const STORAGE_KEY_TENANT_ID = 'webin10_impersonate_tenant_id';
const STORAGE_KEY_TENANT_NAME = 'webin10_impersonate_tenant_name';

export interface ActiveTenantInfo {
  tenantId: string;
  tenantName: string;
  isImpersonating: boolean;
  isReady: boolean;
  exitImpersonation: () => void;
}

export function useActiveTenant(): ActiveTenantInfo {
  const [tenantId, setTenantId] = useState<string>(DEFAULT_TENANT_ID);
  const [tenantName, setTenantName] = useState<string>(DEFAULT_TENANT_NAME);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlTenantId = params.get('impersonate_tenant');
      const urlTenantName = params.get('impersonate_name');

      if (urlTenantId) {
        const decodedName = urlTenantName ? decodeURIComponent(urlTenantName) : 'Business Workspace';
        localStorage.setItem(STORAGE_KEY_TENANT_ID, urlTenantId);
        localStorage.setItem(STORAGE_KEY_TENANT_NAME, decodedName);
        setTenantId(urlTenantId);
        setTenantName(decodedName);
        setIsImpersonating(true);

        // Clean up URL query parameters without triggering a re-render/reload
        params.delete('impersonate_tenant');
        params.delete('impersonate_name');
        const remainingQuery = params.toString();
        const newUrl = window.location.pathname + (remainingQuery ? `?${remainingQuery}` : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      } else {
        const storedId = localStorage.getItem(STORAGE_KEY_TENANT_ID);
        const storedName = localStorage.getItem(STORAGE_KEY_TENANT_NAME);

        if (storedId) {
          setTenantId(storedId);
          setTenantName(storedName || 'Impersonated Workspace');
          setIsImpersonating(true);
        } else {
          setTenantId(DEFAULT_TENANT_ID);
          setTenantName(DEFAULT_TENANT_NAME);
          setIsImpersonating(false);
        }
      }
    } catch (err) {
      console.warn('Failed to parse active tenant from URL/storage:', err);
    } finally {
      setIsReady(true);
    }
  }, []);

  const exitImpersonation = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_TENANT_ID);
      localStorage.removeItem(STORAGE_KEY_TENANT_NAME);
    } catch (e) {
      // ignore storage access errors
    }
    const adminUrl = getSuperAdminUrl();
    window.location.href = `${adminUrl}/tenants`;
  }, []);

  return {
    tenantId,
    tenantName,
    isImpersonating,
    isReady,
    exitImpersonation,
  };
}
