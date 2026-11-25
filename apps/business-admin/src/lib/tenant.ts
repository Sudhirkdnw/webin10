'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSuperAdminUrl, getApiBaseUrl } from './api';

const STORAGE_KEY_TENANT_ID = 'webin10_active_tenant_id';
const STORAGE_KEY_TENANT_NAME = 'webin10_active_tenant_name';
const STORAGE_KEY_IS_SUPPORT_MODE = 'webin10_is_support_mode';

export interface ActiveTenantInfo {
  tenantId: string;
  tenantName: string;
  isImpersonating: boolean;
  isReady: boolean;
  exitImpersonation: () => void;
}

export function useActiveTenant(): ActiveTenantInfo {
  const [tenantId, setTenantId] = useState<string>('');
  const [tenantName, setTenantName] = useState<string>('');
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlTenantId = params.get('impersonate_tenant');
      const urlTenantName = params.get('impersonate_name');

      if (urlTenantId) {
        // Super Admin entered Support / Impersonation Mode
        const decodedName = urlTenantName ? decodeURIComponent(urlTenantName) : 'Business Workspace';
        localStorage.setItem(STORAGE_KEY_TENANT_ID, urlTenantId);
        localStorage.setItem(STORAGE_KEY_TENANT_NAME, decodedName);
        localStorage.setItem(STORAGE_KEY_IS_SUPPORT_MODE, 'true');
        setTenantId(urlTenantId);
        setTenantName(decodedName);
        setIsImpersonating(true);
        setIsReady(true);

        // Clean up URL query parameters without triggering a re-render/reload
        params.delete('impersonate_tenant');
        params.delete('impersonate_name');
        const remainingQuery = params.toString();
        const newUrl = window.location.pathname + (remainingQuery ? `?${remainingQuery}` : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      } else {
        const storedId =
          localStorage.getItem(STORAGE_KEY_TENANT_ID) ||
          localStorage.getItem('webin10_impersonate_tenant_id');
        const storedName =
          localStorage.getItem(STORAGE_KEY_TENANT_NAME) ||
          localStorage.getItem('webin10_impersonate_tenant_name');
        const isSupport = localStorage.getItem(STORAGE_KEY_IS_SUPPORT_MODE) === 'true';

        if (storedId) {
          // Validate with backend whether this tenant actually exists (has not been deleted)
          const API_BASE = getApiBaseUrl();
          fetch(`${API_BASE}/tenants/${storedId}/profile`)
            .then((r) => r.json())
            .then((res) => {
              if (res.success && res.data) {
                setTenantId(storedId);
                setTenantName(res.data.name || storedName || 'Business Workspace');
                // ONLY true if specifically initiated from Super Admin Support Mode!
                setIsImpersonating(isSupport);
              } else {
                // Tenant does not exist in DB (was deleted by Super Admin)!
                console.warn(`Tenant '${storedId}' not found in database. Clearing stale storage.`);
                localStorage.removeItem(STORAGE_KEY_TENANT_ID);
                localStorage.removeItem(STORAGE_KEY_TENANT_NAME);
                localStorage.removeItem(STORAGE_KEY_IS_SUPPORT_MODE);
                localStorage.removeItem('webin10_impersonate_tenant_id');
                localStorage.removeItem('webin10_impersonate_tenant_name');
                setTenantId('');
                setTenantName('');
                setIsImpersonating(false);
              }
            })
            .catch(() => {
              // Network fallback
              setTenantId(storedId);
              setTenantName(storedName || '');
              setIsImpersonating(isSupport);
            })
            .finally(() => {
              setIsReady(true);
            });
          return;
        } else {
          setTenantId('');
          setTenantName('');
          setIsImpersonating(false);
          setIsReady(true);
        }
      }
    } catch (err) {
      console.warn('Failed to parse active tenant from URL/storage:', err);
      setIsReady(true);
    }
  }, []);

  const exitImpersonation = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_TENANT_ID);
      localStorage.removeItem(STORAGE_KEY_TENANT_NAME);
      localStorage.removeItem(STORAGE_KEY_IS_SUPPORT_MODE);
      localStorage.removeItem('webin10_impersonate_tenant_id');
      localStorage.removeItem('webin10_impersonate_tenant_name');
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
