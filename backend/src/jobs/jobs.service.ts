import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PackagesService } from '../packages/packages.service';
import { JobDto } from './dto/job.dto';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private packages: PackagesService,
  ) {}

  private async getProfile(userId: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
      select: { id: true, verificationStatus: true },
    });
    if (!profile) {
      throw new NotFoundException('Employer profile not found');
    }
    return profile;
  }

  private ensureApproved(status: string) {
    if (status !== 'APPROVED') {
      throw new ForbiddenException(
        'Only approved companies can post or publish jobs',
      );
    }
  }

  private checkSalary(dto: JobDto) {
    if (
      dto.salaryMin != null &&
      dto.salaryMax != null &&
      dto.salaryMin > dto.salaryMax
    ) {
      throw new BadRequestException(
        'Minimum salary cannot be higher than maximum salary',
      );
    }
  }

  // Every query below filters by employerProfileId, so an employer can only touch their own jobs
  private async findOwnJob(profileId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerProfileId: profileId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async create(userId: string, dto: JobDto) {
    const profile = await this.getProfile(userId);
    this.ensureApproved(profile.verificationStatus);
    this.checkSalary(dto);

    return this.prisma.job.create({
      data: { ...dto, employerProfileId: profile.id },
      select: { id: true, status: true },
    });
  }

  async list(userId: string) {
    const profile = await this.getProfile(userId);
    return this.prisma.job.findMany({
      where: { employerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        vacancies: true,
        experience: true,
        salaryMin: true,
        salaryMax: true,
        salaryNegotiable: true,
        city: true,
        state: true,
        workType: true,
        joiningPreference: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  }

  async summary(userId: string) {
    const profile = await this.getProfile(userId);
    const active = await this.prisma.job.count({
      where: { employerProfileId: profile.id, status: 'ACTIVE' },
    });
    return { active };
  }

  async getOne(userId: string, jobId: string) {
    const profile = await this.getProfile(userId);
    return this.findOwnJob(profile.id, jobId);
  }

  async update(userId: string, jobId: string, dto: JobDto) {
    const profile = await this.getProfile(userId);
    this.ensureApproved(profile.verificationStatus);
    this.checkSalary(dto);
    const job = await this.findOwnJob(profile.id, jobId);

    return this.prisma.job.update({
      where: { id: job.id },
      data: dto,
      select: { id: true, status: true },
    });
  }

   async setStatus(userId: string, jobId: string, status: 'ACTIVE' | 'CLOSED') {
    const profile = await this.getProfile(userId);
    const job = await this.findOwnJob(profile.id, jobId);

    if (status === 'ACTIVE') {
      this.ensureApproved(profile.verificationStatus);
      if (job.status === 'ACTIVE') {
        throw new BadRequestException('Job is already active');
      }
      // Reopening a closed job does not consume a new credit; only DRAFT -> ACTIVE does
      if (job.status === 'DRAFT') {
        await this.packages.consumeCredit(profile.id);
      }
      return this.prisma.job.update({
        where: { id: job.id },
        data: { status: 'ACTIVE', publishedAt: job.publishedAt ?? new Date() },
        select: { id: true, status: true },
      });
    }

    if (job.status !== 'ACTIVE') {
      throw new BadRequestException('Only active jobs can be closed');
    }
    return this.prisma.job.update({
      where: { id: job.id },
      data: { status: 'CLOSED' },
      select: { id: true, status: true },
    });
  }

  async remove(userId: string, jobId: string) {
    const profile = await this.getProfile(userId);
    const job = await this.findOwnJob(profile.id, jobId);

    if (job.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only draft jobs can be deleted. Close the job instead.',
      );
    }

    await this.prisma.job.delete({ where: { id: job.id } });
    return { deleted: true };
  }
}