import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const RESET_TOKEN_TTL_MINUTES = 30;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.mobile) {
      throw new BadRequestException('Email or mobile is required');
    }
    if (dto.role === 'EMPLOYER' && !dto.companyName) {
      throw new BadRequestException('Company name is required for employers');
    }

    const conditions: any[] = [];
    if (dto.email) conditions.push({ email: dto.email });
    if (dto.mobile) conditions.push({ mobile: dto.mobile });

    const existing = await this.prisma.user.findFirst({
      where: { OR: conditions },
    });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        mobile: dto.mobile,
        passwordHash,
        role: dto.role,
        employerProfile:
          dto.role === 'EMPLOYER'
            ? { create: { companyName: dto.companyName! } }
            : undefined,
      },
    });

    return this.buildResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { mobile: dto.identifier }],
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildResponse(user);
  }

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

  // Always returns the same generic response, whether or not the account exists,
  // so nobody can use this to discover which emails are registered.
  async forgotPassword(identifier: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { mobile: identifier }] },
    });

    if (user) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(
        Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000,
      );

      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      // TODO before launch: send this link by email/SMS instead of logging it.
      // Swap this console.log for a real email/SMS provider call.
      const resetLink = `http://localhost:3001/reset-password?token=${rawToken}`;
      console.log('--------------------------------------------------');
      console.log('PASSWORD RESET LINK (would be emailed/texted):');
      console.log(resetLink);
      console.log('Expires in', RESET_TOKEN_TTL_MINUTES, 'minutes');
      console.log('--------------------------------------------------');
    }

    return {
      message:
        'If an account exists with that email or mobile number, a reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This reset link is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate any other outstanding reset tokens for this user
      this.prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password has been reset. You can now log in.' };
  }

  private async buildResponse(user: {
    id: string;
    role: string;
    email: string | null;
    mobile: string | null;
  }) {
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
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