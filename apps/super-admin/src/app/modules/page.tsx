'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/lib/api';
import {
  Layers,
  Power,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  Save,
  Lock,
  Sliders,
  Sparkles,
  Building2,
  Info
} from 'lucide-react';

interface PlatformModule {
  id: string;
  name: string;
  key: string;
  description: string | null;
  isActive: boolean;
  version: string;
  category: string;
  dependencies: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface CategoryMatrixItem {
  moduleId: string;
  moduleKey: string;
  name: string;
  description: string | null;
  isActive: boolean;
  dependencies: string[];
  isAvailable: boolean;
  isDefault: boolean;
  isMandatory: boolean;
}

export default function ModulesPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'global'>('matrix');

  // Global Kill-Switch State
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [impactModal, setImpactModal] = useState<{
    module: PlatformModule;
    affectedTenantsCount: number;
    targetStatus: boolean;
  } | null>(null);

  // Category Matrix State
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [matrixData, setMatrixData] = useState<CategoryMatrixItem[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'mandatory' | 'default' | 'available' | 'unavailable'>('all');
  const [dirty, setDirty] = useState(false);

  // Common UI State
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchGlobalModules();
    fetchCategories();
  }, []);

  // Fetch matrix whenever selected category changes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchCategoryMatrix(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const fetchGlobalModules = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<PlatformModule[]>('/super-admin/modules');
      if (res.success) {
        setModules(res.data || []);
      } else {
        setErrorMsg(res.error || 'Failed to load global modules');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load global modules');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiRequest<Category[]>('/super-admin/categories');
      if (res.success) {
        const cats = res.data || [];
        setCategories(cats);
        if (cats.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(cats[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchCategoryMatrix = async (categoryId: string) => {
    try {
      setMatrixLoading(true);
      setDirty(false);
      const res = await apiRequest<{ category: Category; matrix: CategoryMatrixItem[] }>(
        `/super-admin/categories/${categoryId}/matrix`
      );
      if (res.success && res.data) {
        setMatrixData(res.data.matrix || []);
      } else {
        setErrorMsg(res.error || 'Failed to load matrix for selected category');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Network error loading matrix');
    } finally {
      setMatrixLoading(false);
    }
  };

  // Matrix manipulation handlers
  const handleToggleAvailable = (moduleKey: string) => {
    setMatrixData(prev =>
      prev.map(item => {
        if (item.moduleKey === moduleKey) {
          const nextAvailable = !item.isAvailable;
          return {
            ...item,
            isAvailable: nextAvailable,
            // If turning unavailable, must also turn off default & mandatory
            isDefault: nextAvailable ? item.isDefault : false,
            isMandatory: nextAvailable ? item.isMandatory : false,
          };
        }
        return item;
      })
    );
    setDirty(true);
  };

  const handleToggleDefault = (moduleKey: string) => {
    setMatrixData(prev =>
      prev.map(item => {
        if (item.moduleKey === moduleKey) {
          const nextDefault = !item.isDefault;
          return {
            ...item,
            isDefault: nextDefault,
            // If making default, must be available
            isAvailable: nextDefault ? true : item.isAvailable,
            // If unchecking default while mandatory was true, mandatory must also uncheck
            isMandatory: nextDefault ? item.isMandatory : false,
          };
        }
        return item;
      })
    );
    setDirty(true);
  };

  const handleToggleMandatory = (moduleKey: string) => {
    setMatrixData(prev =>
      prev.map(item => {
        if (item.moduleKey === moduleKey) {
          const nextMandatory = !item.isMandatory;
          return {
            ...item,
            isMandatory: nextMandatory,
            // If making mandatory, it MUST be available and default
            isAvailable: nextMandatory ? true : item.isAvailable,
            isDefault: nextMandatory ? true : item.isDefault,
          };
        }
        return item;
      })
    );
    setDirty(true);
  };

  const handleSaveMatrix = async () => {
    if (!selectedCategoryId) return;
    try {
      setSavingMatrix(true);
      setErrorMsg(null);
      const res = await apiRequest(`/super-admin/categories/${selectedCategoryId}/matrix`, {
        method: 'PUT',
        body: JSON.stringify({
          configs: matrixData.map(m => ({
            moduleId: m.moduleId,
            moduleKey: m.moduleKey,
            isAvailable: m.isAvailable,
            isDefault: m.isDefault,
            isMandatory: m.isMandatory,
          })),
        }),
      });

      if (res.success) {
        setDirty(false);
        const selCatName = categories.find(c => c.id === selectedCategoryId)?.name || 'Category';
        setActionSuccess(`Category rules for "${selCatName}" saved successfully!`);
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to save category matrix');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error saving category matrix');
    } finally {
      setSavingMatrix(false);
    }
  };

  // Global Kill-Switch Handlers
  const handleToggleGlobalModule = async (mod: PlatformModule) => {
    try {
      setTogglingId(mod.id);
      setErrorMsg(null);

      if (mod.isActive) {
        const res = await apiRequest<{ activeTenantsCount: number }>(`/super-admin/modules/${mod.id}/impact`);
        setImpactModal({
          module: mod,
          affectedTenantsCount: res.data?.activeTenantsCount || 0,
          targetStatus: false,
        });
        setTogglingId(null);
        return;
      }

      await executeGlobalStatusChange(mod.id, true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate status change');
      setTogglingId(null);
    }
  };

  const executeGlobalStatusChange = async (moduleId: string, newStatus: boolean) => {
    try {
      const res = await apiRequest(`/super-admin/modules/${moduleId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update module status');
      }

      setModules(prev =>
        prev.map(m => (m.id === moduleId ? { ...m, isActive: newStatus } : m))
      );
      setActionSuccess(`Module ${newStatus ? 'Activated' : 'Force-Deactivated globally'}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setTogglingId(null);
      setImpactModal(null);
    }
  };

  // Filtered Matrix List
  const filteredMatrix = useMemo(() => {
    return matrixData.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        item.moduleKey.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(matrixSearch.toLowerCase()));

      if (!matchesSearch) return false;

      if (matrixFilter === 'mandatory') return item.isMandatory;
      if (matrixFilter === 'default') return item.isDefault && !item.isMandatory;
      if (matrixFilter === 'available') return item.isAvailable;
      if (matrixFilter === 'unavailable') return !item.isAvailable;
      return true;
    });
  }, [matrixData, matrixSearch, matrixFilter]);

  // Matrix Stats Counters
  const matrixStats = useMemo(() => {
    let mandatory = 0;
    let defaultOnly = 0;
    let optionalAvailable = 0;
    let unavailable = 0;

    matrixData.forEach(item => {
      if (!item.isAvailable) {
        unavailable++;
      } else if (item.isMandatory) {
        mandatory++;
      } else if (item.isDefault) {
        defaultOnly++;
      } else {
        optionalAvailable++;
      }
    });

    return { mandatory, defaultOnly, optionalAvailable, unavailable, total: matrixData.length };
  }, [matrixData]);

  // Selected Category Info
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Platform Modules Control</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Webin10 Engine
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Configure vertical business category rules, defaults, and platform-wide emergency kill-switches.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Category Matrix Editor
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'global'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Power className="w-4 h-4" />
            Global Master Kill-Switch
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CATEGORY MATRIX EDITOR */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Vertical / Category Selector Bar */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-semibold text-white">Select Business Vertical / Category</h2>
              </div>
              {dirty && (
                <div className="flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Unsaved changes in this vertical
                </div>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (dirty && !confirm('You have unsaved changes in this category. Discard and switch?')) {
                        return;
                      }
                      setSelectedCategoryId(cat.id);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400/40'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-black/25 font-mono text-slate-200">
                      {cat.slug}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Stats Summary & Action Bar */}
          {selectedCategory && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-400 font-medium">Mandatory (Locked)</div>
                <div className="text-2xl font-bold text-rose-400 mt-1 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  {matrixStats.mandatory}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Tenant cannot turn off</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-400 font-medium">Default Auto-ON</div>
                <div className="text-2xl font-bold text-indigo-400 mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {matrixStats.defaultOnly}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Pre-activated on register</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-400 font-medium">Optional Available</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {matrixStats.optionalAvailable}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Self-serve in Store</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-400 font-medium">Excluded / Unavailable</div>
                <div className="text-2xl font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  {matrixStats.unavailable}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Hidden from this vertical</div>
              </div>

              <div className="col-span-2 sm:col-span-4 md:col-span-1 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="text-xs text-indigo-300 font-medium">Total Catalogue</div>
                  <div className="text-2xl font-bold text-white mt-1">{matrixStats.total} Modules</div>
                </div>
                <button
                  onClick={handleSaveMatrix}
                  disabled={savingMatrix || !dirty}
                  className={`mt-2 w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    dirty
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/40'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingMatrix ? 'Saving...' : dirty ? 'Save Matrix Changes' : 'Saved'}
                </button>
              </div>
            </div>
          )}

          {/* Search, Filter & Save Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search modules..."
                value={matrixSearch}
                onChange={e => setMatrixSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-400 font-medium">Filter:</span>
              {(['all', 'mandatory', 'default', 'available', 'unavailable'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setMatrixFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    matrixFilter === tab
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveMatrix}
              disabled={savingMatrix || !dirty}
              className={`w-full sm:w-auto px-5 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                dirty
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <Save className="w-4 h-4" />
              {savingMatrix ? 'Saving Changes...' : 'Save Matrix Configuration'}
            </button>
          </div>

          {/* Matrix Table */}
          {matrixLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 bg-slate-900/30 rounded-2xl border border-slate-800">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400">Loading category configuration...</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-4">Master Module</th>
                      <th className="py-3.5 px-4 text-center">Global State</th>
                      <th className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span>Available in Category</span>
                          <span className="text-[10px] text-slate-400 normal-case font-normal">Offered to tenant</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span>Default Auto-ON</span>
                          <span className="text-[10px] text-slate-400 normal-case font-normal">Enabled on signup</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-rose-300">Mandatory Core [🔒]</span>
                          <span className="text-[10px] text-slate-400 normal-case font-normal">Tenant cannot disable</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-right">Resulting Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {filteredMatrix.map(m => {
                      const isGloballyDisabled = !m.isActive;

                      return (
                        <tr
                          key={m.moduleId}
                          className={`hover:bg-slate-800/30 transition-colors ${
                            !m.isAvailable ? 'opacity-60 bg-slate-950/20' : ''
                          }`}
                        >
                          {/* Module info */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white flex items-center gap-2">
                              {m.name}
                              <code className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                                {m.moduleKey}
                              </code>
                            </div>
                            {m.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{m.description}</p>
                            )}
                            {m.dependencies && m.dependencies.length > 0 && (
                              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                                <Info className="w-3 h-3 text-amber-400/80" />
                                <span>Depends on: {m.dependencies.join(', ')}</span>
                              </div>
                            )}
                          </td>

                          {/* Global Kill-Switch status */}
                          <td className="py-3.5 px-4 text-center">
                            {m.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                Kill-Switched
                              </span>
                            )}
                          </td>

                          {/* Available Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleAvailable(m.moduleKey)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                m.isAvailable ? 'bg-emerald-600' : 'bg-slate-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  m.isAvailable ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Default Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              disabled={!m.isAvailable}
                              onClick={() => handleToggleDefault(m.moduleKey)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                !m.isAvailable
                                  ? 'bg-slate-800 opacity-40 cursor-not-allowed'
                                  : m.isDefault
                                  ? 'bg-indigo-600'
                                  : 'bg-slate-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  m.isDefault ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Mandatory Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              disabled={!m.isAvailable}
                              onClick={() => handleToggleMandatory(m.moduleKey)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                !m.isAvailable
                                  ? 'bg-slate-800 opacity-40 cursor-not-allowed'
                                  : m.isMandatory
                                  ? 'bg-rose-600'
                                  : 'bg-slate-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  m.isMandatory ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Resulting Rule Pill */}
                          <td className="py-3.5 px-4 text-right">
                            {isGloballyDisabled ? (
                              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                ⛔ Blocked (Platform Off)
                              </span>
                            ) : !m.isAvailable ? (
                              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                Excluded from {selectedCategory?.name || 'Category'}
                              </span>
                            ) : m.isMandatory ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                <Lock className="w-3 h-3 text-rose-400" />
                                Mandatory Core
                              </span>
                            ) : m.isDefault ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                Default Auto-ON
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Optional Available
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GLOBAL MASTER KILL-SWITCH */}
      {/* ========================================================================= */}
      {activeTab === 'global' && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-sm text-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Global Master Kill-Switch Precedence Warning</p>
              <p className="text-xs text-amber-400/90 mt-0.5">
                Disabling a module here instantly disables it platform-wide across all tenants and categories.
                Even if a module is marked "Mandatory" in a category, the global kill-switch overrides and deactivates it immediately.
              </p>
            </div>
          </div>

          {/* Module Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            {(['all', 'core', 'industry', 'addon'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === tab
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab === 'all' ? 'All Master Modules (18)' : `${tab} Modules`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 bg-slate-900/30 rounded-2xl border border-slate-800">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400">Loading master modules catalogue...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules
                .filter(m => (filter === 'all' ? true : m.category.toLowerCase() === filter))
                .map(mod => {
                  const isToggling = togglingId === mod.id;

                  return (
                    <div
                      key={mod.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        mod.isActive
                          ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/60 border-rose-900/40 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{mod.name}</h3>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                              v{mod.version}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-indigo-400">{mod.key}</p>
                        </div>

                        {/* Power Toggle Button */}
                        <button
                          onClick={() => handleToggleGlobalModule(mod)}
                          disabled={isToggling}
                          className={`p-2.5 rounded-xl transition-all ${
                            mod.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-400 border border-rose-500/20'
                          }`}
                          title={mod.isActive ? 'Turn Off Module' : 'Turn On Module'}
                        >
                          <Power className={`w-4 h-4 ${isToggling ? 'animate-spin' : ''}`} />
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                        {mod.description || 'Core business capability module for Webin10 multi-tenant OS.'}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-slate-800/80 font-medium text-slate-300">
                          {mod.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              mod.isActive ? 'bg-emerald-400' : 'bg-rose-500'
                            }`}
                          />
                          <span className={mod.isActive ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                            {mod.isActive ? 'Operational' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Global Impact Confirmation Modal */}
      {impactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Emergency Kill-Switch</h3>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to deactivate{' '}
              <strong className="text-white">{impactModal.module.name}</strong> platform-wide?
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Active Business Tenants Affected:</span>
                <span className="font-semibold text-rose-400">
                  {impactModal.affectedTenantsCount} tenants
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tenant UI Impact:</span>
                <span className="font-semibold text-slate-200">Hidden from sidebar & App Store</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Backend APIs:</span>
                <span className="font-semibold text-slate-200">Returns 403 Module Disabled</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setImpactModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeGlobalStatusChange(impactModal.module.id, false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-lg shadow-rose-600/30"
              >
                Deactivate Platform-Wide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
