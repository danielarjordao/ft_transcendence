import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';
import {
  buildTwoFactorOtpAuthUrl,
  generateTwoFactorSecret,
  verifyTwoFactorCode,
} from '../common/utils/two-factor';
import { decryptSecret, encryptSecret } from '../common/utils/secret-crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, Verify2FaDto } from './dto/account-security.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  private getTwoFactorIssuer(): string {
    return process.env.TWO_FACTOR_ISSUER || 'Fazelo';
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    // Ensure early returns are used to block illogical inputs before database execution.
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current one',
      );
    }

    // Verify that the query explicitly targets the 'LOCAL' provider.
    // OAuth accounts do not have local passwords; this prevents modifying the wrong auth record.
    const authAccount = await this.prisma.authAccount.findFirst({
      where: { userId: userId, provider: 'LOCAL' },
    });

    if (!authAccount || !authAccount.passwordHash) {
      throw new BadRequestException(
        'This account does not use password authentication (e.g., OAuth account).',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      authAccount.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.authAccount.update({
      where: { id: authAccount.id },
      data: { passwordHash: hashedNewPassword },
    });
  }

  async setup2fa(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException(
        'Two-factor authentication is already enabled',
      );
    }

    const secret = generateTwoFactorSecret();
    const otpauthUrl = buildTwoFactorOtpAuthUrl(
      user.email || user.username,
      secret,
      this.getTwoFactorIssuer(),
    );
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorPendingSecretEnc: encryptSecret(secret),
      },
    });

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl,
    };
  }

  async verify2fa(userId: string, dto: Verify2FaDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorPendingSecretEnc: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorPendingSecretEnc) {
      throw new BadRequestException('Two-factor setup has not been started');
    }

    const secret = decryptSecret(user.twoFactorPendingSecretEnc);
    const isCodeValid = await verifyTwoFactorCode(secret, dto.code);

    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    const now = new Date();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecretEnc: user.twoFactorPendingSecretEnc,
        twoFactorPendingSecretEnc: null,
        twoFactorConfirmedAt: now,
      },
    });
  }

  async disable2fa(userId: string, dto: Verify2FaDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecretEnc: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecretEnc) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    const secret = decryptSecret(user.twoFactorSecretEnc);
    const isCodeValid = await verifyTwoFactorCode(secret, dto.code);

    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorPendingSecretEnc: null,
        twoFactorSecretEnc: null,
        twoFactorConfirmedAt: null,
      },
    });
  }
}
