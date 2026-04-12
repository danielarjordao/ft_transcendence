import { Request } from 'express';

// Minimal identity extracted from a validated access token.
export interface ActiveUserDto {
  id: string;
  // TODO: Review when to add more claims here (roles/profile fields) as authorization rules evolve.
}

// Express request extended with the authenticated user injected by the guard.
export interface RequestWithUser extends Request {
  user?: ActiveUserDto;
}
