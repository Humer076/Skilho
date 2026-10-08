import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type TechnicianSearchInput = {
  q?: string;
  skill?: string;
  minYears?: string;
  location?: string;
  maxSalary?: string;
  availability?: string;
  page?: string;
};

const PAGE_SIZE = 10;

const LEVEL_RANK: Record<string, number> = {
  BEGINNER: 0,
  BASIC: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

@Injectable()
export class TechnicianSearchService {
  constructor(private prisma: PrismaService) {}

  private async ensureApprovedEmployer(userId: string) {
    const company = await this.prisma.employerProfile.findUnique({
      where: { userId },
      select: { verificationStatus: true },
    });
    if (!company || company.verificationStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'Only approved companies can search technicians',
      );
    }
  }

  // A technician is listed only if they have a name and have not hidden their profile
  private buildWhere(
    input: TechnicianSearchInput,
  ): Prisma.EmployeeProfileWhereInput {
    const and: Prisma.EmployeeProfileWhereInput[] = [];

    const q = clean(input.q, 100);
    if (q) {
      and.push({
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { professionalTitle: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const location = clean(input.location, 80);
    if (location) {
      and.push({
        OR: [
          { currentCity: { contains: location, mode: 'insensitive' } },
          { currentState: { contains: location, mode: 'insensitive' } },
          { preferredLocation: { contains: location, mode: 'insensitive' } },
        ],
      });
    }

    const skill = clean(input.skill, 60);
    if (skill) {
      and.push({ skills: { some: { skill: { name: skill } } } });
    }

    const minYears = Number(clean(input.minYears, 3));
    if (Number.isFinite(minYears) && minYears > 0 && minYears <= 60) {
      and.push({ totalExperienceMonths: { gte: Math.floor(minYears * 12) } });
    }

    // Technicians who did not state an expected salary do not match this filter
    const maxSalary = Math.floor(Number(clean(input.maxSalary, 9)));
    if (Number.isFinite(maxSalary) && maxSalary > 0) {
      and.push({ expectedSalary: { lte: maxSalary } });
    }

    const availability = clean(input.availability, 20);
    if (availability === 'immediate') {
      and.push({ immediateJoining: true });
    } else if (availability === 'within30') {
      and.push({
        OR: [{ immediateJoining: true }, { noticePeriodDays: { lte: 30 } }],
      });
    }

    return {
      visibleToEmployers: true,
      fullName: { not: null },
      AND: and,
    };
  }

  async skillOptions(userId: string) {
    await this.ensureApprovedEmployer(userId);
    const skills = await this.prisma.skill.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return skills.map((s) => s.name);
  }

  async search(userId: string, input: TechnicianSearchInput) {
    await this.ensureApprovedEmployer(userId);

    const where = this.buildWhere(input);

    const requested = Number.parseInt(clean(input.page, 6) || '1', 10);
    const page =
      Number.isFinite(requested) && requested > 0
        ? Math.min(requested, 1000)
        : 1;

    // Only these fields are selected, so contact details can never leak into results
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.employeeProfile.count({ where }),
      this.prisma.employeeProfile.findMany({
        where,
        orderBy: [{ verified: 'desc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          fullName: true,
          professionalTitle: true,
          currentCity: true,
          currentState: true,
          totalExperienceMonths: true,
          expectedSalary: true,
          immediateJoining: true,
          noticePeriodDays: true,
          photoStoredName: true,
          verified: true,
          skills: {
            select: { level: true, skill: { select: { name: true } } },
          },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      fullName: row.fullName ?? '',
      professionalTitle: row.professionalTitle,
      hasPhoto: !!row.photoStoredName,
      verified: row.verified,
      city: row.currentCity,
      state: row.currentState,
      totalExperienceMonths: row.totalExperienceMonths,
      expectedSalary: row.expectedSalary,
      immediateJoining: row.immediateJoining,
      noticePeriodDays: row.noticePeriodDays,
      skills: row.skills
        .map((s) => ({ name: s.skill.name, level: s.level }))
        .sort(
          (a, b) =>
            LEVEL_RANK[b.level] - LEVEL_RANK[a.level] ||
            a.name.localeCompare(b.name),
        )
        .slice(0, 5),
    }));

    return {
      items,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  }
}