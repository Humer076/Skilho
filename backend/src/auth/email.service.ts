import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

const RESET_TTL_MINUTES = 2;

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  private cachedAccessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  onModuleInit() {
    if (!this.isPasswordResetConfigured()) {
      this.logger.warn(
        'Email is disabled until GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GMAIL_USER and FRONTEND_URL are configured.',
      );
    }
  }

  private isGmailConfigured() {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REFRESH_TOKEN &&
        process.env.GMAIL_USER,
    );
  }

  isPasswordResetConfigured() {
    const hasFrontendUrl =
      process.env.FRONTEND_URL || process.env.NODE_ENV !== 'production';

    return Boolean(this.isGmailConfigured() && hasFrontendUrl);
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedAccessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.cachedAccessToken;
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
        grant_type: 'refresh_token',
      }),
    });

    const result: any = await response.json();

    if (!response.ok || !result.access_token) {
      this.logger.error(
        `Google token refresh failed: ${JSON.stringify(result)}`,
      );
      throw new Error('Could not get Google access token');
    }

    this.cachedAccessToken = result.access_token;
    // refresh 1 minute early
    this.accessTokenExpiresAt =
      Date.now() + (Number(result.expires_in) - 60) * 1000;

    return this.cachedAccessToken!;
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ) {
    if (!this.isGmailConfigured()) {
      throw new Error('Gmail credentials are not configured');
    }

    if (/[\r\n]/.test(to) || /[\r\n]/.test(subject)) {
      throw new Error('Invalid email header value');
    }

    const from = process.env.EMAIL_FROM || `Skilho <${process.env.GMAIL_USER}>`;
    const boundary = `skilho_${Date.now()}`;
    const b64 = (s: string) => Buffer.from(s, 'utf-8').toString('base64');

    const mime = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${b64(subject)}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      b64(text),
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      b64(html),
      `--${boundary}--`,
    ].join('\r\n');

    const raw = Buffer.from(mime, 'utf-8').toString('base64url');

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        this.logger.error(`Gmail send failed: ${JSON.stringify(result)}`);
        throw new Error('Email delivery failed');
      }

      this.logger.log(`Email sent via Gmail to ${to}`);
    } catch (error) {
      this.logger.error(
        `Gmail email delivery failed: ${
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
