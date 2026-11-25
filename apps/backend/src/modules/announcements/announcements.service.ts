import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { ListAnnouncementsDto } from './dto/list-announcements.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * 1. Create a new Platform-Wide Announcement
   */
  async createAnnouncement(
    dto: CreateAnnouncementDto,
    adminId: string,
    ip?: string,
  ) {
    const announcement = await this.prisma.platformAnnouncement.create({
      data: {
        title: dto.title,
        message: dto.message,
        type: dto.type || 'INFO',
        displayType: dto.displayType || 'TOP_BANNER',
        targetAudience: dto.targetAudience || 'ALL_BUSINESSES',
        targetCategoryId: dto.targetCategoryId || null,
        targetPlanId: dto.targetPlanId || null,
        ctaText: dto.ctaText || null,
        ctaUrl: dto.ctaUrl || null,
        imageUrl: dto.imageUrl || null,
        openInNewTab: dto.openInNewTab !== undefined ? dto.openInNewTab : false,
        isDismissible: dto.isDismissible !== undefined ? dto.isDismissible : true,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        priority: dto.priority || 0,
        createdById: adminId,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, slug: true } },
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'announcement.created',
      entity: 'platform_announcement',
      entityId: announcement.id,
      details: {
        title: announcement.title,
        type: announcement.type,
        displayType: announcement.displayType,
        targetAudience: announcement.targetAudience,
      },
      ipAddress: ip,
    });

    return announcement;
  }

  /**
   * 2. List all announcements with search, type, and status filtering
   */
  async findAll(query: ListAnnouncementsDto) {
    const now = new Date();
    const where: Prisma.PlatformAnnouncementWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.displayType) {
      where.displayType = query.displayType;
    }

    if (query.status === 'active') {
      where.isActive = true;
      where.AND = [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      ];
    } else if (query.status === 'scheduled') {
      where.isActive = true;
      where.startsAt = { gt: now };
    } else if (query.status === 'expired') {
      where.expiresAt = { lt: now };
    } else if (query.status === 'inactive') {
      where.isActive = false;
    }

    const [items, total] = await Promise.all([
      this.prisma.platformAnnouncement.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, slug: true } },
          plan: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.platformAnnouncement.count({ where }),
    ]);

    // Compute live status label for each
    const enriched = items.map((item) => {
      let liveStatus: 'active' | 'scheduled' | 'expired' | 'inactive' = 'active';
      if (!item.isActive) {
        liveStatus = 'inactive';
      } else if (item.startsAt && new Date(item.startsAt) > now) {
        liveStatus = 'scheduled';
      } else if (item.expiresAt && new Date(item.expiresAt) < now) {
        liveStatus = 'expired';
      }

      return {
        ...item,
        liveStatus,
      };
    });

    return {
      items: enriched,
      total,
    };
  }

  /**
   * 3. Get single announcement by ID
   */
  async findOne(id: string) {
    const announcement = await this.prisma.platformAnnouncement.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return announcement;
  }

  /**
   * 4. Update an announcement
   */
  async updateAnnouncement(
    id: string,
    dto: UpdateAnnouncementDto,
    adminId: string,
    ip?: string,
  ) {
    await this.findOne(id);

    const updated = await this.prisma.platformAnnouncement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.message !== undefined && { message: dto.message }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.displayType !== undefined && { displayType: dto.displayType }),
        ...(dto.targetAudience !== undefined && { targetAudience: dto.targetAudience }),
        ...(dto.targetCategoryId !== undefined && { targetCategoryId: dto.targetCategoryId || null }),
        ...(dto.targetPlanId !== undefined && { targetPlanId: dto.targetPlanId || null }),
        ...(dto.ctaText !== undefined && { ctaText: dto.ctaText || null }),
        ...(dto.ctaUrl !== undefined && { ctaUrl: dto.ctaUrl || null }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl || null }),
        ...(dto.openInNewTab !== undefined && { openInNewTab: dto.openInNewTab }),
        ...(dto.isDismissible !== undefined && { isDismissible: dto.isDismissible }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.startsAt !== undefined && { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, slug: true } },
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'announcement.updated',
      entity: 'platform_announcement',
      entityId: id,
      details: { title: updated.title },
      ipAddress: ip,
    });

    return updated;
  }

  /**
   * 5. Quick toggle active / inactive status
   */
  async toggleActive(id: string, adminId: string, ip?: string) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.platformAnnouncement.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'announcement.status_toggled',
      entity: 'platform_announcement',
      entityId: id,
      details: { isActive: updated.isActive },
      ipAddress: ip,
    });

    return updated;
  }

  /**
   * 6. Delete announcement
   */
  async deleteAnnouncement(id: string, adminId: string, ip?: string) {
    const existing = await this.findOne(id);
    await this.prisma.platformAnnouncement.delete({ where: { id } });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'announcement.deleted',
      entity: 'platform_announcement',
      entityId: id,
      details: { title: existing.title },
      ipAddress: ip,
    });

    return { success: true, message: 'Announcement deleted successfully' };
  }

  /**
   * 7. Get Active Announcements for Business Tenants
   * Called by Business Admin Dashboard on login / render
   */
  async getActiveForTenant(tenantId?: string) {
    const now = new Date();

    // 1. Fetch all live announcements within valid date range
    const liveAnnouncements = await this.prisma.platformAnnouncement.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: { select: { id: true, name: true } },
        plan: { select: { id: true, name: true } },
      },
    });

    if (!tenantId) {
      // If no tenantId provided, return announcements targeted to ALL_BUSINESSES
      return liveAnnouncements.filter((a) => a.targetAudience === 'ALL_BUSINESSES');
    }

    // 2. Lookup tenant info (category & subscription plan)
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return liveAnnouncements.filter((a) => a.targetAudience === 'ALL_BUSINESSES');
    }

    const tenantCategoryId = tenant.categoryId;
    const tenantPlanId = tenant.subscriptions[0]?.planId;

    // 3. Filter announcements that match tenant profile
    return liveAnnouncements.filter((a) => {
      if (a.targetAudience === 'ALL_BUSINESSES') return true;
      if (a.targetAudience === 'SPECIFIC_CATEGORY' && a.targetCategoryId === tenantCategoryId) return true;
      if (a.targetAudience === 'SPECIFIC_PLAN' && a.targetPlanId === tenantPlanId) return true;
      return false;
    });
  }
}
