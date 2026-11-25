'use client';

import React, { useState } from 'react';
import { BusinessShell } from '@/components/business-shell';
import { useActiveTenant } from '@/lib/tenant';
import { useTenantModules, ModuleItem } from '@/lib/modules';
import {
  Boxes,
  CheckCircle2,
  Sparkles,
  Zap,
  Users,
  QrCode,
  BookOpen,
  Calendar,
  Pill,
  Receipt,
  MessageSquare,
  CreditCard,
  UserCheck,
  BarChart3,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react';

const MODULE_ICONS: Record<string, any> = {
  crm: Users,
  memberships: CreditCard,
  courses_batches: BookOpen,
  attendance_qr: QrCode,
  appointments: Calendar,
  medicine_refill: Pill,
  udhar_khata: Receipt,
  billing: CreditCard,
  staff: UserCheck,
  automation: MessageSquare,
  reports: BarChart3,
};

export default function TenantModulesPage() {
  const { tenantId, tenantName } = useActiveTenant();
  const { modules, activeKeys, categoryName, categorySlug, loading, toggleModule } = useTenantModules(tenantId);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleToggle = async (mod: ModuleItem) => {
    setTogglingKey(mod.key);
    setFeedback(null);
    const newStatus = !mod.isEnabled;

    const ok = await toggleModule(mod.key, newStatus);
    if (ok) {
      setFeedback({
        type: 'success',
        message: `Module "${mod.name}" has been ${newStatus ? 'enabled' : 'disabled'}. Navigation updated!`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: `Failed to update module "${mod.name}". Please try again.`,
      });
    }
    setTogglingKey(null);
  };

  const activeModules = modules?.filter((m) => m.isEnabled) || [];
  const availableModules = modules?.filter((m) => !m.isEnabled) || [];

  return (
    <BusinessShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Modular Feature Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                Category: {categoryName || 'General Business'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Feature Modules &amp; App Store
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Custom-tailor your workspace. Turn on the modules you need for your niche, and hide the rest to keep your dashboard clean.
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-medium shadow-sm transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Loading feature modules catalog...</span>
          </div>
        ) : (
          <>
            {/* Section 1: Active Modules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Active Modules in Your Workspace ({activeModules.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    These capabilities are live and accessible from your navigation sidebar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeModules.map((mod) => {
                  const Icon = MODULE_ICONS[mod.key] || Boxes;
                  const isProcessing = togglingKey === mod.key;

                  return (
                    <div
                      key={mod.id}
                      className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">{mod.name}</h3>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {mod.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {mod.key}
                        </span>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleToggle(mod)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition-all disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Turn Off'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Available Modules to Enable */}
            {availableModules.length > 0 && (
              <div className="space-y-4 pt-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <span>Explore &amp; Enable More Modules ({availableModules.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click to activate additional modules tailored for your evolving business needs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableModules.map((mod) => {
                    const Icon = MODULE_ICONS[mod.key] || Boxes;
                    const isProcessing = togglingKey === mod.key;

                    return (
                      <div
                        key={mod.id}
                        className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 shadow-xs hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-600 flex items-center justify-center">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                              Inactive
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-sm">{mod.name}</h3>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {mod.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {mod.key}
                          </span>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleToggle(mod)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Zap className="w-3 h-3" />
                                <span>Enable Module</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </BusinessShell>
  );
}
