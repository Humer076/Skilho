import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CandidateEngagementService {
  constructor(private readonly prisma: PrismaService) {}

  private async getEmployerProfile(userId: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new ForbiddenException('Employer profile not found');
    }

    return profile;
  }

  private async getEmployeeProfile(userId: string) {
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Technician profile not found');
    }

    return profile;
  }

  // Save a technician for later.
  async saveCandidate(userId: string, employeeProfileId: string) {
    const employer = await this.getEmployerProfile(userId);

    const candidate = await this.prisma.employeeProfile.findUnique({
      where: { id: employeeProfileId },
      select: { id: true },
    });

    if (!candidate) {
      throw new NotFoundException('Technician not found');
    }

    return this.prisma.savedCandidate.upsert({
      where: {
        employerProfileId_employeeProfileId: {
          employerProfileId: employer.id,
          employeeProfileId,
        },
      },
      create: {
        employerProfileId: employer.id,
        employeeProfileId,
      },
      update: {},
    });
  }

  // Remove a saved technician.
  async unsaveCandidate(userId: string, employeeProfileId: string) {
    const employer = await this.getEmployerProfile(userId);

    const saved = await this.prisma.savedCandidate.findUnique({
      where: {
        employerProfileId_employeeProfileId: {
          employerProfileId: employer.id,
          employeeProfileId,
        },
      },
      select: { id: true },
    });

    if (!saved) {
      throw new NotFoundException('Saved technician not found');
    }

    await this.prisma.savedCandidate.delete({
      where: { id: saved.id },
    });

    return { success: true };
  }

  // Return only the profile fields needed by the employer.
  async getSavedCandidates(userId: string) {
    const employer = await this.getEmployerProfile(userId);

    return this.prisma.savedCandidate.findMany({
      where: { employerProfileId: employer.id },
      select: {
        id: true,
        createdAt: true,
        employeeProfile: {
          select: {
            id: true,
            bio: true,
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
            skills: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Tag a technician for one of this employer's jobs.
  // An application is not required.
  async tagCandidate(
    userId: string,
    jobId: string,
    employeeProfileId: string,
    note?: string,
  ) {
    const employer = await this.getEmployerProfile(userId);

    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        employerProfileId: employer.id,
      },
      select: { id: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found for this employer');
    }

    const candidate = await this.prisma.employeeProfile.findUnique({
      where: { id: employeeProfileId },
      select: { id: true },
    });

    if (!candidate) {
      throw new NotFoundException('Technician not found');
    }

    const cleanNote = note?.trim() || null;

    return this.prisma.jobCandidateTag.upsert({
      where: {
        jobId_employeeProfileId: {
          jobId,
          employeeProfileId,
        },
      },
      create: {
        employerProfileId: employer.id,
        jobId,
        employeeProfileId,
        note: cleanNote,
      },
      update: {
        note: cleanNote,
      },
    });
  }

  // Show jobs that employers have tagged for this technician.
  async getTaggedJobsForTechnician(userId: string) {
    const employee = await this.getEmployeeProfile(userId);

    return this.prisma.jobCandidateTag.findMany({
      where: { employeeProfileId: employee.id },
      include: {
        job: true,
        employerProfile: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Employer starts or reopens the same conversation with a technician.
  async startConversation(
    employerUserId: string,
    employeeProfileId: string,
  ) {
    const employer = await this.getEmployerProfile(employerUserId);

    const employee = await this.prisma.employeeProfile.findUnique({
      where: { id: employeeProfileId },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException('Technician not found');
    }

    return this.prisma.conversation.upsert({
      where: {
        employerProfileId_employeeProfileId: {
          employerProfileId: employer.id,
          employeeProfileId,
        },
      },
      create: {
        employerProfileId: employer.id,
        employeeProfileId,
      },
      update: {},
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });
  }

  // Technician can start a conversation with an employer too.
  async startConversationAsTechnician(
    employeeUserId: string,
    employerProfileId: string,
  ) {
    const employee = await this.getEmployeeProfile(employeeUserId);

    const employer = await this.prisma.employerProfile.findUnique({
      where: { id: employerProfileId },
      select: { id: true },
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    return this.prisma.conversation.upsert({
      where: {
        employerProfileId_employeeProfileId: {
          employerProfileId: employer.id,
          employeeProfileId: employee.id,
        },
      },
      create: {
        employerProfileId: employer.id,
        employeeProfileId: employee.id,
      },
      update: {},
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });
  }

  // List conversations for the logged-in participant.
  async getConversations(userId: string, role: string) {
    if (role === 'EMPLOYER') {
      const employer = await this.getEmployerProfile(userId);

      return this.prisma.conversation.findMany({
        where: { employerProfileId: employer.id },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          employeeProfile: {
            select: {
              id: true,
              user: {
                select: { displayName: true },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              senderId: true,
              createdAt: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (role === 'EMPLOYEE') {
      const employee = await this.getEmployeeProfile(userId);

      return this.prisma.conversation.findMany({
        where: { employeeProfileId: employee.id },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          employerProfile: {
            select: {
              id: true,
              companyName: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              senderId: true,
              createdAt: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    throw new ForbiddenException('This account cannot access conversations');
  }

  // Check that the sender belongs to the conversation.
  private async ensureConversationParticipant(
    userId: string,
    role: string,
    conversationId: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        employerProfile: { select: { userId: true } },
        employeeProfile: { select: { userId: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const allowed =
      (role === 'EMPLOYER' &&
        conversation.employerProfile.userId === userId) ||
      (role === 'EMPLOYEE' &&
        conversation.employeeProfile.userId === userId);

    if (!allowed) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }
  }

  // Send a message from either participant.
  async sendMessage(
    userId: string,
    role: string,
    conversationId: string,
    content: string,
  ) {
    const text = content?.trim();

    if (!text) {
      throw new BadRequestException('Message cannot be empty');
    }

    if (text.length > 5000) {
      throw new BadRequestException(
        'Message cannot be longer than 5000 characters',
      );
    }

    await this.ensureConversationParticipant(
      userId,
      role,
      conversationId,
    );

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: text,
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        createdAt: true,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  // Read messages only if the requester is a participant.
  async getConversationMessages(
    userId: string,
    role: string,
    conversationId: string,
  ) {
    await this.ensureConversationParticipant(
      userId,
      role,
      conversationId,
    );

    return this.prisma.message.findMany({
      where: { conversationId },
      select: {
        id: true,
        conversationId: true,
        content: true,
        senderId: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            displayName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}