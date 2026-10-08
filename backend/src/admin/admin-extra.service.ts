import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

const PAGE_SIZE = 20;
const JOB_STATUSES = ['DRAFT', 'ACTIVE', 'CLOSED'];
const APP_STATUSES = [
  'APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED',
  'SELECTED', 'REJECTED', 'WITHDRAWN', 'HIRED',
];
const VERIFICATION_STATUSES = Object.values(VerificationStatus) as string[];

@Injectable()
export class AdminExtraService {
  constructor(private prisma: PrismaService) {}

  private paging(page?: string) {
    const p = Math.max(parseInt(page || '1', 10) || 1, 1);
    return { p, skip: (p - 1) * PAGE_SIZE, take: PAGE_SIZE };
  }

  private pack<T>(items: T[], total: number, p: number) {
    return { items, total, page: p, totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1) };
  }

  /* ---------- Users ---------- */
  async users(q?: string, role?: string, page?: string) {
    const { p, skip, take } = this.paging(page);
    const term = q?.trim();
    const roleFilter: Prisma.UserWhereInput['role'] =
      role === 'EMPLOYEE' ? 'EMPLOYEE' : role === 'EMPLOYER' ? 'EMPLOYER' : { not: 'ADMIN' };
    const where: Prisma.UserWhereInput = {
      role: roleFilter,
      ...(term
        ? {
            OR: [
              { email: { contains: term, mode: 'insensitive' } },
              { mobile: { contains: term } },
              { employeeProfile: { is: { fullName: { contains: term, mode: 'insensitive' } } } },
              { employerProfile: { is: { companyName: { contains: term, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take,
        select: {
          id: true, email: true, mobile: true, role: true, createdAt: true,
          employeeProfile: { select: { fullName: true } },
          employerProfile: { select: { companyName: true } },
        },
      }),
    ]);
    return this.pack(
      rows.map((u) => ({
        id: u.id,
        name: u.employeeProfile?.fullName || u.employerProfile?.companyName || 'Not provided',
        email: u.email, mobile: u.mobile, role: u.role, createdAt: u.createdAt,
      })),
      total, p,
    );
  }

  /* ---------- Technicians ---------- */
  async technicians(q?: string, page?: string) {
    const { p, skip, take } = this.paging(page);
    const term = q?.trim();
    const where: Prisma.EmployeeProfileWhereInput = term
      ? {
          OR: [
            { fullName: { contains: term, mode: 'insensitive' } },
            { professionalTitle: { contains: term, mode: 'insensitive' } },
            { currentCity: { contains: term, mode: 'insensitive' } },
            { user: { email: { contains: term, mode: 'insensitive' } } },
            { user: { mobile: { contains: term } } },
          ],
        }
      : {};
    const [total, items] = await Promise.all([
      this.prisma.employeeProfile.count({ where }),
      this.prisma.employeeProfile.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take,
        select: {
          id: true, fullName: true, professionalTitle: true, currentCity: true,
          currentState: true, totalExperienceMonths: true, verified: true, createdAt: true,
          user: { select: { email: true, mobile: true } },
          _count: { select: { skills: true, applications: true } },
        },
      }),
    ]);
    return this.pack(items, total, p);
  }

  async setTechnicianVerified(id: string, verified: boolean) {
    const found = await this.prisma.employeeProfile.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Technician not found');
    await this.prisma.employeeProfile.update({ where: { id }, data: { verified } });
    return { verified };
  }

  /* ---------- Employers ---------- */
  async employers(q?: string, status?: string, page?: string) {
    const { p, skip, take } = this.paging(page);
    const term = q?.trim();
    const where: Prisma.EmployerProfileWhereInput = {
      ...(status && VERIFICATION_STATUSES.includes(status)
        ? { verificationStatus: status as VerificationStatus }
        : {}),
      ...(term
        ? {
            OR: [
              { companyName: { contains: term, mode: 'insensitive' } },
              { city: { contains: term, mode: 'insensitive' } },
              { user: { email: { contains: term, mode: 'insensitive' } } },
              { user: { mobile: { contains: term } } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.employerProfile.count({ where }),
      this.prisma.employerProfile.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take,
        select: {
          id: true, companyName: true, city: true, state: true,
          verificationStatus: true, createdAt: true,
          user: { select: { email: true, mobile: true } },
          _count: { select: { jobs: true, documents: true } },
        },
      }),
    ]);
    return this.pack(items, total, p);
  }

  /* ---------- Jobs ---------- */
  async jobs(q?: string, status?: string, page?: string) {
    const { p, skip, take } = this.paging(page);
    const term = q?.trim();
    const where: Prisma.JobWhereInput = {
      ...(status && JOB_STATUSES.includes(status) ? { status: status as any } : {}),
      ...(term
        ? {
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { category: { contains: term, mode: 'insensitive' } },
              { employerProfile: { companyName: { contains: term, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take,
        select: {
          id: true, title: true, category: true, city: true, state: true,
          status: true, vacancies: true, createdAt: true,
          employerProfile: { select: { companyName: true } },
          _count: { select: { applications: true } },
        },
      }),
    ]);
    return this.pack(items, total, p);
  }

  async setJobStatus(id: string, status: string) {
    if (status !== 'ACTIVE' && status !== 'CLOSED') throw new BadRequestException('Invalid status');
    const job = await this.prisma.job.findUnique({ where: { id }, select: { id: true, publishedAt: true } });
    if (!job) throw new NotFoundException('Job not found');
    await this.prisma.job.update({
      where: { id },
      data: {
        status,
        ...(status === 'ACTIVE' && !job.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });
    return { status };
  }

  /* ---------- Applications ---------- */
  async applications(q?: string, status?: string, page?: string) {
    const { p, skip, take } = this.paging(page);
    const term = q?.trim();
    const where: Prisma.JobApplicationWhereInput = {
      ...(status && APP_STATUSES.includes(status) ? { status: status as any } : {}),
      ...(term
        ? {
            OR: [
              { job: { title: { contains: term, mode: 'insensitive' } } },
              { job: { employerProfile: { companyName: { contains: term, mode: 'insensitive' } } } },
              { employeeProfile: { fullName: { contains: term, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.jobApplication.count({ where }),
      this.prisma.jobApplication.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take,
        select: {
          id: true, status: true, createdAt: true,
          job: { select: { title: true, employerProfile: { select: { companyName: true } } } },
          employeeProfile: { select: { fullName: true } },
        },
      }),
    ]);
    return this.pack(
      rows.map((a) => ({
        id: a.id, status: a.status, createdAt: a.createdAt,
        jobTitle: a.job.title,
        company: a.job.employerProfile.companyName,
        applicant: a.employeeProfile.fullName || 'Not provided',
      })),
      total, p,
    );
  }

  /* ---------- Skills ---------- */
  async skills(q?: string, page?: string) {
    const { p, skip, take } = this.paging(page);
    const term = q?.trim();
    const where: Prisma.SkillWhereInput = term ? { name: { contains: term, mode: 'insensitive' } } : {};
    const [total, items] = await Promise.all([
      this.prisma.skill.count({ where }),
      this.prisma.skill.findMany({
        where, orderBy: { name: 'asc' }, skip, take,
        select: { id: true, name: true, active: true, createdAt: true, _count: { select: { employees: true } } },
      }),
    ]);
    return this.pack(items, total, p);
  }

  async addSkill(name: string) {
    const clean = name.trim();
    if (clean.length < 2) throw new BadRequestException('Skill name is too short');
    const exists = await this.prisma.skill.findFirst({
      where: { name: { equals: clean, mode: 'insensitive' } },
      select: { id: true },
    });
    if (exists) throw new BadRequestException('This skill already exists');
    return this.prisma.skill.create({ data: { name: clean }, select: { id: true, name: true } });
  }

  async setSkillActive(id: string, active: boolean) {
    const found = await this.prisma.skill.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Skill not found');
    await this.prisma.skill.update({ where: { id }, data: { active } });
    return { active };
  }

  /* ---------- Career journey ---------- */
  async career(q?: string, page?: string) {
    const { p, skip, take } = this.paging(page);
    const term = q?.trim();
    const where: Prisma.CareerEntryWhereInput = term
      ? {
          OR: [
            { organization: { contains: term, mode: 'insensitive' } },
            { position: { contains: term, mode: 'insensitive' } },
            { employeeProfile: { fullName: { contains: term, mode: 'insensitive' } } },
          ],
        }
      : {};
    const [total, items] = await Promise.all([
      this.prisma.careerEntry.count({ where }),
      this.prisma.careerEntry.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take,
        select: {
          id: true, organization: true, position: true, stage: true, employmentType: true,
          startDate: true, endDate: true, location: true,
          employeeProfile: { select: { fullName: true } },
        },
      }),
    ]);
    return this.pack(items, total, p);
  }

  /* ---------- Reports ---------- */
  async reports() {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i;
      const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
      return { start, end, label: start.toLocaleString('en-US', { month: 'short', year: '2-digit' }) };
    });

    const [verification, applications, jobs, topSkills, signups, verifiedTechnicians, activeSubscriptions] =
      await Promise.all([
        this.prisma.employerProfile.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
        this.prisma.jobApplication.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.job.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.skill.findMany({
          orderBy: { employees: { _count: 'desc' } },
          take: 8,
          select: { name: true, _count: { select: { employees: true } } },
        }),
        Promise.all(
          months.map((m) =>
            this.prisma.user.count({
              where: { role: { not: 'ADMIN' }, createdAt: { gte: m.start, lt: m.end } },
            }),
          ),
        ),
        this.prisma.employeeProfile.count({ where: { verified: true } }),
        this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      ]);

    return {
      verificationStatus: verification.map((r) => ({ name: r.verificationStatus, count: r._count._all })),
      applicationStatus: applications.map((r) => ({ name: r.status, count: r._count._all })),
      jobStatus: jobs.map((r) => ({ name: r.status, count: r._count._all })),
      topSkills: topSkills.map((s) => ({ name: s.name, count: s._count.employees })),
      signups: months.map((m, i) => ({ name: m.label, count: signups[i] })),
      verifiedTechnicians,
      activeSubscriptions,
    };
  }

  /* ---------- Settings ---------- */
  async me(adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { email: true, mobile: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('Account not found');
    return user;
  }

  async changePassword(adminId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!user) throw new NotFoundException('Account not found');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Current password is wrong');
    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from the current one');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: adminId }, data: { passwordHash } });
    return { changed: true };
  }
}