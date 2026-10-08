import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveSkillsDto } from './dto/save-skills.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';

// The skill list from Section 10 of the requirements document
const DEFAULT_SKILLS = [
  'Mobile Hardware',
  'Mobile Software',
  'Android',
  'iPhone',
  'Motherboard Repair',
  'IC-Level Repair',
  'Microsoldering',
  'Charging Section',
  'Display & Touch',
  'Network / Baseband',
  'Water Damage',
  'Laptop Hardware',
  'Laptop Software',
  'Chip-Level Repair',
  'BIOS Programming',
  'MacBook Repair',
  'Windows Laptop Repair',
];

@Injectable()
export class EmployeeService implements OnModuleInit {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(private prisma: PrismaService) {}

  // Adds the default skills once. Skills that already exist are skipped.
  async onModuleInit() {
    try {
      await this.prisma.skill.createMany({
        data: DEFAULT_SKILLS.map((name) => ({ name })),
        skipDuplicates: true,
      });
    } catch (err) {
      this.logger.warn(
        'Could not add default skills. Did you run the database migration?',
      );
    }
  }

  // Employees registered before the profile existed get one on first use
  private ensureProfile(userId: string) {
    return this.prisma.employeeProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.ensureProfile(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mobile: true },
    });

    // The internal photo file name is never sent to the browser
    const { photoStoredName, photoMimeType, ...rest } = profile;
    void photoMimeType;

    return {
      ...rest,
      hasPhoto: !!photoStoredName,
      email: user?.email ?? null,
      mobile: user?.mobile ?? null,
    };
  }

  async updateProfile(userId: string, dto: UpdateEmployeeProfileDto) {
    await this.ensureProfile(userId);
    await this.prisma.employeeProfile.update({
      where: { userId },
      data: dto,
    });
    return { saved: true };
  }

  async updatePrivacy(
    userId: string,
    dto: { visibleToEmployers: boolean; shareContactDetails: boolean },
  ) {
    await this.ensureProfile(userId);
    return this.prisma.employeeProfile.update({
      where: { userId },
      data: {
        visibleToEmployers: dto.visibleToEmployers,
        shareContactDetails: dto.shareContactDetails,
      },
      select: { visibleToEmployers: true, shareContactDetails: true },
    });
  }

  async getSkills(userId: string) {
    const profile = await this.ensureProfile(userId);

    const [catalog, mine] = await Promise.all([
      this.prisma.skill.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.employeeSkill.findMany({
        where: { employeeProfileId: profile.id },
        select: { skillId: true, level: true },
      }),
    ]);

    return { catalog, mine };
  }

  // Replaces the whole skill set in one step, so the saved list always matches the screen
  async saveSkills(userId: string, dto: SaveSkillsDto) {
    const ids = dto.skills.map((s) => s.skillId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('A skill was selected twice');
    }

    const known = await this.prisma.skill.count({
      where: { id: { in: ids }, active: true },
    });
    if (known !== ids.length) {
      throw new BadRequestException('One of the skills does not exist');
    }

    const profile = await this.ensureProfile(userId);

    await this.prisma.$transaction([
      this.prisma.employeeSkill.deleteMany({
        where: { employeeProfileId: profile.id },
      }),
      this.prisma.employeeSkill.createMany({
        data: dto.skills.map((s) => ({
          employeeProfileId: profile.id,
          skillId: s.skillId,
          level: s.level,
        })),
      }),
    ]);

    return { saved: dto.skills.length };
  }
}