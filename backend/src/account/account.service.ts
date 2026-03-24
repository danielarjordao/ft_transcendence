import { Injectable, BadRequestException } from '@nestjs/common';
import { ChangePasswordDto, Verify2FaDto } from './dto/account-security.dto';

@Injectable()
export class AccountService {
  changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different');
    }
    // TODO: Use Prisma to fetch user, verify currentPassword hash with Bcrypt.
    // TODO: Hash the newPassword with Bcrypt and update the database record.
  }

  setup2fa(userId: string) {
    console.log(`Setting up 2FA for user ${userId}`);
    // TODO: Generate a real secret using a library like 'speakeasy'.
    // TODO: Generate a real QR code data URL using the 'qrcode' library.
    // TODO: Temporarily save the secret in the DB (unverified state) using Prisma.

    return {
      secret: 'JBSWY3DPEHPK3PXP',
      otpauthUrl:
        'otpauth://totp/Fazelo:ana.laura@42.fr?secret=JBSWY3DPEHPK3PXP&issuer=Fazelo',
      qrCodeDataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    };
  }

  verify2fa(userId: string, dto: Verify2FaDto) {
    // TODO: Use Prisma to fetch the pending 2FA secret for this user.
    // TODO: Use 'speakeasy' to validate the provided dto.code against the secret.
    // TODO: If valid, mark 2FA as active in the DB.

    if (dto.code !== '123456') {
      throw new BadRequestException('Invalid 2FA code');
    }
  }

  disable2fa(userId: string, dto: Verify2FaDto) {
    // TODO: Use Prisma to fetch the active 2FA secret for this user.
    // TODO: Use 'speakeasy' to validate the provided dto.code.
    // TODO: If valid, remove the 2FA secret from the DB and set 2FA as inactive.

    if (dto.code !== '123456') {
      throw new BadRequestException('Invalid 2FA code');
    }
  }
}
