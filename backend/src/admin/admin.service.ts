import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'company-documents');
const ALL_STATUSES = Object.values(VerificationStatus) as string[];
const ADMIN_SETTABLE = [
  'PENDING_VERIFICATION',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
];
const NOTE_REQUIRED = ['REJECTED', 'SUSPENDED'];

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(identifier: string, password: string) {
    // Only ADMIN accounts can log in here
    const user = await this.prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        OR: [{ email: identifier }, { mobile: identifier }],
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return {
      token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async getDashboard() {
    const DAY = 24 * 60 * 60 * 1000;
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * DAY);
    const d60 = new Date(now.getTime() - 60 * DAY);

    const notAdmin = { role: { not: 'ADMIN' as const } };
    const pendingStatuses: VerificationStatus[] = [
      'REGISTRATION_SUBMITTED',
      'PENDING_VERIFICATION',
      'UNDER_REVIEW',
    ];

    // Last 30 days vs the 30 days before that
    const cur = { createdAt: { gte: d30 } };
    const prev = { createdAt: { gte: d60, lt: d30 } };
    const change = (c: number, p: number) =>
      p > 0 ? Math.round(((c - p) / p) * 100) : null;

    // Month-end boundaries for the last 6 months (for the growth chart)
    const months = Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i;
      const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
      return {
        end,
        label: start.toLocaleString('en-US', { month: 'short' }),
      };
    });

    const [
      totalUsers, usersCur, usersPrev,
      technicians, techCur, techPrev,
      employers, empCur, empPrev,
      activeJobs, jobsCur, jobsPrev,
      applications, appsCur, appsPrev,
      pendingCount,
      growthCounts,
      categoryGroups,
      recentUsers,
      pendingCompanies,
      recentApplications,
    ] = await Promise.all([
      this.prisma.user.count({ where: notAdmin }),
      this.prisma.user.count({ where: { ...notAdmin, ...cur } }),
      this.prisma.user.count({ where: { ...notAdmin, ...prev } }),

      this.prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      this.prisma.user.count({ where: { role: 'EMPLOYEE', ...cur } }),
      this.prisma.user.count({ where: { role: 'EMPLOYEE', ...prev } }),

      this.prisma.user.count({ where: { role: 'EMPLOYER' } }),
      this.prisma.user.count({ where: { role: 'EMPLOYER', ...cur } }),
      this.prisma.user.count({ where: { role: 'EMPLOYER', ...prev } }),

      this.prisma.job.count({ where: { status: 'ACTIVE' } }),
      this.prisma.job.count({ where: { status: 'ACTIVE', ...cur } }),
      this.prisma.job.count({ where: { status: 'ACTIVE', ...prev } }),

      this.prisma.jobApplication.count(),
      this.prisma.jobApplication.count({ where: cur }),
      this.prisma.jobApplication.count({ where: prev }),

      this.prisma.employerProfile.count({
        where: { verificationStatus: { in: pendingStatuses } },
      }),

      Promise.all(
        months.map((m) =>
          this.prisma.user.count({
            where: { ...notAdmin, createdAt: { lt: m.end } },
          }),
        ),
      ),

      this.prisma.job.groupBy({
        by: ['category'],
        where: { status: 'ACTIVE' },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 6,
      }),

      this.prisma.user.findMany({
        where: notAdmin,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          mobile: true,
          role: true,
          createdAt: true,
          employeeProfile: { select: { fullName: true } },
          employerProfile: { select: { companyName: true } },
        },
      }),

      this.prisma.employerProfile.findMany({
        where: { verificationStatus: { in: pendingStatuses } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          companyName: true,
          companyType: true,
          city: true,
          verificationStatus: true,
          createdAt: true,
        },
      }),

      this.prisma.jobApplication.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          createdAt: true,
          job: { select: { title: true } },
          employeeProfile: { select: { fullName: true } },
        },
      }),
    ]);

    return {
      stats: {
        totalUsers: { value: totalUsers, change: change(usersCur, usersPrev) },
        technicians: { value: technicians, change: change(techCur, techPrev) },
        employers: { value: employers, change: change(empCur, empPrev) },
        activeJobs: { value: activeJobs, change: change(jobsCur, jobsPrev) },
        applications: { value: applications, change: change(appsCur, appsPrev) },
        pendingVerifications: pendingCount,
      },
      userGrowth: months.map((m, i) => ({ month: m.label, total: growthCounts[i] })),
      distribution: { technicians, employers },
      jobCategories: categoryGroups.map((g) => ({
        name: g.category,
        count: g._count.category,
      })),
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name:
          u.employeeProfile?.fullName ||
          u.employerProfile?.companyName ||
          u.email ||
          u.mobile ||
          'Unnamed',
        contact: u.email || u.mobile || '',
        role: u.role,
        createdAt: u.createdAt,
      })),
      pendingCompanies,
      recentApplications: recentApplications.map((a) => ({
        id: a.id,
        jobTitle: a.job.title,
        applicant: a.employeeProfile.fullName || 'Not provided',
        status: a.status,
        createdAt: a.createdAt,
      })),
    };
  }

  async listEmployers(status?: string) {
    if (status && !ALL_STATUSES.includes(status)) {
      throw new BadRequestException('Invalid status filter');
    }

    return this.prisma.employerProfile.findMany({
      where: status
        ? { verificationStatus: status as VerificationStatus }
        : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        city: true,
        state: true,
        verificationStatus: true,
        createdAt: true,
        user: { select: { email: true, mobile: true } },
        _count: { select: { documents: true } },
      },
    });
  }

  async getEmployer(id: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, mobile: true } },
        documents: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
        events: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!profile) {
      throw new NotFoundException('Company not found');
    }
    return profile;
  }

  async changeStatus(
    adminId: string,
    id: string,
    status: string,
    note?: string,
  ) {
    if (!ADMIN_SETTABLE.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const cleanNote = note?.trim() || null;
    if (NOTE_REQUIRED.includes(status) && !cleanNote) {
      throw new BadRequestException('A reason is required for this action');
    }

    const profile = await this.prisma.employerProfile.findUnique({
      where: { id },
      select: {
        id: true,
        verificationStatus: true,
        _count: { select: { documents: true } },
      },
    });
    if (!profile) {
      throw new NotFoundException('Company not found');
    }
    if (profile.verificationStatus === status) {
      throw new BadRequestException('Company already has this status');
    }
    if (status === 'APPROVED' && profile._count.documents === 0) {
      throw new BadRequestException(
        'Cannot approve a company that has not uploaded any documents',
      );
    }

    const newStatus = status as VerificationStatus;

    await this.prisma.$transaction([
      this.prisma.employerProfile.update({
        where: { id },
        data: { verificationStatus: newStatus },
      }),
      this.prisma.verificationEvent.create({
        data: {
          employerProfileId: id,
          adminId,
          action: 'STATUS_CHANGE',
          fromStatus: profile.verificationStatus,
          toStatus: newStatus,
          note: cleanNote,
          visibleToEmployer: status === 'REJECTED' || status === 'SUSPENDED',
        },
      }),
    ]);

    return { status: newStatus };
  }

  async addNote(adminId: string, id: string, note: string) {
    const cleanNote = note.trim();
    if (!cleanNote) {
      throw new BadRequestException('Note cannot be empty');
    }
    await this.requireProfile(id);

    await this.prisma.verificationEvent.create({
      data: {
        employerProfileId: id,
        adminId,
        action: 'NOTE',
        note: cleanNote,
        visibleToEmployer: false, // internal note, employers never see it
      },
    });
    return { saved: true };
  }

  async requestDocuments(adminId: string, id: string, note: string) {
    const cleanNote = note.trim();
    if (!cleanNote) {
      throw new BadRequestException('Tell the employer which documents you need');
    }
    await this.requireProfile(id);

    await this.prisma.verificationEvent.create({
      data: {
        employerProfileId: id,
        adminId,
        action: 'DOCUMENT_REQUEST',
        note: cleanNote,
        visibleToEmployer: true,
      },
    });
    return { saved: true };
  }

  async getDocumentFile(documentId: string) {
    const doc = await this.prisma.companyDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const filePath = path.join(STORAGE_DIR, doc.storedName);
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('File is missing on the server');
    }

    return { doc, filePath };
  }

  private async requireProfile(id: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException('Company not found');
    }
  }
}