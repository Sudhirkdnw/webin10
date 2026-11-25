'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  Zap,
  Terminal,
  ShieldCheck,
  FileCode,
  Radio,
  Timer,
  Boxes,
} from 'lucide-react';
import { apiRequest, getApiBaseUrl } from '@/lib/api';

interface TelemetryData {
  timestamp: string;
  overallStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  system: {
    hardware: {
      platform: string;
      osType: string;
      osRelease: string;
      arch: string;
      hostname: string;
      nodeVersion: string;
    };
    cpu: {
      model: string;
      cores: number;
      usagePercent: number;
      loadAverage: {
        '1m': number;
        '5m': number;
        '15m': number;
      };
    };
    memory: {
      totalGb: number;
      usedGb: number;
      freeGb: number;
      usagePercent: number;
      processHeapUsedMb: number;
      processHeapTotalMb: number;
      processRssMb: number;
    };
    uptime: {
      systemSeconds: number;
      systemFormatted: string;
      serviceSeconds: number;
      serviceFormatted: string;
    };
  };
  database: {
    status: 'HEALTHY' | 'DEGRADED' | 'SLOW' | 'UNHEALTHY';
    latencyMs: number;
    storage: {
      prettySize: string;
      bytes: number;
      totalTables: number;
    };
    connections: {
      active: number;
      idle: number;
      total: number;
      max: number;
      usagePercent: number;
    };
    tables: Array<{
      name: string;
      row_count: number;
      size: string;
    }>;
    version: string;
    error?: string;
  };
  queues: {
    redis: {
      status: string;
      host: string;
      port: number;
      latencyMs: number;
      details: {
        usedMemory?: string;
        connectedClients?: number;
        message?: string;
      };
    };
    queues: {
      whatsAppQueue: {
        name: string;
        status: string;
        waiting: number;
        active: number;
        completedTotal: number;
        failedTotal: number;
      };
      logRetentionJob: {
        name: string;
        status: string;
        nextRun: string;
        retentionPolicyDays: number;
      };
    };
  };
}

export default function SystemTelemetryPage() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    const res = await apiRequest<TelemetryData>('/super-admin/system/telemetry');
    if (res.success && res.data) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.error || 'Failed to load telemetry data');
    }
    setLoading(false);
    if (showRefreshingSpinner) {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTelemetry(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTelemetry]);

  // 1-Click Database Backup Handler
  const handleDownloadBackup = async () => {
    try {
      setDownloadingBackup(true);
      setBackupSuccess(null);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('webin10_admin_token') : null;

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/super-admin/system/backup`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to generate database backup (${res.status} ${res.statusText})`);
      }

      // Read Content-Disposition header for filename if available
      const disposition = res.headers.get('Content-Disposition');
      let filename = `webin10_db_backup_${new Date().toISOString().slice(0, 10)}.sql`;
      if (disposition && disposition.includes('filename=')) {
        const matches = /filename="?([^"]+)"?/.exec(disposition);
        if (matches && matches[1]) filename = matches[1];
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setBackupSuccess(`Backup file "${filename}" generated and downloaded successfully!`);
      setTimeout(() => setBackupSuccess(null), 8000);
    } catch (err: any) {
      setError(err.message || 'Error downloading database backup');
    } finally {
      setDownloadingBackup(false);
    }
  };

  const getUsageBarColor = (pct: number) => {
    if (pct < 65) return 'bg-emerald-500';
    if (pct < 85) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getLatencyBadge = (latency: number) => {
    if (latency < 15) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
          <Zap className="w-3 h-3" /> {latency}ms (Lightning)
        </span>
      );
    }
    if (latency < 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-800">
          <Clock className="w-3 h-3" /> {latency}ms (Normal)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800">
        <AlertTriangle className="w-3 h-3" /> {latency}ms (Slow)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
        <p className="text-base font-medium text-slate-300">Fetching live server telemetry & database metrics...</p>
        <p className="text-xs text-slate-500 mt-1">Collecting CPU, RAM, Postgres pool & queue states</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Server Health, Database & System Telemetry
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    data?.overallStatus === 'OPTIMAL'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-700/50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {data?.overallStatus || 'OPTIMAL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time EC2 server load, PostgreSQL connection pool, Redis/BullMQ background queues & 1-click SQL backup
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Auto-Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
              autoRefresh
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-inner'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Auto-refresh telemetry every 5 seconds"
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-indigo-400 animate-pulse' : ''}`} />
            <span>Auto-Refresh {autoRefresh ? '(5s ON)' : '(OFF)'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchTelemetry(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* 1-Click Database Backup Button */}
          <button
            onClick={handleDownloadBackup}
            disabled={downloadingBackup}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${downloadingBackup ? 'animate-bounce' : ''}`} />
            <span>{downloadingBackup ? 'Generating Backup...' : '1-Click SQL Backup'}</span>
          </button>
        </div>
      </div>

      {/* Backup Success Toast / Banner */}
      {backupSuccess && (
        <div className="flex items-center justify-between p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{backupSuccess}</span>
          </div>
          <button
            onClick={() => setBackupSuccess(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200 uppercase font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-sm">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-rose-400 hover:text-rose-200 uppercase font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top 3 Core Metric Cards: Live CPU, Live RAM, Host specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: CPU Usage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Live CPU Load</h3>
                <p className="text-[11px] text-slate-400">{data?.system.cpu.cores} Physical / Virtual Cores</p>
              </div>
            </div>
            <span className="text-2xl font-extrabold text-white">
              {data?.system.cpu.usagePercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getUsageBarColor(data?.system.cpu.usagePercent || 0)}`}
                style={{ width: `${Math.min(100, Math.max(2, data?.system.cpu.usagePercent || 0))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0% Idle</span>
              <span>100% Saturated</span>
            </div>
          </div>

          {/* Details / Load Averages */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>CPU Architecture:</span>
              <span className="font-mono text-slate-200 font-medium">{data?.system.hardware.arch}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Load Average (1m, 5m, 15m):</span>
              <span className="font-mono text-slate-200 font-medium">
                {data?.system.cpu.loadAverage['1m']}, {data?.system.cpu.loadAverage['5m']}, {data?.system.cpu.loadAverage['15m']}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate" title={data?.system.cpu.model}>
              Model: {data?.system.cpu.model}
            </div>
          </div>
        </div>

        {/* Card 2: RAM Memory Usage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Host RAM Memory</h3>
                <p className="text-[11px] text-slate-400">
                  {data?.system.memory.usedGb} GB used of {data?.system.memory.totalGb} GB
                </p>
              </div>
            </div>
            <span className="text-2xl font-extrabold text-white">
              {data?.system.memory.usagePercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getUsageBarColor(data?.system.memory.usagePercent || 0)}`}
                style={{ width: `${Math.min(100, Math.max(2, data?.system.memory.usagePercent || 0))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Free: {data?.system.memory.freeGb} GB</span>
              <span>Total: {data?.system.memory.totalGb} GB</span>
            </div>
          </div>

          {/* Details / Node process memory */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Node.js Heap Used:</span>
              <span className="font-mono text-emerald-400 font-semibold">{data?.system.memory.processHeapUsedMb} MB</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Process RSS Resident:</span>
              <span className="font-mono text-slate-200 font-medium">{data?.system.memory.processRssMb} MB</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Node.js Heap Total:</span>
              <span className="font-mono text-slate-400">{data?.system.memory.processHeapTotalMb} MB</span>
            </div>
          </div>
        </div>

        {/* Card 3: Host OS & Uptime */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Host System & Uptime</h3>
                <p className="text-[11px] text-slate-400">Node runtime & container specs</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-1 bg-sky-950 text-sky-300 border border-sky-800 rounded-lg">
              {data?.system.hardware.platform}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Server Hostname:</span>
              <span className="font-mono text-slate-200 font-medium truncate max-w-[170px]" title={data?.system.hardware.hostname}>
                {data?.system.hardware.hostname}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>OS Kernel / Release:</span>
              <span className="font-mono text-slate-300 truncate max-w-[170px]" title={`${data?.system.hardware.osType} ${data?.system.hardware.osRelease}`}>
                {data?.system.hardware.osType} {data?.system.hardware.osRelease}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Node.js Runtime:</span>
              <span className="font-mono text-amber-400 font-semibold">{data?.system.hardware.nodeVersion}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> System Uptime:
              </span>
              <span className="font-mono text-white font-semibold">{data?.system.uptime.systemFormatted}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Timer className="w-3.5 h-3.5 text-emerald-400" /> Backend Service:
              </span>
              <span className="font-mono text-white font-semibold">{data?.system.uptime.serviceFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Deep Health & Top Tables */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-white">PostgreSQL Database Health</h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                    data?.database.status === 'HEALTHY'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {data?.database.status}
                </span>
                {data && getLatencyBadge(data.database.latencyMs)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Engine: <span className="text-slate-300 font-mono">{data?.database.version}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats on Right */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-500 text-[10px] block uppercase">Storage Size</span>
              <span className="text-white font-bold text-sm">{data?.database.storage.prettySize}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-500 text-[10px] block uppercase">Total Tables</span>
              <span className="text-white font-bold text-sm">{data?.database.storage.totalTables}</span>
            </div>
          </div>
        </div>

        {/* Connection Pool Diagnostics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold block">Active Connections</span>
            <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
              {data?.database.connections.active}
            </span>
            <span className="text-[11px] text-slate-500">Currently executing queries</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold block">Idle Connections</span>
            <span className="text-xl font-bold text-blue-400 font-mono mt-1 block">
              {data?.database.connections.idle}
            </span>
            <span className="text-[11px] text-slate-500">Ready in connection pool</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold block">Total In Use</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">
              {data?.database.connections.total}
            </span>
            <span className="text-[11px] text-slate-500">Client pool connections</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold block">Max Pool Limit</span>
            <span className="text-xl font-bold text-slate-300 font-mono mt-1 block">
              {data?.database.connections.max}
            </span>
            <span className="text-[11px] text-slate-500">
              {data?.database.connections.usagePercent}% capacity utilized
            </span>
          </div>
        </div>

        {/* Top 12 Tables live row count */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> Top Database Tables (Live Rows & Size)
            </h3>
            <span className="text-xs text-slate-500">Updated in real-time</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Table Name</th>
                  <th className="px-4 py-3 text-right">Live Records (Tuples)</th>
                  <th className="px-4 py-3 text-right">Physical Disk Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data?.database.tables && data.database.tables.length > 0 ? (
                  data.database.tables.map((table) => (
                    <tr key={table.name} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 text-slate-200 font-medium">
                        <span className="text-purple-400 font-normal mr-1.5">public.</span>
                        {table.name}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-white">
                        {table.row_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-400">
                        {table.size}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-slate-500">
                      No tables found or query permission pending
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Redis & Background Queues Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Redis Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Redis Cache & Memory Store</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {data?.queues.redis.host}:{data?.queues.redis.port}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                data?.queues.redis.status === 'HEALTHY'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              {data?.queues.redis.status}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {data?.queues.redis.status === 'HEALTHY' ? (
              <>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Ping Latency:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{data.queues.redis.latencyMs}ms</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Used Memory:</span>
                  <span className="font-mono text-white font-medium">{data.queues.redis.details.usedMemory}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Connected Clients:</span>
                  <span className="font-mono text-white font-medium">{data.queues.redis.details.connectedClients}</span>
                </div>
              </>
            ) : (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <p className="text-amber-400 font-medium">Resilient In-Memory Mode Active</p>
                <p className="text-[11px] text-slate-500">
                  Local development is operating without Redis port 6379. Background dispatchers and rate-limiters failover gracefully to database storage without any downtime.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Background Queues (BullMQ / WhatsApp dispatcher) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Background Job Queues</h3>
                <p className="text-xs text-slate-400">WhatsApp message delivery & automated maintenance</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-current" />
              {data?.queues.queues.whatsAppQueue.status}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* WhatsApp Queue Breakdown */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-200">whatsapp-dispatch-queue</span>
                <span className="text-[11px] font-mono text-indigo-400">Auto-Worker Active</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-center">
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase">Waiting</span>
                  <span className="text-sm font-bold text-amber-400">{data?.queues.queues.whatsAppQueue.waiting}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase">Active</span>
                  <span className="text-sm font-bold text-blue-400">{data?.queues.queues.whatsAppQueue.active}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase">Delivered</span>
                  <span className="text-sm font-bold text-emerald-400">{data?.queues.queues.whatsAppQueue.completedTotal}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase">Failed</span>
                  <span className="text-sm font-bold text-rose-400">{data?.queues.queues.whatsAppQueue.failedTotal}</span>
                </div>
              </div>
            </div>

            {/* Scheduled Cron Worker */}
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
              <div>
                <span className="font-medium text-slate-300 block">log-retention-purger</span>
                <span className="text-[11px] text-slate-500">Purges logs older than {data?.queues.queues.logRetentionJob.retentionPolicyDays} days</span>
              </div>
              <span className="font-mono text-xs text-emerald-400 font-semibold">
                {data?.queues.queues.logRetentionJob.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Database Backup Action Box */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">1-Click Full Database Backup (.sql)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Super Admin can download a complete, valid PostgreSQL SQL dump of all platform tables with schema headers and transaction wrappers (<code className="text-indigo-300">BEGIN ... COMMIT</code>). No terminal or SSH access required.
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Every backup action is permanently audited with your Super Admin ID and IP address in Platform Audit Logs.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={handleDownloadBackup}
              disabled={downloadingBackup}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${downloadingBackup ? 'animate-bounce' : ''}`} />
              <span>{downloadingBackup ? 'Generating SQL Dump...' : 'Download Database Backup (.sql)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
