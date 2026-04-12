import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ActiveUserDto, RequestWithUser } from './dto/active-user.dto';

// Exposes the authenticated user (or a specific field) from the request object.
export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserDto | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Fail fast if this decorator is used on a route without authentication context.
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // If a field is requested, return only that value (e.g., @ActiveUser('id')).
    if (field) {
      return user[field];
    }

    // TODO: Review if returning the full user object should be restricted in some controllers.
    return user;
  },
);
