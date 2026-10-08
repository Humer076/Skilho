import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ExperienceLevel,
  JoiningPreference,
  Prisma,
  WorkType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type JobSearchInput = {
  q?: string;
  category?: string;
  specialization?: string;
  experience?: string;
  joining?: string;
  workType?: string;
  location?: string;
  minSalary?: string;
  page?: string;
};

const PAGE_SIZE = 10;

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function isOneOf(value: string, list: object): boolean {
  return (Object.values(list) as string[]).includes(value);
}

@Injectable()
export class PublicJobsService {
  constructor(private prisma: PrismaService) {}

  // Public visibility rule: job must be ACTIVE and its company must be APPROVED
  private baseWhere(): Prisma.JobWhereInput {
    return {
      status: 'ACTIVE',
      employerProfile: { verificationStatus: 'APPROVED' },
    };
  }

  private buildWhere(input: JobSearchInput): Prisma.JobWhereInput {
    const and: Prisma.JobWhereInput[] = [];

    const category = clean(input.category, 60);
    if (category) {
      and.push({ category: { contains: category, mode: 'insensitive' } });
    }

    const q = clean(input.q, 100);
    if (q) {
      and.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          {
            employerProfile: {
              companyName: { contains: q, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    const location = clean(input.location, 80);
    if (location) {
      and.push({
        OR: [
          { city: { contains: location, mode: 'insensitive' } },
          { state: { contains: location, mode: 'insensitive' } },
        ],
      });
    }

    const specialization = clean(input.specialization, 60);
    if (specialization) {
      // A job for "Android & iPhone" should also show up for Android or iPhone searches
      const matches =
        specialization === 'Android' || specialization === 'iPhone'
          ? [specialization, 'Android & iPhone']
          : [specialization];
      and.push({ specializations: { hasSome: matches } });
    }

    const experience = clean(input.experience, 30);
    if (experience && isOneOf(experience, ExperienceLevel)) {
      and.push({ experience: experience as ExperienceLevel });
    }

    const joining = clean(input.joining, 40);
    if (joining && isOneOf(joining, JoiningPreference)) {
      and.push({ joiningPreference: joining as JoiningPreference });
    }

    const workType = clean(input.workType, 30);
    if (workType && isOneOf(workType, WorkType)) {
      and.push({ workType: workType as WorkType });
    }

    const minSalary = Math.floor(Number(clean(input.minSalary, 10)));
    if (Number.isFinite(minSalary) && minSalary > 0) {
      and.push({
        OR: [
          { salaryMax: { gte: minSalary } },
          { salaryMax: null, salaryMin: { gte: minSalary } },
        ],
      });
    }

    return { ...this.baseWhere(), AND: and };
  }

  async search(input: JobSearchInput) {
    const where = this.buildWhere(input);

    const requested = Number.parseInt(clean(input.page, 6) || '1', 10);
    const page =
      Number.isFinite(requested) && requested > 0
        ? Math.min(requested, 1000)
        : 1;

    const [total, jobs] = await this.prisma.$transaction([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          category: true,
          vacancies: true,
          specializations: true,
          experience: true,
          salaryMin: true,
          salaryMax: true,
          salaryNegotiable: true,
          city: true,
          state: true,
          workType: true,
          joiningPreference: true,
          publishedAt: true,
          createdAt: true,
          employerProfile: { select: { companyName: true } },
        },
      }),
    ]);

    const items = jobs.map((job) => {
      const { employerProfile, ...rest } = job;
      return {
        ...rest,
        company: { name: employerProfile.companyName, verified: true },
      };
    });

    return {
      items,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  }

  async getOne(id: string) {
    const job = await this.prisma.job.findFirst({
      where: { ...this.baseWhere(), id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        vacancies: true,
        specializations: true,
        experience: true,
        salaryMin: true,
        salaryMax: true,
        salaryNegotiable: true,
        city: true,
        state: true,
        workType: true,
        joiningPreference: true,
        workingHours: true,
        weeklyHolidays: true,
        accommodationProvided: true,
        foodProvided: true,
        travelAllowance: true,
        overtimeAvailable: true,
        requiredCertificates: true,
        interviewProcess: true,
        publishedAt: true,
        createdAt: true,
        employerProfile: {
          select: {
            companyName: true,
            city: true,
            state: true,
            description: true,
            technicianCount: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // No emails, phone numbers or documents are ever included here
    const { employerProfile, ...rest } = job;
    return {
      ...rest,
      company: {
        name: employerProfile.companyName,
        city: employerProfile.city,
        state: employerProfile.state,
        description: employerProfile.description,
        technicianCount: employerProfile.technicianCount,
        verified: true,
      },
    };
  }
}
