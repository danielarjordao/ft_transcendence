import { UnauthorizedException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { encryptSecret } from '../common/utils/secret-crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AccountService } from './account.service';

const generateTwoFactorSecretMock = jest.fn();
const buildTwoFactorOtpAuthUrlMock = jest.fn();
const verifyTwoFactorCodeMock = jest.fn();

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../common/utils/two-factor', () => ({
  generateTwoFactorSecret: (...args) => generateTwoFactorSecretMock(...args),
  buildTwoFactorOtpAuthUrl: (...args) =>
    buildTwoFactorOtpAuthUrlMock(...args),
  verifyTwoFactorCode: (...args) => verifyTwoFactorCodeMock(...args),
}));

describe('AccountService', () => {
  let service: AccountService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    authAccount: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AccountService(prisma);
    process.env.AUTH_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64');
    process.env.TWO_FACTOR_ISSUER = 'Fazelo';
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,qr');
    generateTwoFactorSecretMock.mockReturnValue('two-factor-secret');
    buildTwoFactorOtpAuthUrlMock.mockReturnValue(
      'otpauth://totp/Fazelo:ana@example.com',
    );
  });

  it('setup2fa retorna secret, otpauthUrl e qrCodeDataUrl', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'ana@example.com',
      username: 'ana',
      twoFactorEnabled: false,
    });
    prisma.user.update.mockResolvedValue({});

    const result = await service.setup2fa('user-1');

    expect(result.secret).toBeTruthy();
    expect(result.otpauthUrl).toContain('otpauth://');
    expect(result.qrCodeDataUrl).toBe('data:image/png;base64,qr');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        twoFactorPendingSecretEnc: expect.any(String),
      },
    });

    const encryptedSecret =
      prisma.user.update.mock.calls[0][0].data.twoFactorPendingSecretEnc;
    expect(encryptedSecret).not.toBe(result.secret);
  });

  it('verify2fa com codigo invalido falha', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      twoFactorPendingSecretEnc: encryptSecret('two-factor-secret'),
    });
    verifyTwoFactorCodeMock.mockResolvedValue(false);

    await expect(
      service.verify2fa('user-1', { code: '000000' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid two-factor code'));

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('verify2fa com codigo valido habilita 2FA', async () => {
    const encryptedSecret = encryptSecret('two-factor-secret');

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      twoFactorPendingSecretEnc: encryptedSecret,
    });
    prisma.user.update.mockResolvedValue({});
    verifyTwoFactorCodeMock.mockResolvedValue(true);

    await expect(
      service.verify2fa('user-1', {
        code: '123456',
      }),
    ).resolves.toBeUndefined();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        twoFactorEnabled: true,
        twoFactorSecretEnc: encryptedSecret,
        twoFactorPendingSecretEnc: null,
        twoFactorConfirmedAt: expect.any(Date),
      },
    });
  });

  it('disable2fa com codigo valido desabilita 2FA', async () => {
    const encryptedSecret = encryptSecret('two-factor-secret');

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      twoFactorEnabled: true,
      twoFactorSecretEnc: encryptedSecret,
    });
    prisma.user.update.mockResolvedValue({});
    verifyTwoFactorCodeMock.mockResolvedValue(true);

    await expect(
      service.disable2fa('user-1', {
        code: '123456',
      }),
    ).resolves.toBeUndefined();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        twoFactorEnabled: false,
        twoFactorPendingSecretEnc: null,
        twoFactorSecretEnc: null,
        twoFactorConfirmedAt: null,
      },
    });
  });
});
