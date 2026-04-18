import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActiveUserDto } from './interfaces/active-user.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Overriding handleRequest allows us to inject custom, Fail-Fast error handling
  // during the authentication lifecycle.
  handleRequest<TUser = ActiveUserDto>(
    err: unknown,
    user: unknown,
    info: unknown,
  ): TUser {
    // Fail-Fast: If Passport encounters an error, or fails to attach a user payload, reject immediately.
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }

      // 'info' often contains specific JWT errors (e.g., 'jwt expired' or 'No auth token').
      // Extracting this provides better debugging context for the frontend.
      const message =
        info instanceof Error ? info.message : 'User not authenticated';

      throw new UnauthorizedException(message);
    }

    // Returns the validated user payload, which NestJS automatically attaches to 'request.user'
    return user as TUser;
  }
}
