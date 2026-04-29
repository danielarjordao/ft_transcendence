import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

function resolveEncryptionKey(): Buffer {
  const configuredKey = process.env.AUTH_ENCRYPTION_KEY;

  if (!configuredKey) {
    return createHash('sha256')
      .update('default_dev_auth_encryption_key')
      .digest();
  }

  const decodedKey = Buffer.from(configuredKey, 'base64');

  if (decodedKey.length === 32) {
    return decodedKey;
  }

  return createHash('sha256').update(configuredKey).digest();
}

export function encryptSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, resolveEncryptionKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptSecret(payload: string): string {
  const [ivPart, authTagPart, encryptedPart] = payload.split('.');

  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error('Invalid encrypted secret payload');
  }

  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    resolveEncryptionKey(),
    Buffer.from(ivPart, 'base64url'),
  );

  decipher.setAuthTag(Buffer.from(authTagPart, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, 'base64url')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
