import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class LogRetentionService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(LogRetentionService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly RETENTION_DAYS = 5;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap() {
    this.logger.log(`Initialized 5-Day Automatic Log Retention Engine. Running initial prune...`);
    // Run initial cleanup 10 seconds after server startup
    setTimeout(() => {
      this.purgeOldLogs(this.RETENTION_DAYS).catch((err) => {
        this.logger.error(`Initial log purge failed: ${err.message}`);
      });
    }, 10000);

    // Schedule automatic pruning every 6 hours
    this.timer = setInterval(() => {
      this.purgeOldLogs(this.RETENTION_DAYS).catch((err) => {
        this.logger.error(`Scheduled 6-hour log purge failed: ${err.message}`);
      });
    }, 6 * 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Permanently purge WhatsApp logs, Audit logs, and expired sessions older than retention days
   */
  async purgeOldLogs(days = this.RETENTION_DAYS) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    this.logger.log(`Pruning logs created prior to: ${cutoffDate.toISOString()} (${days} days retention)`);

    try {
      // 1. WhatsApp Delivery & Audit Logs
      const whatsAppResult = await this.prisma.whatsAppMessageLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // 2. Platform Audit Logs
      const auditResult = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // 3. Expired or Stale Platform Sessions
      const sessionsResult = await this.prisma.platformSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { createdAt: { lt: cutoffDate } },
          ],
        },
      });

      this.logger.log(
        `Purge Completed Successfully! Deleted: ${whatsAppResult.count} WhatsApp logs, ${auditResult.count} Audit logs, ${sessionsResult.count} Stale sessions.`,
      );

      return {
        success: true,
        retentionDays: days,
        cutoffDate,
        deleted: {
          whatsAppLogs: whatsAppResult.count,
          auditLogs: auditResult.count,
          staleSessions: sessionsResult.count,
          total: whatsAppResult.count + auditResult.count + sessionsResult.count,
        },
      };
    } catch (err: any) {
      this.logger.error(`Failed to execute log purge: ${err.message}`);
      throw err;
    }
  }
}
