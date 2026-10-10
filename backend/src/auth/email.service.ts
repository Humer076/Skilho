import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

const RESET_TTL_MINUTES = 2;

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  onModuleInit() {
    if (!this.isPasswordResetConfigured()) {
      this.logger.warn(
        'Email is disabled until RESEND_API_KEY and FRONTEND_URL are configured.',
      );
    }
  }

  isPasswordResetConfigured() {
    const hasFrontendUrl =
      process.env.FRONTEND_URL || process.env.NODE_ENV !== 'production';

    return Boolean(
      process.env.RESEND_API_KEY &&
      hasFrontendUrl,
    );
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const from =
      process.env.EMAIL_FROM || 'Skilho <onboarding@resend.dev>';

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
          html,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        this.logger.error(
          `Resend email delivery failed: ${JSON.stringify(result)}`,
        );

        throw new Error('Email delivery failed');
      }

      this.logger.log(`Email accepted by Resend for ${to}`);
    } catch (error) {
      this.logger.error(
        `Resend email delivery failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw error;
    }
  }

  async sendPasswordReset(to: string, token: string) {
    const frontendUrl =
      process.env.FRONTEND_URL || 'https://skilho-5.onrender.com';

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
        <p>
          <a
            href="${safeLink}"
            style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px"
          >
            Reset password
          </a>
        </p>
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
        <p>
          Enter this verification code in Skilho.
          It expires in <strong>2 minutes</strong>.
        </p>

        <div
          style="
            display:inline-block;
            padding:14px 22px;
            background:#eff6ff;
            border-radius:12px;
            font-size:30px;
            font-weight:800;
            letter-spacing:8px;
            color:#1d4ed8
          "
        >
          ${otp}
        </div>

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

        <p>
          Enter this code to complete your technician registration.
        </p>

        <p>
          This code expires in <strong>2 minutes</strong>.
        </p>

        <div
          style="
            display:inline-block;
            padding:14px 22px;
            background:#eff6ff;
            border-radius:12px;
            font-size:30px;
            font-weight:800;
            letter-spacing:8px;
            color:#1d4ed8
          "
        >
          ${otp}
        </div>

        <p>If you did not request this code, you can ignore this email.</p>
      </div>`,
    );
  }
}
