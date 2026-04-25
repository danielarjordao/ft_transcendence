import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, Verify2FaDto } from './dto/account-security.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

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

  setup2fa(_userId: string) {
    // TODO: [Feature - 2FA] Fetch the user record from the database.
    // TODO: [Feature - 2FA] Generate a cryptographically secure secret using the 'speakeasy' library.
    // TODO: [Feature - 2FA] Generate a base64 QR code image string using the 'qrcode' library.
    // TODO: [Feature - 2FA] Persist the generated secret temporarily in `twoFactorPendingSecretEnc`.
    // TODO: [Feature - 2FA] Do not overwrite `twoFactorSecretEnc` here; it should only be filled after successful verification.

    return {
      secret: 'JBSWY3DPEHPK3PXP', // Temporary mock
      otpauthUrl: `otpauth://totp/Fazelo:mock@42.fr?secret=JBSWY3DPEHPK3PXP&issuer=Fazelo`,
      qrCodeDataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    };
  }

  verify2fa(userId: string, dto: Verify2FaDto) {
    if (dto.code !== '123456') {
      throw new BadRequestException('Invalid 2FA code');
    }

    // TODO: [Feature - 2FA] Fetch `twoFactorPendingSecretEnc` for the user from the database.
    // TODO: [Feature - 2FA] Validate the provided DTO code against the pending secret using the 'speakeasy' library.
    // TODO: [Feature - 2FA] Upon successful validation, move the pending secret into `twoFactorSecretEnc`.
    // TODO: [Feature - 2FA] Clear `twoFactorPendingSecretEnc`, mark `twoFactorEnabled` as true, and set `twoFactorConfirmedAt`.
  }

  async disable2fa(userId: string, dto: Verify2FaDto) {
    if (dto.code !== '123456') {
      throw new BadRequestException('Invalid 2FA code');
    }

    // TODO: [Feature - 2FA] Fetch the currently active 2FA secret from the user record.
    // TODO: [Feature - 2FA] Validate the provided code using 'speakeasy' to authorize the teardown.
    // TODO: [Feature - 2FA] If there is a stale pending setup, clear `twoFactorPendingSecretEnc` as part of the disable flow.

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
