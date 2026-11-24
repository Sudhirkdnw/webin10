'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { FolderTree, Plus, Boxes, SlidersHorizontal, Check } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [allModules, setAllModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Module Configurator Modal
  const [configCategory, setConfigCategory] = useState<any | null>(null);
  const [selectedModuleKeys, setSelectedModuleKeys] = useState<string[]>([]);
  const [savingModules, setSavingModules] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    const [cRes, mRes] = await Promise.all([
      apiRequest('/super-admin/categories'),
      apiRequest('/super-admin/modules'),
    ]);
    if (cRes.success) setCategories(cRes.data || []);
    if (mRes.success) setAllModules(mRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiRequest('/super-admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });

    if (res.success) {
      setModalOpen(false);
      setName('');
      setDescription('');
      fetchCategories();
    } else {
      alert(res.error || 'Failed to create category');
    }
    setSaving(false);
  };

  const openModuleConfigurator = (category: any) => {
    setConfigCategory(category);
    const currentKeys = category.categoryModules?.map((cm: any) => cm.module?.key) || [];
    setSelectedModuleKeys(currentKeys);
  };

  const toggleModuleKey = (key: string) => {
    if (selectedModuleKeys.includes(key)) {
      setSelectedModuleKeys(selectedModuleKeys.filter((k) => k !== key));
    } else {
      setSelectedModuleKeys([...selectedModuleKeys, key]);
    }
  };

  const handleSaveModules = async () => {
    if (!configCategory) return;
    setSavingModules(true);

    const res = await apiRequest(`/super-admin/categories/${configCategory.id}/modules`, {
      method: 'PUT',
      body: JSON.stringify({ moduleKeys: selectedModuleKeys }),
    });

    if (res.success) {
      setConfigCategory(null);
      fetchCategories();
    } else {
      alert(res.error || 'Failed to save module assignments');
    }
    setSavingModules(false);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Verticals (Categories)</h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure industry categories (Gym, Coaching, Salon) and their default modular templates
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Business Vertical</span>
          </button>
        </div>

        {/* Grid of Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
              Loading business verticals...
            </div>
          ) : (
            categories.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-100 text-slate-600">
                      {c.slug}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">{c.description || 'Configurable SMB vertical template'}</p>

                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5" />
                        Default Modules ({c.categoryModules?.length || 0})
                      </p>
                      <button
                        onClick={() => openModuleConfigurator(c)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        Configure
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.categoryModules?.map((cm: any) => (
                        <span
                          key={cm.id}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-medium"
                        >
                          {cm.module?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{c._count?.tenants || 0} Businesses active</span>
                  <span className="text-emerald-600 font-semibold">Ready for Onboarding</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Category Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Create Business Vertical</h2>
              <p className="text-xs text-slate-500 mb-4">
                Define a new industry template for onboarding businesses without redeploying
              </p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vertical Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Martial Arts Academy"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description of businesses in this vertical..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Save Vertical'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Module Configurator Modal */}
        {configCategory && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Configure Vertical Modules</h2>
              <p className="text-xs text-slate-500 mb-4">
                Select default modules enabled for new businesses registered under <strong>{configCategory.name}</strong>
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allModules.map((m) => {
                  const isChecked = selectedModuleKeys.includes(m.key);
                  return (
                    <div
                      key={m.key}
                      onClick={() => toggleModuleKey(m.key)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-50/50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{m.name}</p>
                        <p className="text-[11px] text-slate-500">{m.description || m.key}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  {selectedModuleKeys.length} of {allModules.length} modules selected
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfigCategory(null)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingModules}
                    onClick={handleSaveModules}
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {savingModules ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
