import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActiveUserDto } from '../decorators/interfaces/active-user.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = ActiveUserDto>(
    err: unknown,
    user: unknown,
    info: unknown,
  ): TUser {
    if (err || !user) {
      // Check if 'err' is an instance of Error and throw it directly if it is.
      // This allows NestJS to handle it properly and return the correct HTTP response.
      if (err instanceof Error) {
        throw err;
      }

      const message =
        info instanceof Error ? info.message : 'User not authenticated';

      throw new UnauthorizedException(message);
    }

    return user as TUser;
  }
}
