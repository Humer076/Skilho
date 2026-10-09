import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

const PAGE_SIZE = 20;
const ADMIN_USERS_PAGE_SIZE = 10;
const ADMIN_ACCESS = ['SUPER_ADMIN', 'VERIFICATION', 'PAYMENTS', 'CONTENT'];
const NOTIFICATION_TYPES = ['SYSTEM', 'JOB', 'APPLICATION', 'VERIFICATION', 'MESSAGE'];

@Injectable()
export class AdminContentService {
  constructor(private prisma: PrismaService) {}

  private page(value?: string, pageSize = PAGE_SIZE) {
    const page = Math.max(Number.parseInt(value || '1', 10) || 1, 1);
    return { page, skip: (page - 1) * pageSize };
  }

  private pack<T>(items: T[], total: number, page: number, pageSize = PAGE_SIZE) {
    return { items, total, page, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
  }

  private async audit(actorId: string, action: string, entityType: string, entityId: string | null, summary: string, metadata?: Prisma.InputJsonValue) {
    await this.prisma.adminAuditLog.create({
      data: { actorId, action, entityType, entityId, summary, ...(metadata !== undefined ? { metadata } : {}) },
    });
  }

  async adminUsers(q?: string, status?: string, pageValue?: string) {
    const { page, skip } = this.page(pageValue, ADMIN_USERS_PAGE_SIZE);
    const term = q?.trim();
    const where: Prisma.UserWhereInput = {
      role: 'ADMIN',
      ...(status ? { adminStatus: status } : {}),
      ...(term ? { OR: [
        { email: { contains: term, mode: 'insensitive' } },
        { mobile: { contains: term } },
      ] } : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: ADMIN_USERS_PAGE_SIZE,
        select: { id: true, email: true, displayName: true, mobile: true, role: true, adminAccess: true, adminStatus: true, createdAt: true, updatedAt: true },
      }),
    ]);
    return this.pack(items, total, page, ADMIN_USERS_PAGE_SIZE);
  }

  async createAdminUser(actorId: string, input: { email: string; password: string; displayName?: string; adminAccess: string }) {
    const email = input.email.trim().toLowerCase();
    if (!email || input.password.length < 8 || !ADMIN_ACCESS.includes(input.adminAccess)) {
      throw new BadRequestException('Provide a valid email, password of at least 8 characters, and admin access.');
    }
    const exists = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) throw new BadRequestException('An account with this email already exists.');
    const user = await this.prisma.user.create({
      data: {
        email,
        displayName: input.displayName?.trim() || null,
        passwordHash: await bcrypt.hash(input.password, 10),
        role: Role.ADMIN,
        adminAccess: input.adminAccess,
        adminStatus: 'ACTIVE',
      },
      select: { id: true, email: true, displayName: true, role: true, adminAccess: true, adminStatus: true, createdAt: true, updatedAt: true },
    });
    await this.audit(actorId, 'CREATE', 'AdminUser', user.id, `Created admin account ${email}`);
    return { user };
  }

  async updateAdminUser(actorId: string, id: string, input: { adminStatus?: string; adminAccess?: string }) {
    if (id === actorId && input.adminAccess) {
      throw new BadRequestException('You cannot change your own admin access.');
    }
    if (id === actorId && input.adminStatus && input.adminStatus !== 'ACTIVE') {
      throw new BadRequestException('You cannot suspend your own account.');
    }
    if (input.adminAccess && !ADMIN_ACCESS.includes(input.adminAccess)) throw new BadRequestException('Invalid admin access.');
    if (input.adminStatus && !['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(input.adminStatus)) throw new BadRequestException('Invalid admin status.');
    const current = await this.prisma.user.findFirst({ where: { id, role: 'ADMIN' }, select: { id: true, email: true } });
    if (!current) throw new NotFoundException('Admin user not found.');
    const user = await this.prisma.user.update({
      where: { id }, data: { ...(input.adminStatus ? { adminStatus: input.adminStatus } : {}), ...(input.adminAccess ? { adminAccess: input.adminAccess } : {}) },
      select: { id: true, email: true, displayName: true, role: true, adminAccess: true, adminStatus: true, createdAt: true, updatedAt: true },
    });
    const metadata = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Prisma.InputJsonValue;
    await this.audit(actorId, 'UPDATE', 'AdminUser', id, `Updated admin account ${current.email}`, metadata);
    return { user };
  }

  async listAuditLogs(query: { action?: string; entityType?: string; q?: string; page?: string }) {
    const { page, skip } = this.page(query.page);
    const term = query.q?.trim();
    const where: Prisma.AdminAuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.entityType ? { entityType: { contains: query.entityType, mode: 'insensitive' } } : {}),
      ...(term ? { summary: { contains: term, mode: 'insensitive' } } : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.adminAuditLog.count({ where }),
      this.prisma.adminAuditLog.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: PAGE_SIZE,
        include: { actor: { select: { id: true, email: true, displayName: true, adminStatus: true } } },
      }),
    ]);
    return this.pack(items, total, page);
  }

  async articles(query: { q?: string; status?: string; category?: string; sortBy?: string; sortOrder?: string; page?: string }) {
    const { page, skip } = this.page(query.page);
    const term = query.q?.trim();
    const allowedSort = ['createdAt', 'publishedAt', 'title'];
    const sortBy = allowedSort.includes(query.sortBy || '') ? query.sortBy! : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const where: Prisma.SiteArticleWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(term ? { OR: [ { title: { contains: term, mode: 'insensitive' } }, { slug: { contains: term, mode: 'insensitive' } } ] } : {}),
    };
    const orderBy: Prisma.SiteArticleOrderByWithRelationInput = { [sortBy]: sortOrder };
    const [total, items] = await Promise.all([
      this.prisma.siteArticle.count({ where }),
      this.prisma.siteArticle.findMany({ where, orderBy, skip, take: PAGE_SIZE, include: { author: { select: { id: true, email: true } } } }),
    ]);
    return { ...this.pack(items, total, page), categories: await this.prisma.siteArticle.findMany({ distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } }) };
  }

  async articleCategories() {
    const rows = await this.prisma.siteArticle.findMany({ distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } });
    return { categories: rows.map(({ category }) => ({ category })) };
  }

  async saveArticle(actorId: string, input: any, id?: string) {
    const title = String(input.title || '').trim();
    const slug = String(input.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
    const content = String(input.content || '').trim();
    if (!title || !slug || !content) throw new BadRequestException('Title, slug, and content are required.');
    const existing = id
      ? await this.prisma.siteArticle.findUnique({ where: { id }, select: { id: true, status: true, publishedAt: true } })
      : null;
    if (id && !existing) throw new NotFoundException('Article not found.');
    const allowedStatuses = ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'];
    const status = allowedStatuses.includes(input.status) ? input.status : existing?.status || 'DRAFT';
    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('Publish date is invalid.');
    if (status === 'SCHEDULED' && !scheduledAt) throw new BadRequestException('A publish date is required for scheduled articles.');
    const data = {
      title, slug, content,
      excerpt: input.excerpt ? String(input.excerpt) : null,
      featuredImage: input.featuredImage ? String(input.featuredImage) : null,
      category: String(input.category || 'Industry'),
      tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
      isFeatured: Boolean(input.isFeatured),
      seoTitle: input.seoTitle ? String(input.seoTitle) : null,
      metaDescription: input.metaDescription ? String(input.metaDescription) : null,
      seoKeywords: Array.isArray(input.seoKeywords) ? input.seoKeywords.map(String) : [],
      canonicalUrl: input.canonicalUrl ? String(input.canonicalUrl) : null,
      ogTitle: input.ogTitle ? String(input.ogTitle) : null,
      ogDescription: input.ogDescription ? String(input.ogDescription) : null,
      ogImage: input.ogImage ? String(input.ogImage) : null,
      status,
      scheduledAt: status === 'SCHEDULED' ? scheduledAt : null,
      publishedAt: status === 'PUBLISHED' ? existing?.publishedAt || new Date() : null,
    };
    const article = id
      ? await this.prisma.siteArticle.update({ where: { id }, data })
      : await this.prisma.siteArticle.create({ data: { ...data, authorId: actorId } });
    await this.audit(actorId, id ? 'UPDATE' : 'CREATE', 'Article', article.id, `${id ? 'Updated' : 'Created'} article “${article.title}”`);
    return { article };
  }

  async updateArticleStatus(actorId: string, id: string, publish: boolean) {
    const article = await this.prisma.siteArticle.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!article) throw new NotFoundException('Article not found.');
    const result = await this.prisma.siteArticle.update({ where: { id }, data: { status: publish ? 'PUBLISHED' : 'DRAFT', publishedAt: publish ? new Date() : null } });
    await this.audit(actorId, publish ? 'PUBLISH' : 'UNPUBLISH', 'Article', id, `${publish ? 'Published' : 'Unpublished'} article “${article.title}”`);
    return { article: result };
  }

  async deleteArticle(actorId: string, id: string) {
    const article = await this.prisma.siteArticle.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!article) throw new NotFoundException('Article not found.');
    await this.prisma.siteArticle.delete({ where: { id } });
    await this.audit(actorId, 'DELETE', 'Article', id, `Deleted article “${article.title}”`);
    return { deleted: true };
  }

  async notify(actorId: string, input: { title: string; body: string; type: string; audience?: string; userId?: string }) {
    if (!input.title?.trim() || !input.body?.trim() || !NOTIFICATION_TYPES.includes(input.type)) throw new BadRequestException('A title, message, and valid type are required.');
    if (input.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: input.userId }, select: { id: true, role: true } });
      if (!user || user.role === 'ADMIN') throw new NotFoundException('Target user not found.');
      await this.prisma.notification.create({ data: { userId: user.id, title: input.title.trim(), message: input.body.trim(), type: input.type as any } });
      await this.audit(actorId, 'CREATE', 'Notification', user.id, `Sent notification to user ${user.id}`);
      return { recipients: 1, audience: 'USER' };
    }
    const role: Role | undefined = input.audience === 'EMPLOYERS' ? 'EMPLOYER' : input.audience === 'TECHNICIANS' ? 'EMPLOYEE' : undefined;
    const users = await this.prisma.user.findMany({ where: role ? { role } : { role: { not: 'ADMIN' } }, select: { id: true } });
    if (users.length) await this.prisma.notification.createMany({ data: users.map(({ id }) => ({ userId: id, title: input.title.trim(), message: input.body.trim(), type: input.type as any })) });
    await this.audit(actorId, 'CREATE', 'Notification', null, `Broadcast notification to ${input.audience || 'ALL'} (${users.length} users)`);
    return { recipients: users.length, audience: input.audience || 'ALL' };
  }
}
