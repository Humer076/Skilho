import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CareerEntryDto } from './dto/career-entry.dto';
import { CertificateDto } from './dto/certificate.dto';
import { EducationDto } from './dto/education.dto';

const MAX_ENTRIES = 50;
const MAX_EDUCATION = 20;
const MAX_CERTIFICATES = 30;

function blankToNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class CareerService {
  constructor(private prisma: PrismaService) {}

  private ensureProfile(userId: string) {
    return this.prisma.employeeProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  private checkDates(startDate: string, endDate?: string | null) {
    const now = new Date();
    const start = new Date(startDate);

    if (start > now) {
      throw new BadRequestException('Start date cannot be in the future');
    }

    let end: Date | null = null;
    if (endDate) {
      end = new Date(endDate);
      if (end < start) {
        throw new BadRequestException('End date cannot be before the start date');
      }
      if (end > now) {
        throw new BadRequestException(
          'End date cannot be in the future. Leave it empty for your current position.',
        );
      }
    }

    return { start, end };
  }

  // Skills must come from the official skill list so employers can search them later
  private async checkSkills(names: string[]) {
    const unique = Array.from(new Set(names.map((n) => n.trim())));
    if (unique.length === 0) return unique;

    const found = await this.prisma.skill.count({
      where: { name: { in: unique }, active: true },
    });
    if (found !== unique.length) {
      throw new BadRequestException('One of the skills does not exist');
    }
    return unique;
  }

  private entryData(
    dto: CareerEntryDto,
    start: Date,
    end: Date | null,
    skills: string[],
  ) {
    return {
      organization: dto.organization.trim(),
      position: dto.position.trim(),
      stage: dto.stage,
      employmentType: dto.employmentType,
      startDate: start,
      endDate: end,
      location: blankToNull(dto.location),
      skills,
      responsibilities: blankToNull(dto.responsibilities),
      certificateObtained: blankToNull(dto.certificateObtained),
      description: blankToNull(dto.description),
    };
  }

  async getAll(userId: string) {
    const profile = await this.ensureProfile(userId);
    const where = { employeeProfileId: profile.id };

    const [entries, education, certificates] = await Promise.all([
      this.prisma.careerEntry.findMany({
        where,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.education.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.certificate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { entries, education, certificates };
  }

  async createEntry(userId: string, dto: CareerEntryDto) {
    const profile = await this.ensureProfile(userId);

    const count = await this.prisma.careerEntry.count({
      where: { employeeProfileId: profile.id },
    });
    if (count >= MAX_ENTRIES) {
      throw new BadRequestException(`Entry limit reached (${MAX_ENTRIES})`);
    }

    const { start, end } = this.checkDates(dto.startDate, dto.endDate);
    const skills = await this.checkSkills(dto.skills);

    return this.prisma.careerEntry.create({
      data: {
        employeeProfileId: profile.id,
        ...this.entryData(dto, start, end, skills),
      },
      select: { id: true },
    });
  }

  // Every lookup includes employeeProfileId, so nobody can touch another person's entries
  async updateEntry(userId: string, entryId: string, dto: CareerEntryDto) {
    const profile = await this.ensureProfile(userId);

    const entry = await this.prisma.careerEntry.findFirst({
      where: { id: entryId, employeeProfileId: profile.id },
      select: { id: true },
    });
    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    const { start, end } = this.checkDates(dto.startDate, dto.endDate);
    const skills = await this.checkSkills(dto.skills);

    return this.prisma.careerEntry.update({
      where: { id: entry.id },
      data: this.entryData(dto, start, end, skills),
      select: { id: true },
    });
  }

  async removeEntry(userId: string, entryId: string) {
    const profile = await this.ensureProfile(userId);

    const entry = await this.prisma.careerEntry.findFirst({
      where: { id: entryId, employeeProfileId: profile.id },
      select: { id: true },
    });
    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    await this.prisma.careerEntry.delete({ where: { id: entry.id } });
    return { deleted: true };
  }

  async addEducation(userId: string, dto: EducationDto) {
    const profile = await this.ensureProfile(userId);

    const count = await this.prisma.education.count({
      where: { employeeProfileId: profile.id },
    });
    if (count >= MAX_EDUCATION) {
      throw new BadRequestException(`Education limit reached (${MAX_EDUCATION})`);
    }

    const thisYear = new Date().getFullYear();
    if (dto.startYear != null && dto.startYear > thisYear) {
      throw new BadRequestException('Start year cannot be in the future');
    }
    if (
      dto.startYear != null &&
      dto.endYear != null &&
      dto.endYear < dto.startYear
    ) {
      throw new BadRequestException('End year cannot be before the start year');
    }
    if (dto.endYear != null && dto.endYear > thisYear + 8) {
      throw new BadRequestException('End year is too far in the future');
    }

    return this.prisma.education.create({
      data: {
        employeeProfileId: profile.id,
        institution: dto.institution.trim(),
        qualification: dto.qualification.trim(),
        fieldOfStudy: blankToNull(dto.fieldOfStudy),
        startYear: dto.startYear ?? null,
        endYear: dto.endYear ?? null,
      },
      select: { id: true },
    });
  }

  async removeEducation(userId: string, id: string) {
    const profile = await this.ensureProfile(userId);

    const row = await this.prisma.education.findFirst({
      where: { id, employeeProfileId: profile.id },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException('Education entry not found');
    }

    await this.prisma.education.delete({ where: { id: row.id } });
    return { deleted: true };
  }

  async addCertificate(userId: string, dto: CertificateDto) {
    const profile = await this.ensureProfile(userId);

    const count = await this.prisma.certificate.count({
      where: { employeeProfileId: profile.id },
    });
    if (count >= MAX_CERTIFICATES) {
      throw new BadRequestException(
        `Certificate limit reached (${MAX_CERTIFICATES})`,
      );
    }

    if (dto.issuedYear != null && dto.issuedYear > new Date().getFullYear()) {
      throw new BadRequestException('Year cannot be in the future');
    }

    return this.prisma.certificate.create({
      data: {
        employeeProfileId: profile.id,
        name: dto.name.trim(),
        issuer: blankToNull(dto.issuer),
        issuedYear: dto.issuedYear ?? null,
      },
      select: { id: true },
    });
  }

  async removeCertificate(userId: string, id: string) {
    const profile = await this.ensureProfile(userId);

    const row = await this.prisma.certificate.findFirst({
      where: { id, employeeProfileId: profile.id },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException('Certificate not found');
    }

    await this.prisma.certificate.delete({ where: { id: row.id } });
    return { deleted: true };
  }
}