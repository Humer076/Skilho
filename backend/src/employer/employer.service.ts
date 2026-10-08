import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';

@Injectable()
export class EmployerService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Employer profile not found');
    }
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateEmployerProfileDto) {
    await this.getProfile(userId);

    const { companyName, specializations, ...rest } = dto;

    // verificationStatus is NOT in the DTO, so an employer can never approve themselves
    return this.prisma.employerProfile.update({
      where: { userId },
      data: {
        ...rest,
        ...(companyName ? { companyName } : {}),
        ...(specializations ? { specializations } : {}),
      },
    });
  }

  // Only messages marked visibleToEmployer are returned. Internal notes never leave the server.
  async getVerification(userId: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
      select: { id: true, verificationStatus: true },
    });
    if (!profile) {
      throw new NotFoundException('Employer profile not found');
    }

    const messages = await this.prisma.verificationEvent.findMany({
      where: { employerProfileId: profile.id, visibleToEmployer: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        toStatus: true,
        note: true,
        createdAt: true,
      },
    });

    return { status: profile.verificationStatus, messages };
  }

  async resubmit(userId: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        verificationStatus: true,
        _count: { select: { documents: true } },
      },
    });
    if (!profile) {
      throw new NotFoundException('Employer profile not found');
    }
    if (profile.verificationStatus !== 'REJECTED') {
      throw new BadRequestException(
        'Only a rejected company can be resubmitted for review',
      );
    }
    if (profile._count.documents === 0) {
      throw new BadRequestException(
        'Upload at least one document before resubmitting',
      );
    }

    await this.prisma.$transaction([
      this.prisma.employerProfile.update({
        where: { id: profile.id },
        data: { verificationStatus: 'PENDING_VERIFICATION' },
      }),
      this.prisma.verificationEvent.create({
        data: {
          employerProfileId: profile.id,
          adminId: null,
          action: 'STATUS_CHANGE',
          fromStatus: 'REJECTED',
          toStatus: 'PENDING_VERIFICATION',
          note: 'Employer resubmitted for review',
          visibleToEmployer: false,
        },
      }),
    ]);

    return { status: 'PENDING_VERIFICATION' };
  }
}