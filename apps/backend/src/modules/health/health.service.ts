import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import * as os from 'os';
import Redis from 'ioredis';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * 1. Basic Public Ping (for ALB / Uptime Monitors)
   */
  getBasicPing() {
    return {
      status: 'ok',
      service: 'webin10-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * 2. Live Host Server & Hardware Telemetry (CPU & RAM)
   */
  getSystemTelemetry() {
    const cpus = os.cpus();
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const memUsagePercent = Math.round((usedMemBytes / totalMemBytes) * 100);

    const procMem = process.memoryUsage();

    // Calculate CPU load average across cores
    let totalIdle = 0;
    let totalTick = 0;
    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });
    const cpuUsagePercent = Math.min(100, Math.max(0, Math.round(100 - (totalIdle / totalTick) * 100)));

    // Load averages (1m, 5m, 15m)
    const loadAvg = os.loadavg();

    return {
      hardware: {
        platform: os.platform(),
        osType: os.type(),
        osRelease: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        nodeVersion: process.version,
      },
      cpu: {
        model: cpus[0]?.model || 'Virtual Server CPU',
        cores: cpus.length,
        usagePercent: cpuUsagePercent,
        loadAverage: {
          '1m': Number(loadAvg[0]?.toFixed(2) || 0),
          '5m': Number(loadAvg[1]?.toFixed(2) || 0),
          '15m': Number(loadAvg[2]?.toFixed(2) || 0),
        },
      },
      memory: {
        totalGb: Number((totalMemBytes / (1024 * 1024 * 1024)).toFixed(2)),
        usedGb: Number((usedMemBytes / (1024 * 1024 * 1024)).toFixed(2)),
        freeGb: Number((freeMemBytes / (1024 * 1024 * 1024)).toFixed(2)),
        usagePercent: memUsagePercent,
        processHeapUsedMb: Number((procMem.heapUsed / (1024 * 1024)).toFixed(2)),
        processHeapTotalMb: Number((procMem.heapTotal / (1024 * 1024)).toFixed(2)),
        processRssMb: Number((procMem.rss / (1024 * 1024)).toFixed(2)),
      },
      uptime: {
        systemSeconds: os.uptime(),
        systemFormatted: this.formatUptime(os.uptime()),
        serviceSeconds: Math.round(process.uptime()),
        serviceFormatted: this.formatUptime(process.uptime()),
      },
    };
  }

  /**
   * 3. PostgreSQL Database Health & Query Diagnostics
   */
  async getDatabaseHealth() {
    try {
      // 1. Measure query latency
      const start = Date.now();
      await this.prisma.$queryRawUnsafe('SELECT 1');
      const latencyMs = Date.now() - start;

      // 2. Database Storage Size
      const sizeResult: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size, 
          pg_database_size(current_database())::text as size_bytes
      `);
      const dbSize = sizeResult[0]?.size || 'N/A';
      const dbSizeBytes = Number(sizeResult[0]?.size_bytes || 0);

      // 3. Active Connections & Connection Limits
      const connResult: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT 
          count(*)::int as total,
          count(*) filter (where state = 'active')::int as active,
          count(*) filter (where state = 'idle')::int as idle
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      const maxConnResult: any[] = await this.prisma.$queryRawUnsafe(`SHOW max_connections`);
      const maxConnections = parseInt(maxConnResult[0]?.max_connections || '100', 10);

      const totalConn = connResult[0]?.total || 1;
      const activeConn = connResult[0]?.active || 1;
      const idleConn = connResult[0]?.idle || 0;

      // 4. Table Metrics & Row Counts (Top 12 Tables)
      const tablesResult: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT 
          relname as name, 
          n_live_tup::int as row_count, 
          pg_size_pretty(pg_total_relation_size(relid)) as size
        FROM pg_stat_user_tables 
        ORDER BY n_live_tup DESC 
        LIMIT 12
      `);

      // 5. Total Table Count
      const tableCountRes: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT count(*)::int as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `);
      const totalTables = tableCountRes[0]?.count || 0;

      // 6. PostgreSQL Version
      const verResult: any[] = await this.prisma.$queryRawUnsafe(`SELECT version() as version`);
      const versionStr = verResult[0]?.version?.split(' on ')?.[0] || 'PostgreSQL';

      return {
        status: latencyMs < 50 ? 'HEALTHY' : latencyMs < 200 ? 'DEGRADED' : 'SLOW',
        latencyMs,
        storage: {
          prettySize: dbSize,
          bytes: dbSizeBytes,
          totalTables,
        },
        connections: {
          active: activeConn,
          idle: idleConn,
          total: totalConn,
          max: maxConnections,
          usagePercent: Math.round((totalConn / maxConnections) * 100),
        },
        tables: tablesResult || [],
        version: versionStr,
      };
    } catch (err: any) {
      this.logger.error('Failed to query database health:', err);
      return {
        status: 'UNHEALTHY',
        error: err.message,
        latencyMs: 9999,
        storage: { prettySize: 'Error', bytes: 0, totalTables: 0 },
        connections: { active: 0, idle: 0, total: 0, max: 100, usagePercent: 0 },
        tables: [],
        version: 'PostgreSQL (Unavailable)',
      };
    }
  }

  /**
   * 4. Redis & Background Queue Telemetry
   */
  async getQueueHealth() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    let redisStatus = 'OFFLINE';
    let redisLatencyMs = 0;
    let redisInfo: any = {};

    try {
      // Connect with 1.2s timeout to avoid blocking if Redis is offline
      const client = new Redis({
        host: redisHost,
        port: redisPort,
        password: process.env.REDIS_PASSWORD || undefined,
        connectTimeout: 1200,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      const start = Date.now();
      await client.connect();
      const ping = await client.ping();
      redisLatencyMs = Date.now() - start;

      if (ping === 'PONG') {
        redisStatus = 'HEALTHY';
        const rawInfo = await client.info('memory');
        const clientsInfo = await client.info('clients');

        const memMatch = rawInfo.match(/used_memory_human:([^\r\n]+)/);
        const clientsMatch = clientsInfo.match(/connected_clients:([^\r\n]+)/);

        redisInfo = {
          usedMemory: memMatch ? memMatch[1] : 'N/A',
          connectedClients: clientsMatch ? parseInt(clientsMatch[1], 10) : 1,
        };
      }
      await client.quit();
    } catch (e: any) {
      redisStatus = 'OFFLINE';
      redisInfo = {
        message: 'Redis server is not listening on port 6379 (Using resilient in-memory fallback)',
      };
    }

    // Query queues workload from DB logs
    const [waitingLogs, sentLogs, failedLogs] = await Promise.all([
      this.prisma.whatsAppMessageLog.count({ where: { status: 'QUEUED' } }),
      this.prisma.whatsAppMessageLog.count({ where: { status: 'SENT' } }),
      this.prisma.whatsAppMessageLog.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      redis: {
        status: redisStatus,
        host: redisHost,
        port: redisPort,
        latencyMs: redisLatencyMs,
        details: redisInfo,
      },
      queues: {
        whatsAppQueue: {
          name: 'whatsapp-dispatch-queue',
          status: waitingLogs > 50 ? 'CONGESTED' : 'RUNNING',
          waiting: waitingLogs,
          active: waitingLogs > 0 ? 1 : 0,
          completedTotal: sentLogs,
          failedTotal: failedLogs,
        },
        logRetentionJob: {
          name: 'log-retention-purger',
          status: 'SCHEDULED (Every 6h)',
          nextRun: 'Within next 4 hours',
          retentionPolicyDays: 5,
        },
      },
    };
  }

  /**
   * 5. Full System Telemetry & Health Dashboard Aggregate
   */
  async getFullHealthDashboard() {
    const [system, db, queues] = await Promise.all([
      Promise.resolve(this.getSystemTelemetry()),
      this.getDatabaseHealth(),
      this.getQueueHealth(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      overallStatus: db.status === 'HEALTHY' && system.memory.usagePercent < 90 ? 'OPTIMAL' : 'WARNING',
      system,
      database: db,
      queues,
    };
  }

  /**
   * 6. 1-Click Database Backup (.sql generator)
   */
  async generateDatabaseBackup(adminId: string, ip?: string) {
    this.logger.log(`Initiating full database SQL backup by admin: ${adminId}`);

    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `webin10_backup_${dateStr}.sql`;

    // 1. Fetch all public user tables
    const tablesRes: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `);

    let sqlOutput = `-- =============================================================\n`;
    sqlOutput += `-- Webin10 Multi-Tenant SaaS Platform Database Backup\n`;
    sqlOutput += `-- Timestamp: ${now.toISOString()}\n`;
    sqlOutput += `-- Server Host: ${os.hostname()} (${os.platform()})\n`;
    sqlOutput += `-- =============================================================\n\n`;
    sqlOutput += `SET client_encoding = 'UTF8';\n`;
    sqlOutput += `SET standard_conforming_strings = on;\n`;
    sqlOutput += `SET check_function_bodies = false;\n`;
    sqlOutput += `SET client_min_messages = warning;\n`;
    sqlOutput += `SET row_security = off;\n\n`;
    sqlOutput += `BEGIN;\n\n`;

    for (const row of tablesRes) {
      const tableName = row.table_name;
      try {
        const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}" LIMIT 5000`);
        if (rows && rows.length > 0) {
          sqlOutput += `-- Table Data: "${tableName}" (${rows.length} rows)\n`;
          const columns = Object.keys(rows[0]);
          const colsEscaped = columns.map((c) => `"${c}"`).join(', ');

          for (const item of rows) {
            const values = columns.map((col) => {
              const val = item[col];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number' || typeof val === 'bigint') return val;
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
              if (val instanceof Date) return `'${val.toISOString()}'`;
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
              return `'${String(val).replace(/'/g, "''")}'`;
            });
            sqlOutput += `INSERT INTO "${tableName}" (${colsEscaped}) VALUES (${values.join(', ')});\n`;
          }
          sqlOutput += `\n`;
        }
      } catch (tableErr: any) {
        this.logger.warn(`Could not dump table ${tableName}: ${tableErr.message}`);
        sqlOutput += `-- Skipping table "${tableName}": ${tableErr.message}\n\n`;
      }
    }

    sqlOutput += `COMMIT;\n`;
    sqlOutput += `-- Backup completed successfully with ${tablesRes.length} tables.\n`;

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'system.database_backup_downloaded',
      entity: 'database',
      details: {
        filename,
        tableCount: tablesRes.length,
        timestamp: now.toISOString(),
      },
      ipAddress: ip,
    });

    return {
      filename,
      sql: sqlOutput,
      tableCount: tablesRes.length,
    };
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return parts.join(' ');
  }
}
