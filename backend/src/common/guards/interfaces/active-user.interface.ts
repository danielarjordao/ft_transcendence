import { Request } from 'express';

// Defines the minimal identity extracted from a validated JWT access token.
export interface ActiveUserDto {
  id: string;
  // TODO: [Feature - RBAC] Expand this interface with 'roles' or 'permissions' if Role-Based Access Control is added later.
}

// Extends the standard Express Request to include our custom user object.
// This ensures TypeScript doesn't complain when we do `request.user?.id` in our Controllers.
export interface RequestWithUser extends Request {
  user?: ActiveUserDto;
}
