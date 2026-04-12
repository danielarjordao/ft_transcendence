export interface JwtPayload {
  /** Standard JWT subject (usually the user ID) */
  sub?: string;
  /** Custom user ID claim (fallback) */
  id?: string;
  /** User email claim */
  email?: string;
  /** Issued at timestamp */
  iat?: number;
  /** Expiration timestamp */
  exp?: number;
}
