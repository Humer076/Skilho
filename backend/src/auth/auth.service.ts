
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'crypto';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  EmployeeSignupOtpRequestDto,
  EmployeeSignupOtpVerifyDto,
} from './dto/employee-signup-otp.dto';
import { EmailService } from './email.service';

const OTP_TTL_MINUTES = 2;
const OTP_DAILY_LIMIT = 3;
const OTP_MAX_ATTEMPTS = 5;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getUtcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function getUtcDayStart(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  // --------------------------------------------------
  // REGISTRATION
  // Employers can register directly.
  // Employees must use the OTP registration endpoints.
  // --------------------------------------------------
  async register(dto: RegisterDto) {
    if (dto.role === 'EMPLOYEE') {
      throw new BadRequestException(
        'Technician registration requires email verification. Use the employee signup OTP endpoints.',
      );
    }

    const email = dto.email?.trim().toLowerCase() || null;
    const mobile = dto.mobile?.trim() || null;

    if (!email && !mobile) {
      throw new BadRequestException('Email or mobile is required');
    }

    if (dto.role === 'EMPLOYER' && !dto.companyName?.trim()) {
      throw new BadRequestException(
        'Company name is required for employers',
      );
    }

    const conditions: Prisma.UserWhereInput[] = [];

    if (email) conditions.push({ email });
    if (mobile) conditions.push({ mobile });

    const existing = await this.prisma.user.findFirst({
      where: { OR: conditions },
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          mobile,
          passwordHash,
          role: 'EMPLOYER',
          employerProfile: {
            create: {
              companyName: dto.companyName!.trim(),
            },
          },
        },
      });

      return this.buildResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User already exists');
      }

      throw error;
    }
  }

  // --------------------------------------------------
  // REQUEST TECHNICIAN SIGNUP OTP
  // --------------------------------------------------
  async requestEmployeeSignupOtp(dto: EmployeeSignupOtpRequestDto) {
    const email = dto.email.trim().toLowerCase();
    const mobile = dto.mobile?.trim() || null;

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new BadRequestException('A valid email is required');
    }

    if (!/^\d{6,15}$/.test(mobile || '') && mobile !== null) {
      throw new BadRequestException('Enter a valid mobile number');
    }

    if (!this.email.isPasswordResetConfigured()) {
      throw new BadRequestException(
        'Email verification is temporarily unavailable',
      );
    }

    const conditions: Prisma.UserWhereInput[] = [{ email }];

    if (mobile) conditions.push({ mobile });

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: conditions },
    });

    if (existingUser) {
      throw new ConflictException(
        'An account already uses this email or mobile',
      );
    }

    const now = new Date();
    const dayKey = getUtcDayKey(now);

    const pending =
      await this.prisma.pendingEmployeeRegistration.findUnique({
        where: { email },
      });

    const requestsToday =
      pending?.requestDay === dayKey ? pending.requestsToday : 0;

    if (requestsToday >= OTP_DAILY_LIMIT) {
      throw new BadRequestException(
        'Daily OTP request limit reached. Please try again tomorrow.',
      );
    }

    if (mobile) {
      const pendingMobile =
        await this.prisma.pendingEmployeeRegistration.findFirst({
          where: {
            mobile,
            email: { not: email },
          },
        });

      if (pendingMobile) {
        throw new ConflictException(
          'This mobile number is already used for a pending registration',
        );
      }
    }

    const otp = String(randomInt(100000, 1000000));
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const expiresAt = new Date(
      now.getTime() + OTP_TTL_MINUTES * 60 * 1000,
    );

    const record = await this.prisma.pendingEmployeeRegistration.upsert({
      where: { email },
      create: {
        email,
        mobile,
        displayName: dto.displayName?.trim() || null,
        passwordHash,
        otpHash: hashToken(otp),
        expiresAt,
        attempts: 0,
        requestsToday: 1,
        requestDay: dayKey,
      },
      update: {
        mobile,
        displayName: dto.displayName?.trim() || null,
        passwordHash,
        otpHash: hashToken(otp),
        expiresAt,
        attempts: 0,
        requestsToday: requestsToday + 1,
        requestDay: dayKey,
      },
    });

    // Invalidate the newly created pending code if email delivery fails.
        try {
      await this.email.sendEmployeeSignupOtp(email, otp);
    } catch (error) {
      await this.prisma.pendingEmployeeRegistration.deleteMany({
        where: { id: record.id },
      });

      const details =
        error instanceof Error
          ? `${error.name}: ${error.message}\n${error.stack ?? ''}`
          : String(error);

      this.logger.error(
        `Technician signup OTP delivery failed: ${details}`,
      );

      throw new BadRequestException(
        'Could not send the verification email. Please try again later.',
      );
    }

    return {
      message: 'Verification code sent if registration details are eligible.',
      expiresInSeconds: OTP_TTL_MINUTES * 60,
    };
  }

  // --------------------------------------------------
  // VERIFY TECHNICIAN SIGNUP OTP AND CREATE ACCOUNT
  // --------------------------------------------------
  async verifyEmployeeSignupOtp(dto: EmployeeSignupOtpVerifyDto) {
    const email = dto.email.trim().toLowerCase();
    const otp = dto.otp.trim();

    if (!/^\d{6}$/.test(otp)) {
      throw new BadRequestException('Enter a valid six-digit OTP');
    }

    const now = new Date();

    const pending =
      await this.prisma.pendingEmployeeRegistration.findUnique({
        where: { email },
      });

    if (!pending || pending.expiresAt <= now) {
      throw new BadRequestException(
        'The verification code is invalid or expired. Request a new code.',
      );
    }

    // Reserve one attempt in the database.
    const reservation =
      await this.prisma.pendingEmployeeRegistration.updateMany({
        where: {
          id: pending.id,
          attempts: { lt: OTP_MAX_ATTEMPTS },
          expiresAt: { gt: now },
        },
        data: {
          attempts: { increment: 1 },
        },
      });

    if (reservation.count !== 1) {
      throw new BadRequestException(
        'Too many attempts or the code has expired. Request a new code.',
      );
    }

    if (hashToken(otp) !== pending.otpHash) {
      throw new BadRequestException('Incorrect verification code');
    }

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        // Confirm the OTP is still current and has not been replaced.
        const current =
          await tx.pendingEmployeeRegistration.findUnique({
            where: { id: pending.id },
          });

        if (
          !current ||
          current.expiresAt <= new Date() ||
          current.otpHash !== pending.otpHash
        ) {
          throw new BadRequestException(
            'The verification code is invalid or expired',
          );
        }

        const existing = await tx.user.findFirst({
          where: {
            OR: [
              { email: pending.email },
              ...(pending.mobile ? [{ mobile: pending.mobile }] : []),
            ],
          },
        });

        if (existing) {
          throw new ConflictException(
            'An account already uses this email or mobile',
          );
        }

        const createdUser = await tx.user.create({
          data: {
            email: pending.email,
            mobile: pending.mobile,
            displayName: pending.displayName,
            passwordHash: pending.passwordHash,
            role: 'EMPLOYEE',
            employeeProfile: {
              create: {},
            },
          },
        });

        await tx.pendingEmployeeRegistration.delete({
          where: { id: pending.id },
        });

        return createdUser;
      });

      return this.buildResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account already uses this email or mobile',
        );
      }

      throw error;
    }
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const normalizedEmail = identifier.toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { mobile: identifier },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildResponse(user);
  }

  // --------------------------------------------------
  // CURRENT USER
  // --------------------------------------------------
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employerProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      employerProfile: user.employerProfile,
    };
  }

  // --------------------------------------------------
  // FORGOT PASSWORD OTP
  // Existing flow retained.
  // --------------------------------------------------
  async forgotPassword(identifier: string) {
    const email = identifier.trim().toLowerCase();

    const generic = {
      message:
        'If an account exists for that email, a verification code has been sent.',
    };

    if (
      !email ||
      !email.includes('@') ||
      !this.email.isPasswordResetConfigured()
    ) {
      return generic;
    }

    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user?.email) return generic;

    const now = new Date();
    const dayStart = getUtcDayStart(now);

    const todayRequests =
      await this.prisma.passwordResetToken.count({
        where: {
          userId: user.id,
          createdAt: { gte: dayStart },
        },
      });

    if (todayRequests >= OTP_DAILY_LIMIT) return generic;

    const otp = String(randomInt(100000, 1000000));
    const tokenHash = hashToken(otp);
    const expiresAt = new Date(
      now.getTime() + OTP_TTL_MINUTES * 60 * 1000,
    );

    const resetToken =
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

    // Invalidate earlier outstanding codes.
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        id: { not: resetToken.id },
        usedAt: null,
      },
      data: { usedAt: now },
    });

    try {
      await this.email.sendPasswordResetOtp(user.email, otp);
    } catch {
      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      this.logger.error('Password reset OTP delivery failed.');
    }

    return generic;
  }

  // --------------------------------------------------
  // RESET PASSWORD
  // --------------------------------------------------
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);

    const record =
      await this.prisma.passwordResetToken.findUnique({
        where: { tokenHash },
      });

    if (
      !record ||
      record.usedAt ||
      record.expiresAt <= new Date()
    ) {
      throw new BadRequestException(
        'This reset code is invalid or has expired',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: record.userId,
          usedAt: null,
          id: { not: record.id },
        },
        data: { usedAt: now },
      }),
    ]);

    return {
      message: 'Password has been reset. You can now log in.',
    };
  }

  // --------------------------------------------------
  // JWT RESPONSE
  // --------------------------------------------------
  private async buildResponse(user: {
    id: string;
    role: string;
    email: string | null;
    mobile: string | null;
  }) {
    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    };
  }
}
