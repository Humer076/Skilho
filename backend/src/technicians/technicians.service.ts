import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PHOTO_DIR } from '../employee/photo.service';
import { PrismaService } from '../prisma/prisma.service';

// Which skills count towards each experience group on the profile page
const MOBILE_SKILLS = [
  'Mobile Hardware',
  'Mobile Software',
  'Android',
  'iPhone',
  'Charging Section',
  'Display & Touch',
  'Network / Baseband',
  'Water Damage',
];
const ANDROID_SKILLS = ['Android'];
const IPHONE_SKILLS = ['iPhone'];
const LAPTOP_SKILLS = [
  'Laptop Hardware',
  'Laptop Software',
  'MacBook Repair',
  'Windows Laptop Repair',
];

const LEVEL_RANK: Record<string, number> = {
  BEGINNER: 0,
  BASIC: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};

// Exactly the fields an employer may see. Nothing else is ever selected.
const VIEW = {
  select: {
    id: true,
    fullName: true,
    professionalTitle: true,
    currentCity: true,
    currentState: true,
    totalExperienceMonths: true,
    employmentStatus: true,
    expectedSalary: true,
    preferredLocation: true,
    noticePeriodDays: true,
    immediateJoining: true,
    photoStoredName: true,
    visibleToEmployers: true,
    shareContactDetails: true,
    verified: true,
    user: { select: { email: true, mobile: true } },
    skills: { select: { level: true, skill: { select: { name: true } } } },
    careerEntries: {
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        organization: true,
        position: true,
        stage: true,
        employmentType: true,
        startDate: true,
        endDate: true,
        location: true,
        skills: true,
        responsibilities: true,
        certificateObtained: true,
        description: true,
      },
    },
    education: {
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        institution: true,
        qualification: true,
        fieldOfStudy: true,
        startYear: true,
        endYear: true,
      },
    },
    certificates: {
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, issuer: true, issuedYear: true },
    },
  },
} satisfies Prisma.EmployeeProfileDefaultArgs;

type ViewProfile = Prisma.EmployeeProfileGetPayload<typeof VIEW>;

function monthIndex(d: Date) {
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

// Counts each calendar month once, so two overlapping jobs are not added twice
function experienceMonths(
  entries: { startDate: Date; endDate: Date | null; skills: string[] }[],
  names: string[],
) {
  const months = new Set<number>();
  const nowIndex = monthIndex(new Date());

  for (const entry of entries) {
    if (!entry.skills.some((s) => names.includes(s))) continue;
    const start = monthIndex(entry.startDate);
    const end = entry.endDate ? monthIndex(entry.endDate) : nowIndex;
    for (let i = start; i < end; i++) {
      months.add(i);
    }
  }

  return months.size;
}

@Injectable()
export class TechniciansService {
  constructor(private prisma: PrismaService) {}

  private async ensureApprovedEmployer(userId: string) {
    const company = await this.prisma.employerProfile.findUnique({
      where: { userId },
      select: { verificationStatus: true },
    });
    if (!company || company.verificationStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'Only approved companies can view technician profiles',
      );
    }
  }

  private buildView(profile: ViewProfile) {
    const entries = profile.careerEntries;

    const skills = profile.skills
      .map((s) => ({ name: s.skill.name, level: s.level }))
      .sort(
        (a, b) =>
          LEVEL_RANK[b.level] - LEVEL_RANK[a.level] ||
          a.name.localeCompare(b.name),
      );

    return {
      id: profile.id,
      fullName: profile.fullName ?? '',
      professionalTitle: profile.professionalTitle,
      hasPhoto: !!profile.photoStoredName,
      verified: profile.verified,
      city: profile.currentCity,
      state: profile.currentState,
      totalExperienceMonths: profile.totalExperienceMonths,
      employmentStatus: profile.employmentStatus,
      expectedSalary: profile.expectedSalary,
      preferredLocation: profile.preferredLocation,
      immediateJoining: profile.immediateJoining,
      noticePeriodDays: profile.noticePeriodDays,
      skills,
      experience: {
        mobile: experienceMonths(entries, MOBILE_SKILLS),
        android: experienceMonths(entries, ANDROID_SKILLS),
        iphone: experienceMonths(entries, IPHONE_SKILLS),
        laptop: experienceMonths(entries, LAPTOP_SKILLS),
      },
      career: entries,
      education: profile.education,
      certificates: profile.certificates,
      // Contact details leave the server only when the technician allowed it
      contactShared: profile.shareContactDetails,
      contact: profile.shareContactDetails
        ? { email: profile.user.email, mobile: profile.user.mobile }
        : null,
    };
  }

  async getEmployerView(userId: string, technicianId: string) {
    await this.ensureApprovedEmployer(userId);

    const profile = await this.prisma.employeeProfile.findFirst({
      where: {
        id: technicianId,
        visibleToEmployers: true,
        fullName: { not: null },
      },
      ...VIEW,
    });
    if (!profile) {
      throw new NotFoundException('Technician profile not available');
    }

    return this.buildView(profile);
  }

  async getEmployerViewPhoto(userId: string, technicianId: string) {
    await this.ensureApprovedEmployer(userId);

    const profile = await this.prisma.employeeProfile.findFirst({
      where: {
        id: technicianId,
        visibleToEmployers: true,
        fullName: { not: null },
        photoStoredName: { not: null },
      },
      select: { photoStoredName: true, photoMimeType: true },
    });
    if (!profile?.photoStoredName || !profile.photoMimeType) {
      throw new NotFoundException('Photo not available');
    }

    const filePath = path.join(PHOTO_DIR, profile.photoStoredName);
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('Photo is missing on the server');
    }

    return { filePath, mimeType: profile.photoMimeType };
  }

  // The technician sees the same view an employer would see, plus whether it is listed
  async getOwnPreview(userId: string) {
    const profile = await this.prisma.employeeProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
      ...VIEW,
    });

    return {
      ...this.buildView(profile),
      listing: {
        visibleToEmployers: profile.visibleToEmployers,
        hasName: !!profile.fullName,
      },
    };
  }
}