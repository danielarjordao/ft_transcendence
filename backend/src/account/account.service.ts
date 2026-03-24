import { Injectable, BadRequestException } from '@nestjs/common';
import { ChangePasswordDto, Verify2FaDto } from './dto/account-security.dto';

@Injectable()
export class AccountService {
  changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different');
    }
    // Simulate password change logic (e.g., check current password, hash new password, save to DB)
  }

  setup2fa(userId: string) {
    // Mock: return the same secret and QR code for any user
    console.log(`Setting up 2FA for user ${userId}`);
    return {
      secret: 'JBSWY3DPEHPK3PXP',
      otpauthUrl:
        'otpauth://totp/Fazelo:ana.laura@42.fr?secret=JBSWY3DPEHPK3PXP&issuer=Fazelo',
      qrCodeDataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    };
  }

  verify2fa(userId: string, dto: Verify2FaDto) {
    if (dto.code !== '123456') {
      // Mock: only accept '123456' as the valid 2FA code for testing purposes
      throw new BadRequestException('Invalid 2FA code');
    }
  }

  disable2fa(userId: string, dto: Verify2FaDto) {
    if (dto.code !== '123456') {
      throw new BadRequestException('Invalid 2FA code');
    }
  }
}
