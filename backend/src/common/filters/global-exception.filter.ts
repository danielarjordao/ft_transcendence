import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private resolveSpecificType(
    status: number,
    message: string,
  ): string | null {
    if (status === HttpStatus.UNAUTHORIZED) {
      switch (message) {
        case 'Invalid credentials':
        case 'Invalid current password':
          return 'invalid_credentials';
        case 'Token expired':
        case 'Reset token expired':
          return 'token_expired';
        case 'Invalid OAuth code':
          return 'invalid_oauth_code';
        default:
          return null;
      }
    }

    if (status === HttpStatus.CONFLICT) {
      switch (message) {
        case 'Email is already taken':
          return 'email_taken';
        case 'Username is already taken':
          return 'username_taken';
        default:
          return null;
      }
    }

    return null;
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let type = 'internal_error';
    let message = 'An unexpected error occurred.';
    let details: Record<string, unknown> | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse() as
        | Record<string, unknown>
        | string;

      message =
        typeof responseBody === 'string'
          ? responseBody
          : (responseBody.message as string) || exception.message;

      // Translate validation errors into a structured format
      if (
        status === HttpStatus.BAD_REQUEST &&
        typeof responseBody === 'object' &&
        Array.isArray(responseBody.message)
      ) {
        type = 'validation_error';
        message = 'The request payload is invalid.';
        details = { field: responseBody.message[0] };
      } else {
        const specificType = this.resolveSpecificType(status, message);

        if (specificType) {
          type = specificType;
          response.status(status).json({ type, message, details });
          return;
        }

        // Map common HTTP exceptions to specific types for better frontend handling
        switch (status) {
          case HttpStatus.UNAUTHORIZED:
            type = 'unauthorized';
            break;
          case HttpStatus.FORBIDDEN:
            type = 'forbidden';
            break;
          case HttpStatus.NOT_FOUND:
            type = 'not_found';
            break;
          case HttpStatus.CONFLICT:
            type = 'conflict';
            break;
          case HttpStatus.UNPROCESSABLE_ENTITY:
            type = 'invalid_state_transition';
            break;
          case HttpStatus.TOO_MANY_REQUESTS:
            type = 'rate_limited';
            break;
          case HttpStatus.PAYLOAD_TOO_LARGE:
            type = 'payload_too_large';
            break;
          case HttpStatus.UNSUPPORTED_MEDIA_TYPE:
            type = 'unsupported_file_type';
            break;
          default:
            type = 'error';
        }
      }
    }

    // Log the error details for internal debugging
    response.status(status).json({ type, message, details });
  }
}
