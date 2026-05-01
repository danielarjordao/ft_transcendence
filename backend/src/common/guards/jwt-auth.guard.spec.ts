import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('retorna Token expired quando o JWT esta expirado', () => {
    const info = new Error('jwt expired');
    info.name = 'TokenExpiredError';

    expect(() => guard.handleRequest(null, null, info)).toThrow(
      new UnauthorizedException('Token expired'),
    );
  });

  it('retorna User not authenticated quando nao ha token', () => {
    const info = new Error('No auth token');

    expect(() => guard.handleRequest(null, null, info)).toThrow(
      new UnauthorizedException('User not authenticated'),
    );
  });
});
