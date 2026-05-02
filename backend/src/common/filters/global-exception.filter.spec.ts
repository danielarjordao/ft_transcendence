import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

function createHost() {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  it('traduz erro de validacao para validation_error com details', () => {
    const { host, response } = createHost();
    const exception = new BadRequestException([
      'email must be an email',
    ]);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      type: 'validation_error',
      message: 'The request payload is invalid.',
      details: {
        field: 'email must be an email',
      },
    });
  });

  it('retorna invalid_credentials para Invalid credentials', () => {
    const { host, response } = createHost();

    filter.catch(new UnauthorizedException('Invalid credentials'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(response.json).toHaveBeenCalledWith({
      type: 'invalid_credentials',
      message: 'Invalid credentials',
      details: null,
    });
  });

  it('retorna token_expired para Token expired', () => {
    const { host, response } = createHost();

    filter.catch(new UnauthorizedException('Token expired'), host);

    expect(response.json).toHaveBeenCalledWith({
      type: 'token_expired',
      message: 'Token expired',
      details: null,
    });
  });

  it('retorna token_expired para Reset token expired', () => {
    const { host, response } = createHost();

    filter.catch(new UnauthorizedException('Reset token expired'), host);

    expect(response.json).toHaveBeenCalledWith({
      type: 'token_expired',
      message: 'Reset token expired',
      details: null,
    });
  });

  it('retorna invalid_oauth_code para Invalid OAuth code', () => {
    const { host, response } = createHost();

    filter.catch(new UnauthorizedException('Invalid OAuth code'), host);

    expect(response.json).toHaveBeenCalledWith({
      type: 'invalid_oauth_code',
      message: 'Invalid OAuth code',
      details: null,
    });
  });

  it('retorna invalid_credentials para Invalid current password', () => {
    const { host, response } = createHost();

    filter.catch(new UnauthorizedException('Invalid current password'), host);

    expect(response.json).toHaveBeenCalledWith({
      type: 'invalid_credentials',
      message: 'Invalid current password',
      details: null,
    });
  });

  it('retorna email_taken para conflito de email', () => {
    const { host, response } = createHost();

    filter.catch(new ConflictException('Email is already taken'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith({
      type: 'email_taken',
      message: 'Email is already taken',
      details: null,
    });
  });

  it('retorna username_taken para conflito de username', () => {
    const { host, response } = createHost();

    filter.catch(new ConflictException('Username is already taken'), host);

    expect(response.json).toHaveBeenCalledWith({
      type: 'username_taken',
      message: 'Username is already taken',
      details: null,
    });
  });

  it('mantem unauthorized generico para outros 401', () => {
    const { host, response } = createHost();

    filter.catch(new UnauthorizedException('Invalid refresh token'), host);

    expect(response.json).toHaveBeenCalledWith({
      type: 'unauthorized',
      message: 'Invalid refresh token',
      details: null,
    });
  });

  it('retorna forbidden para 403 generico', () => {
    const { host, response } = createHost();

    filter.catch(new ForbiddenException('Forbidden resource'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(response.json).toHaveBeenCalledWith({
      type: 'forbidden',
      message: 'Forbidden resource',
      details: null,
    });
  });

  it('retorna not_found para 404 generico', () => {
    const { host, response } = createHost();

    filter.catch(new NotFoundException('User not found'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith({
      type: 'not_found',
      message: 'User not found',
      details: null,
    });
  });

  it('mantem conflict generico para conflitos nao refinados', () => {
    const { host, response } = createHost();

    filter.catch(new ConflictException('Workspace member already exists'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith({
      type: 'conflict',
      message: 'Workspace member already exists',
      details: null,
    });
  });

  it('retorna invalid_state_transition para 422', () => {
    const { host, response } = createHost();

    filter.catch(
      new UnprocessableEntityException('Invalid state transition'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response.json).toHaveBeenCalledWith({
      type: 'invalid_state_transition',
      message: 'Invalid state transition',
      details: null,
    });
  });

  it('retorna rate_limited para 429', () => {
    const { host, response } = createHost();

    filter.catch(
      new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect(response.json).toHaveBeenCalledWith({
      type: 'rate_limited',
      message: 'Too many requests',
      details: null,
    });
  });

  it('retorna payload_too_large para 413', () => {
    const { host, response } = createHost();

    filter.catch(new PayloadTooLargeException('Payload too large'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.PAYLOAD_TOO_LARGE,
    );
    expect(response.json).toHaveBeenCalledWith({
      type: 'payload_too_large',
      message: 'Payload too large',
      details: null,
    });
  });

  it('retorna unsupported_file_type para 415', () => {
    const { host, response } = createHost();

    filter.catch(
      new UnsupportedMediaTypeException('Unsupported file type'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    );
    expect(response.json).toHaveBeenCalledWith({
      type: 'unsupported_file_type',
      message: 'Unsupported file type',
      details: null,
    });
  });

  it('retorna internal_error para erro inesperado fora de HttpException', () => {
    const { host, response } = createHost();

    filter.catch(new Error('boom'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      type: 'internal_error',
      message: 'An unexpected error occurred.',
      details: null,
    });
  });
});
