import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Called internally by other services (applications, admin) — not exposed as an API route
  async create(
    userId: string,
    type: NotificationType,
    message: string,
    link?: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, message, link: link ?? null },
    });
  }

  async list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notif) {
      throw new NotFoundException('Notification not found');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { done: true };
  }
}