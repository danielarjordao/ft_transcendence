export interface JwtPayload {
  /** Standard JWT subject (usually the user ID) */
  sub?: string;
  /** Custom user ID claim (fallback) */
  id?: string;
  /** User email claim */
  email?: string;
  /** Temporary auth purpose, such as the 2FA second step */
  purpose?: string;
  /** Issued at timestamp */
  iat?: number;
  /** Expiration timestamp */
  exp?: number;
}
