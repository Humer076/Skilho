
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

const RESET_TTL_MINUTES = 2;

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  onModuleInit() {
    if (!this.isPasswordResetConfigured()) {
      this.logger.warn(
        'Email is disabled until SMTP_USER and SMTP_PASS are configured.',
      );
    }
  }

  isPasswordResetConfigured() {
    const hasFrontendUrl =
      process.env.FRONTEND_URL || process.env.NODE_ENV !== 'production';

    return Boolean(
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      hasFrontendUrl,
    );
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ) {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM || `Skilho <${user}>`;

    if (!user || !pass) {
      throw new Error('Gmail SMTP is not configured');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user,
        pass,
      },
    });

    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(
        `Gmail SMTP email delivery failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    } finally {
      transporter.close();
    }
  }

  async sendPasswordReset(to: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    if (
      !this.isPasswordResetConfigured() ||
      (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL)
    ) {
      throw new Error('Password reset email is not configured');
    }

    const resetUrl = new URL('/reset-password', frontendUrl);
    resetUrl.searchParams.set('token', token);

    const link = resetUrl.toString();
    const safeLink = link
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

    await this.sendEmail(
      to,
      'Reset your Skilho password',
      `We received a request to reset your Skilho password. Use this link within ${RESET_TTL_MINUTES} minutes: ${link}\n\nIf you did not request this, you can ignore this email.`,
      `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
        <h1 style="font-size:22px">Reset your Skilho password</h1>
        <p>This link expires in ${RESET_TTL_MINUTES} minutes.</p>
        <p><a href="${safeLink}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>`,
    );
  }

  async sendPasswordResetOtp(to: string, otp: string) {
    await this.sendEmail(
      to,
      'Your Skilho password reset code',
      `Your Skilho password reset code is ${otp}. It expires in 2 minutes. If you did not request this code, you can ignore this email.`,
      `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
        <h1 style="font-size:22px">Reset your Skilho password</h1>
        <p>Enter this verification code in Skilho. It expires in <strong>2 minutes</strong>.</p>
        <div style="display:inline-block;padding:14px 22px;background:#eff6ff;border-radius:12px;font-size:30px;font-weight:800;letter-spacing:8px;color:#1d4ed8">${otp}</div>
        <p>If you did not request this code, you can ignore this email.</p>
      </div>`,
    );
  }

  async sendEmployeeSignupOtp(to: string, otp: string) {
    await this.sendEmail(
      to,
      'Verify your Skilho email',
      `Your Skilho signup verification code is ${otp}. It expires in 2 minutes. If you did not request this code, you can ignore this email.`,
      `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
        <h1 style="font-size:22px">Verify your Skilho email</h1>
        <p>Enter this code to complete your technician registration.</p>
        <p>This code expires in <strong>2 minutes</strong>.</p>
        <div style="display:inline-block;padding:14px 22px;background:#eff6ff;border-radius:12px;font-size:30px;font-weight:800;letter-spacing:8px;color:#1d4ed8">${otp}</div>
        <p>If you did not request this code, you can ignore this email.</p>
      </div>`,
    );
  }
}
