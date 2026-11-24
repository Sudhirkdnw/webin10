'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Check } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  aspect?: 'square' | 'video' | 'circle' | 'banner';
  placeholderText?: string;
}

export function ImageUploader({
  value,
  onChange,
  folder = 'general',
  label,
  aspect = 'square',
  placeholderText = 'Click or drag to upload image',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, SVG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('webin10_admin_token') : null;

      const res = await fetch(`${API_BASE_URL}/uploads/image?folder=${encodeURIComponent(folder)}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Image upload to Cloudinary failed');
      }

      const uploadedUrl = json.data?.url || json.url;
      if (uploadedUrl) {
        onChange(uploadedUrl);
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setError(null);
  }

  const aspectClasses = {
    circle: 'w-24 h-24 rounded-full',
    square: 'w-28 h-28 rounded-xl',
    video: 'w-full h-36 rounded-xl',
    banner: 'w-full h-28 rounded-xl',
  }[aspect];

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="flex items-center gap-4">
        {/* Preview Container */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative group overflow-hidden bg-slate-950 border border-slate-700/80 hover:border-emerald-500 cursor-pointer transition-all flex items-center justify-center ${aspectClasses}`}
        >
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Uploaded asset"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <span className="text-[11px] font-semibold text-white">Change</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-3 text-center text-slate-500 group-hover:text-emerald-400">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              ) : (
                <>
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] leading-tight">Upload</span>
                </>
              )}
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            </div>
          )}
        </div>

        {/* Info & Actions */}
        <div className="space-y-1 flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            onChange={handleFileSelected}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : value ? 'Replace Image' : 'Choose File'}
            </button>

            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            Cloudinary CDN (Max 5MB: JPG, PNG, WEBP, SVG)
          </p>

          {value && (
            <p className="text-[10px] text-emerald-400 truncate max-w-xs font-mono">
              ✓ {value}
            </p>
          )}

          {error && (
            <p className="text-xs text-rose-400 font-medium">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
