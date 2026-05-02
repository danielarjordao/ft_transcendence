import { generateSecret, generateURI, verify } from 'otplib';

export function generateTwoFactorSecret(): string {
  return generateSecret();
}

export function buildTwoFactorOtpAuthUrl(
  label: string,
  secret: string,
  issuer = 'Fazelo',
): string {
  return generateURI({
    issuer,
    label,
    secret,
  });
}

export async function verifyTwoFactorCode(
  secret: string,
  code: string,
): Promise<boolean> {
  const result = await verify({
    secret,
    token: code.replace(/\s+/g, ''),
  });

  return result.valid;
}
