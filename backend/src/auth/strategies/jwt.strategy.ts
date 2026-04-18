import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ActiveUserDto } from '../../common/decorators/interfaces/active-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    // Verify that the strategy is configured to extract the token from the Authorization header,
    // and that it strictly checks expiration dates using the environment secret.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
