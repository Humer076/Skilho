import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  // ---- Public/employer: list available packages ----

  async listActive() {
    return this.prisma.package.findMany({
      where: { active: true },
      orderBy: { priceRupees: 'asc' },
    });
  }

  async findEmployerProfileId(userId: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException('Employer profile not found');
    }
    return profile.id;
  }
  async myActiveSubscription(userId: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException('Employer profile not found');
    }

    return this.prisma.subscription.findFirst({
      where: {
        employerProfileId: profile.id,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: { package: true },
    });
  }

  // ---- Admin: manage packages ----

  async adminList() {
    return this.prisma.package.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async adminCreate(data: {
    name: string;
    tier: string;
    priceRupees: number;
    durationDays: number;
    jobCredits: number;
    featuredJobs: boolean;
    advancedSearch: boolean;
    priorityListing: boolean;
  }) {
    return this.prisma.package.create({ data: data as any });
  }

  async adminUpdate(
    id: string,
    data: Partial<{
      name: string;
      priceRupees: number;
      durationDays: number;
      jobCredits: number;
      featuredJobs: boolean;
      advancedSearch: boolean;
      priorityListing: boolean;
      active: boolean;
    }>,
  ) {
    const pkg = await this.prisma.package.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Package not found');
    return this.prisma.package.update({ where: { id }, data });
  }

  // Called after a successful (verified) payment — never directly by the employer
  async activateSubscription(employerProfileId: string, packageId: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id: packageId },
    });
    if (!pkg || !pkg.active) {
      throw new BadRequestException('Package not available');
    }

    const expiresAt = new Date(
      Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000,
    );

    // Any existing active subscription is superseded
    await this.prisma.subscription.updateMany({
      where: { employerProfileId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    return this.prisma.subscription.create({
      data: {
        employerProfileId,
        packageId,
        jobCreditsLeft: pkg.jobCredits,
        expiresAt,
      },
      include: { package: true },
    });
  }

  // Called by JobsService before allowing a job to be published
  async consumeCredit(employerProfileId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        employerProfileId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub || sub.jobCreditsLeft <= 0) {
      throw new ForbiddenException(
        'No job posting credits left. Please purchase or renew a package.',
      );
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { jobCreditsLeft: { decrement: 1 } },
    });
  }
}