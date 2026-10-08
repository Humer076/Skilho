import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const EMPLOYER_SETTABLE: ApplicationStatus[] = [
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'SELECTED',
  'REJECTED',
  'HIRED',
];
const FINAL_STATUSES: ApplicationStatus[] = ['HIRED', 'REJECTED', 'WITHDRAWN'];

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async employerSummary(userId: string) {
    const rows = await this.prisma.jobApplication.groupBy({
      by: ['status'],
      where: { job: { employerProfile: { userId } } },
      _count: true,
    });

    const total = rows.reduce((sum, r) => sum + r._count, 0);
    const shortlisted =
      rows.find((r) => r.status === 'SHORTLISTED')?._count ?? 0;
    const hired = rows.find((r) => r.status === 'HIRED')?._count ?? 0;

    return { total, shortlisted, hired };
  }

  private ensureEmployeeProfile(userId: string) {
    return this.prisma.employeeProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  // ---- Employee side ----

  async apply(userId: string, jobId: string, coverNote?: string) {
    const profile = await this.ensureEmployeeProfile(userId);

    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        status: 'ACTIVE',
        employerProfile: { verificationStatus: 'APPROVED' },
      },
      select: {
        id: true,
        title: true,
        employerProfile: { select: { userId: true } },
      },
    });
    if (!job) {
      throw new NotFoundException('This job is not open for applications');
    }

    const existing = await this.prisma.jobApplication.findUnique({
      where: { jobId_employeeProfileId: { jobId, employeeProfileId: profile.id } },
    });

    if (existing && existing.status !== 'WITHDRAWN') {
      throw new BadRequestException('You have already applied to this job');
    }

    let result;
    if (existing) {
      result = await this.prisma.jobApplication.update({
        where: { id: existing.id },
        data: { status: 'APPLIED', coverNote: coverNote?.trim() || null },
        select: { id: true, status: true },
      });
    } else {
      result = await this.prisma.jobApplication.create({
        data: {
          jobId,
          employeeProfileId: profile.id,
          coverNote: coverNote?.trim() || null,
        },
        select: { id: true, status: true },
      });
    }

    await this.notifications.create(
      job.employerProfile.userId,
      'NEW_APPLICATION',
      `New application for "${job.title}"`,
      `/employer/jobs/${jobId}/applications`,
    );

    return result;
  }

  async myApplications(userId: string) {
    const profile = await this.ensureEmployeeProfile(userId);
    return this.prisma.jobApplication.findMany({
      where: { employeeProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        job: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            status: true,
            employerProfile: { select: { companyName: true } },
          },
        },
      },
    });
  }

  async withdraw(userId: string, applicationId: string) {
    const profile = await this.ensureEmployeeProfile(userId);
    const app = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, employeeProfileId: profile.id },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    if (FINAL_STATUSES.includes(app.status)) {
      throw new BadRequestException(
        'This application has already reached a final status and cannot be withdrawn',
      );
    }

    return this.prisma.jobApplication.update({
      where: { id: app.id },
      data: { status: 'WITHDRAWN' },
      select: { id: true, status: true },
    });
  }

  async saveJob(userId: string, jobId: string) {
    const profile = await this.ensureEmployeeProfile(userId);
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.prisma.savedJob.upsert({
      where: { jobId_employeeProfileId: { jobId, employeeProfileId: profile.id } },
      update: {},
      create: { jobId, employeeProfileId: profile.id },
    });
    return { saved: true };
  }

  async unsaveJob(userId: string, jobId: string) {
    const profile = await this.ensureEmployeeProfile(userId);
    await this.prisma.savedJob.deleteMany({
      where: { jobId, employeeProfileId: profile.id },
    });
    return { saved: false };
  }

  async mySavedJobs(userId: string) {
    const profile = await this.ensureEmployeeProfile(userId);
    const rows = await this.prisma.savedJob.findMany({
      where: { employeeProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      select: {
        job: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            status: true,
            salaryMin: true,
            salaryMax: true,
            salaryNegotiable: true,
            employerProfile: { select: { companyName: true } },
          },
        },
      },
    });
    return rows.map((r) => r.job);
  }

  // ---- Employer side ----

  private async ensureOwnJob(userId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerProfile: { userId } },
      select: { id: true },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async listForJob(userId: string, jobId: string) {
    await this.ensureOwnJob(userId, jobId);
    return this.prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        coverNote: true,
        createdAt: true,
        employeeProfile: {
          select: {
            id: true,
            fullName: true,
            professionalTitle: true,
            currentCity: true,
            currentState: true,
            totalExperienceMonths: true,
            photoStoredName: true,
            verified: true,
          },
        },
      },
    });
  }

  async changeStatus(
    userId: string,
    applicationId: string,
    status: ApplicationStatus,
  ) {
    if (!EMPLOYER_SETTABLE.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const app = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, job: { employerProfile: { userId } } },
      include: {
        job: { select: { title: true } },
        employeeProfile: { select: { userId: true } },
      },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    if (app.status === 'WITHDRAWN') {
      throw new BadRequestException(
        'The candidate withdrew this application',
      );
    }

    const result = await this.prisma.jobApplication.update({
      where: { id: app.id },
      data: { status },
      select: { id: true, status: true },
    });

    const label = status.replace(/_/g, ' ').toLowerCase();
    await this.notifications.create(
      app.employeeProfile.userId,
      'APPLICATION_STATUS_CHANGED',
      `Your application for "${app.job.title}" is now ${label}`,
      '/employee/applications',
    );

    return result;
  }
}