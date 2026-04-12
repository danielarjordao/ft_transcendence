import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ActiveUserDto } from '../../common/decorators/interfaces/active-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    // Set up the JWT strategy with options to extract the token from the Authorization header,
    // validate its signature and expiration, and specify the secret key for verification.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'default_dev_secret',
    });
  }

  // The validate method is called after the token is successfully verified.
  //  It extracts the user ID from the token payload and returns it as an ActiveUserDto.
  validate(payload: JwtPayload): ActiveUserDto {
    const id = payload.sub || payload.id;

    if (!id || typeof id !== 'string') {
      throw new UnauthorizedException('Invalid token payload');
    }

    // The returned object will be attached to the request as "request.user" and can be accessed in controllers using the @ActiveUser() decorator.
    return { id };
  }
}
