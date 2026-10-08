import { Controller, Get, Injectable, UseGuards } from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from './admin.guard';

const WAITING: VerificationStatus[] = [
  'REGISTRATION_SUBMITTED',
  'PENDING_VERIFICATION',
  'UNDER_REVIEW',
];

@Injectable()
export class AdminNotificationsService {
  constructor(private prisma: PrismaService) {}

  /** Companies that are waiting for the admin, newest activity first. */
  async companiesNeedingReview() {
    const [pendingCount, companies] = await Promise.all([
      this.prisma.employerProfile.count({
        where: { verificationStatus: { in: WAITING } },
      }),
      this.prisma.employerProfile.findMany({
        where: { verificationStatus: { in: WAITING } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          companyName: true,
          city: true,
          verificationStatus: true,
          createdAt: true,
          documents: {
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          },
        },
      }),
    ]);

    const items = companies
      .map((c) => {
        const lastDoc = c.documents[0]?.createdAt;
        const activityAt =
          lastDoc && lastDoc > c.createdAt ? lastDoc : c.createdAt;
        return {
          id: c.id,
          companyName: c.companyName,
          city: c.city,
          verificationStatus: c.verificationStatus,
          documentCount: c.documents.length,
          activityAt,
        };
      })
      .sort((a, b) => b.activityAt.getTime() - a.activityAt.getTime())
      .slice(0, 8);

    return { pendingCount, items };
  }
}

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminNotificationsController {
  constructor(private notifications: AdminNotificationsService) {}

  @Get()
  list() {
    return this.notifications.companiesNeedingReview();
  }
}