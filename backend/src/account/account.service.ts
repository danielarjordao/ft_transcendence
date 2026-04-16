import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, Verify2FaDto } from './dto/account-security.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current one',
      );
    }

    // Fetch the user's LOCAL authentication account
    const authAccount = await this.prisma.authAccount.findFirst({
      where: { userId: userId, provider: 'LOCAL' },
    });

    // Ensure the user actually has a password-based account
    if (!authAccount || !authAccount.passwordHash) {
      throw new BadRequestException(
        'This account does not use password authentication (e.g., OAuth account).',
      );
    }

    // Verify if the current password matches the stored hash
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      authAccount.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    // Hash the new password and update it in the database
    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.authAccount.update({
      where: { id: authAccount.id },
      data: { passwordHash: hashedNewPassword },
    });
  }

  async setup2fa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // TODO: Use the 'speakeasy' library to generate the secret
    // const secret = speakeasy.generateSecret({ name: `Fazelo:${user.email}` });

    // TODO: Use the 'qrcode' library to generate the base64 image
    // const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    // TODO: Temporarily store the secret in the database (e.g., pendingTwoFactorSecret field)
    // await this.prisma.user.update({ where: { id: userId }, data: { pendingTwoFactorSecret: secret.base32 }});

    return {
      secret: 'JBSWY3DPEHPK3PXP', // Temporary mock
      otpauthUrl: `otpauth://totp/Fazelo:${user.email}?secret=JBSWY3DPEHPK3PXP&issuer=Fazelo`,
      qrCodeDataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    };
  }

  // add async to this method when implementing the actual verification logic with 'speakeasy'
  verify2fa(userId: string, dto: Verify2FaDto) {
    // TODO: Fetch the pending secret for the user using Prisma
    // TODO: Validate dto.code against the secret using 'speakeasy.totp.verify'

    if (dto.code !== '123456') {
      throw new BadRequestException('Invalid 2FA code');
    }

    // TODO: If valid, update the user in Prisma to activate 2FA:
    // await this.prisma.user.update({
    //   where: { id: userId },
    //   data: { twoFactorEnabled: true, twoFactorSecret: pendingSecret, pendingTwoFactorSecret: null }
    // });
  }

  async disable2fa(userId: string, dto: Verify2FaDto) {
    // TODO: Fetch the user to get the current active secret (twoFactorSecret)
    // TODO: Validate the provided code with 'speakeasy' before proceeding with the teardown

    if (dto.code !== '123456') {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Effectively disable 2FA in the database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        // TODO: Clear the actual secret (e.g., twoFactorSecret: null) when fully implemented
      },
    });
  }
}
