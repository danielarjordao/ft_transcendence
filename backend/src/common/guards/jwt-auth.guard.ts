import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import {
  ActiveUserDto,
  RequestWithUser,
} from '../decorators/dto/active-user.dto';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  // Validates the Bearer token and attaches the authenticated user to the request.
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.get('authorization');

    // Reject requests that do not send an Authorization header.
    if (!authHeader) {
      throw new UnauthorizedException('Token is missing');
    }

    // Expect header format: "Bearer <access_token>".
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    // TODO: Review secret management strategy (env var, rotation policy, and per-env values).
    const jwtSecret = process.env.JWT_ACCESS_SECRET;

    if (!jwtSecret) {
      throw new UnauthorizedException('JWT secret is not configured');
    }

    try {
      // Verifies signature and expiration according to the token claims.
      const decoded = verify(token, jwtSecret);

      if (!decoded || typeof decoded === 'string') {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Accept user id from standard "sub" claim or fallback custom "id" claim.
      const idFromSub =
        typeof decoded.sub === 'string' ? decoded.sub : undefined;
      const idFromCustomClaim =
        'id' in decoded && typeof decoded.id === 'string'
          ? decoded.id
          : undefined;
      const id = idFromSub ?? idFromCustomClaim;

      if (typeof id !== 'string' || id.length === 0) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // TODO: Review if additional claims are required soon (e.g., email, roles, workspace context).
      const userPayload: ActiveUserDto = { id };
      request.user = userPayload;
      return true;
    } catch {
      // Normalize JWT validation failures into a single 401 response.
      throw new UnauthorizedException('Token expired or invalid');
    }
  }
}
