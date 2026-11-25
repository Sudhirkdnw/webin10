'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ArrowRight,
  ExternalLink,
  Megaphone,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'PROMOTION';
  displayType: 'TOP_BANNER' | 'MODAL_POPUP';
  ctaText: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  openInNewTab: boolean;
  isDismissible: boolean;
  priority: number;
}

interface AnnouncementBannerProps {
  tenantId?: string;
}

export function AnnouncementBanner({ tenantId }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [modalItem, setModalItem] = useState<Announcement | null>(null);

  useEffect(() => {
    // 1. Read previously dismissed IDs from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('webin10_dismissed_announcements');
        if (stored) {
          setDismissedIds(new Set(JSON.parse(stored)));
        }
      } catch {}
    }

    // 2. Fetch active announcements for this tenant
    const fetchActive = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const url = tenantId
          ? `${baseUrl}/tenants/announcements/active?tenantId=${encodeURIComponent(tenantId)}`
          : `${baseUrl}/tenants/announcements/active`;

        const res = await fetch(url);
        if (res.ok) {
          const data: Announcement[] = await res.json();
          if (Array.isArray(data)) {
            setAnnouncements(data);

            // If any active announcement is a MODAL_POPUP and not dismissed, show modal
            const popup = data.find((a) => a.displayType === 'MODAL_POPUP');
            if (popup) {
              const isDismissed = typeof window !== 'undefined' && localStorage.getItem(`webin10_dismissed_${popup.id}`);
              if (!isDismissed) {
                setModalItem(popup);
              }
            }
          }
        }
      } catch (err) {
        // Fail gracefully without interrupting dashboard
      }
    };

    fetchActive();
  }, [tenantId]);

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    setDismissedIds((prev) => {
      const updated = new Set(prev).add(id);
      try {
        localStorage.setItem('webin10_dismissed_announcements', JSON.stringify(Array.from(updated)));
        localStorage.setItem(`webin10_dismissed_${id}`, 'true');
      } catch {}
      return updated;
    });

    if (modalItem?.id === id) {
      setModalItem(null);
    }
  };

  // Filter out dismissed banners (unless CRITICAL with isDismissible=false)
  const activeBanners = announcements.filter((a) => {
    if (a.displayType !== 'TOP_BANNER') return false;
    if (!a.isDismissible) return true; // Mandatory / persistent
    return !dismissedIds.has(a.id);
  });

  const getStyleForType = (type: string) => {
    switch (type) {
      case 'PROMOTION':
        return {
          wrapper: 'bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white border-purple-700/60 shadow-lg shadow-purple-950/20',
          badge: 'bg-purple-500/30 text-purple-200 border border-purple-400/40',
          button: 'bg-purple-500 hover:bg-purple-400 text-white shadow-md shadow-purple-900/30',
          icon: <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />,
        };
      case 'CRITICAL':
        return {
          wrapper: 'bg-gradient-to-r from-red-900 via-rose-900 to-red-950 text-white border-red-700/60 shadow-lg shadow-red-950/20',
          badge: 'bg-red-500/30 text-red-200 border border-red-400/40',
          button: 'bg-white hover:bg-red-50 text-red-800 shadow-md shadow-red-950/30 font-bold',
          icon: <ShieldAlert className="w-4 h-4 text-red-300 animate-bounce" />,
        };
      case 'WARNING':
        return {
          wrapper: 'bg-gradient-to-r from-amber-900 via-orange-900 to-amber-950 text-white border-amber-700/60 shadow-lg shadow-amber-950/20',
          badge: 'bg-amber-500/30 text-amber-200 border border-amber-400/40',
          button: 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-950/30 font-bold',
          icon: <AlertTriangle className="w-4 h-4 text-amber-300" />,
        };
      case 'SUCCESS':
        return {
          wrapper: 'bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white border-emerald-700/60 shadow-lg shadow-emerald-950/20',
          badge: 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40',
          button: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-900/30 font-semibold',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-300" />,
        };
      default:
        return {
          wrapper: 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-blue-700/60 shadow-lg shadow-blue-950/20',
          badge: 'bg-blue-500/30 text-blue-200 border border-blue-400/40',
          button: 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 font-semibold',
          icon: <Info className="w-4 h-4 text-blue-300" />,
        };
    }
  };

  return (
    <>
      {/* 1. TOP BANNERS LIST */}
      {activeBanners.length > 0 && (
        <div className="space-y-3 px-4 sm:px-6 pt-4">
          {activeBanners.map((banner) => {
            const style = getStyleForType(banner.type);
            const target = banner.openInNewTab ? '_blank' : undefined;
            const rel = banner.openInNewTab ? 'noopener noreferrer' : undefined;
            const linkHref = banner.ctaUrl || '#';

            // Case A: Rich Graphic Banner Image with Clickable Link
            if (banner.imageUrl) {
              return (
                <div
                  key={banner.id}
                  className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-md group animate-in slide-in-from-top-2 duration-300"
                >
                  <Link
                    href={linkHref}
                    target={target}
                    rel={rel}
                    className="block relative w-full h-36 sm:h-44 md:h-48 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Translucent Bottom Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent flex flex-col justify-end p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                        <div className="space-y-1 max-w-2xl min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full ${style.badge}`}>
                              {banner.type}
                            </span>
                            <span className="text-[11px] text-white/90 font-medium flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 text-purple-300" />
                              <span>Click banner to open</span>
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm truncate">
                            {banner.title}
                          </h4>
                          <p className="text-xs text-slate-200 line-clamp-1 sm:line-clamp-2 drop-shadow">
                            {banner.message}
                          </p>
                        </div>

                        {banner.ctaText && (
                          <div className="shrink-0 self-start sm:self-end">
                            <span className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${style.button}`}>
                              <span>{banner.ctaText}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Close / Dismiss Button on top-right of image */}
                  {banner.isDismissible && (
                    <button
                      onClick={(e) => handleDismiss(e, banner.id)}
                      className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg backdrop-blur-md transition-all shadow-md z-10"
                      title="Dismiss notice"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            }

            // Case B: Compact Text Banner
            return (
              <div
                key={banner.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all animate-in slide-in-from-top-2 duration-300 ${style.wrapper}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <Link
                    href={linkHref}
                    target={target}
                    rel={rel}
                    className="flex items-start sm:items-center gap-3 min-w-0 flex-1 hover:opacity-95"
                  >
                    <div className="p-1.5 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                      {style.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold tracking-tight text-white">
                          {banner.title}
                        </span>
                        <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${style.badge}`}>
                          {banner.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                        {banner.message}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {banner.ctaText && (
                      <Link
                        href={linkHref}
                        target={target}
                        rel={rel}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${style.button}`}
                      >
                        <span>{banner.ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {banner.isDismissible && (
                      <button
                        onClick={(e) => handleDismiss(e, banner.id)}
                        className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        title="Dismiss announcement"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. MODAL POPUP (If Active & Not Dismissed) */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden space-y-4 animate-in zoom-in-95 duration-200">
            {/* Modal Hero Image (if present) */}
            {modalItem.imageUrl && (
              <Link
                href={modalItem.ctaUrl || '#'}
                target={modalItem.openInNewTab ? '_blank' : undefined}
                rel={modalItem.openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  if (modalItem.isDismissible) handleDismiss(e, modalItem.id);
                }}
                className="block relative w-full h-44 sm:h-52 overflow-hidden group cursor-pointer"
              >
                <img
                  src={modalItem.imageUrl}
                  alt={modalItem.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <span className="text-[11px] text-white font-medium flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    <ExternalLink className="w-3 h-3 text-purple-300" /> Click poster to open link
                  </span>
                </div>
              </Link>
            )}

            <div className="p-6 pt-2 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {!modalItem.imageUrl && (
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
                      <Megaphone className="w-6 h-6 animate-pulse" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      {modalItem.type} Notice
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {modalItem.title}
                    </h3>
                  </div>
                </div>

                {modalItem.isDismissible && (
                  <button
                    onClick={(e) => handleDismiss(e, modalItem.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {modalItem.message}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                {modalItem.isDismissible && (
                  <button
                    onClick={(e) => handleDismiss(e, modalItem.id)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Remind Me Later
                  </button>
                )}

                {modalItem.ctaUrl ? (
                  <Link
                    href={modalItem.ctaUrl}
                    target={modalItem.openInNewTab ? '_blank' : undefined}
                    rel={modalItem.openInNewTab ? 'noopener noreferrer' : undefined}
                    onClick={(e) => handleDismiss(e, modalItem.id)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30 transition-all flex items-center gap-2"
                  >
                    <span>{modalItem.ctaText || 'Open Link'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={(e) => handleDismiss(e, modalItem.id)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                  >
                    Got It
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
