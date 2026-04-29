import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ActiveUserDto } from '../../common/guards/interfaces/active-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { getCookieValue } from '../utils/cookies';

const extractAccessTokenFromCookie = (
  request: Request | undefined,
): string | null => {
  const token = getCookieValue(request?.headers.cookie, 'accessToken');
  return token || null;
};

@Injectable()
// Behind the scenes flow (Instantiation vs Execution):
// - Instantiation: This class is created as a Singleton exactly once when the NestJS server starts. 
//   Its constructor runs and registers this strategy inside the Passport library under the name 'jwt'.
// - Execution: Its validation logic (extracting the token, verifying the signature, and calling validate()) 
//   is ONLY triggered when a Guard's canActivate() method explicitly asks Passport to run the 'jwt' strategy.
//   Ex: @UseGuards(JwtAuthGuard)
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    // Verify that the strategy is configured to extract the token from the Authorization header,
    // and that it strictly checks expiration dates using the environment secret.
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractAccessTokenFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'default_dev_secret',
    });
  }

  // Check that the validate method acts as a Fail-Fast guard.
  // If the payload lacks a valid ID, it immediately rejects the request.
  validate(payload: JwtPayload): ActiveUserDto {
    const id = payload.sub || payload.id;

    if (!id || typeof id !== 'string') {
      throw new UnauthorizedException('Invalid token payload');
    }

    // This returned object binds to the Request object (req.user),
    // making it accessible via decorators in the Controllers.
    return { id };
  }
}
