import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || 'no-reply@fazelo.local';

    if (!smtpHost) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[auth] Password reset link for ${email}: ${resetLink}`);
      }

      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth:
        smtpUser && smtpPassword
          ? {
              user: smtpUser,
              pass: smtpPassword,
            }
          : undefined,
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: 'Reset your password',
      text: `Use this link to reset your password: ${resetLink}`,
    });
  }
}
