'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from './api';

export interface ModuleItem {
  id: string;
  key: string;
  name: string;
  description: string;
  dependencies?: string[];
  isEnabled: boolean;
  isDefault: boolean;
  isMandatory?: boolean;
  isLocked?: boolean;
}

export interface TenantModulesData {
  tenantId: string;
  categorySlug: string;
  categoryName: string;
  activeKeys: string[];
  modules: ModuleItem[];
  crmLabel: string;
  customerSingular: string;
}

export function useTenantModules(tenantId: string | null) {
  const [data, setData] = useState<TenantModulesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const API_BASE = getApiBaseUrl();
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/modules`);
      const json = await res.json();
      const payload = json.data || json;

      if (json.success || payload.activeKeys) {
        const catSlug = payload.categorySlug || 'gym';
        let crmLabel = 'Customers & CRM';
        let customerSingular = 'Customer';

        if (catSlug === 'coaching' || catSlug === 'tuition') {
          crmLabel = 'Students & Parents';
          customerSingular = 'Student';
        } else if (catSlug === 'gym') {
          crmLabel = 'Members & Passes';
          customerSingular = 'Member';
        } else if (catSlug === 'pharmacy') {
          crmLabel = 'Patients & Customers';
          customerSingular = 'Patient';
        } else if (catSlug === 'salon') {
          crmLabel = 'Clients & Guests';
          customerSingular = 'Client';
        } else if (catSlug === 'dance-academy') {
          crmLabel = 'Students & Performers';
          customerSingular = 'Student';
        } else if (catSlug === 'retail') {
          crmLabel = 'Customers & Khata';
          customerSingular = 'Customer';
        }

        setData({
          ...payload,
          crmLabel,
          customerSingular,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tenant modules');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const toggleModule = async (moduleKey: string, isEnabled: boolean) => {
    if (!tenantId) return false;

    try {
      const API_BASE = getApiBaseUrl();
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/modules/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleKey, isEnabled }),
      });

      const json = await res.json();
      if (json.success || json.data?.success) {
        await fetchModules();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error toggling module:', err);
      return false;
    }
  };

  return {
    ...data,
    loading,
    error,
    refetch: fetchModules,
    toggleModule,
    isModuleActive: (key: string) => Boolean(data?.activeKeys?.includes(key)),
  };
}
