import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private getMailConfig() {
    return {
      smtpHost: process.env.SMTP_HOST,
      smtpPort: Number(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER,
      smtpPassword: process.env.SMTP_PASSWORD,
      smtpFrom: process.env.SMTP_FROM || 'no-reply@fazelo.local',
    };
  }

  private async sendTransactionalEmail(options: {
    category: string;
    to: string;
    subject: string;
    text: string;
    fallbackLog: string;
  }): Promise<void> {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom } =
      this.getMailConfig();

    if (!smtpHost) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[${options.category}] ${options.fallbackLog}`);
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
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    await this.sendTransactionalEmail({
      category: 'auth',
      to: email,
      subject: 'Reset your password',
      text: `Use this link to reset your password: ${resetLink}`,
      fallbackLog: `Password reset link for ${email}: ${resetLink}`,
    });
  }

  async sendWorkspaceInvitationEmail(options: {
    email: string;
    workspaceName: string;
    inviterName: string;
    role: string;
    invitationLink: string;
    expiresAt: Date;
  }): Promise<void> {
    const roleLabel = options.role === 'admin' ? 'Admin' : 'Member';
    const expiresAtLabel = options.expiresAt.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await this.sendTransactionalEmail({
      category: 'workspaces',
      to: options.email,
      subject: `You're invited to join ${options.workspaceName}`,
      text:
        `${options.inviterName} invited you to join the workspace ` +
        `"${options.workspaceName}" as ${roleLabel}.\n\n` +
        `Use this secure link to review the invitation:\n${options.invitationLink}\n\n` +
        `This link expires on ${expiresAtLabel}.`,
      fallbackLog:
        `Workspace invitation link for ${options.email}: ` +
        `${options.invitationLink}`,
    });
  }
}
