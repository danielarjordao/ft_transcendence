import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import helmet from 'helmet';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

function resolveHttpsOptions() {
  if (process.env.HTTPS_ENABLED !== 'true') {
    return undefined;
  }

  const keyPath = process.env.HTTPS_KEY_PATH;
  const certPath = process.env.HTTPS_CERT_PATH;

  if (!keyPath || !certPath) {
    throw new Error(
      'HTTPS is enabled, but HTTPS_KEY_PATH or HTTPS_CERT_PATH is missing',
    );
  }

  const resolvedKeyPath = resolve(process.cwd(), keyPath);
  const resolvedCertPath = resolve(process.cwd(), certPath);

  if (!existsSync(resolvedKeyPath) || !existsSync(resolvedCertPath)) {
    throw new Error(
      `HTTPS certificate files not found: key=${resolvedKeyPath}, cert=${resolvedCertPath}`,
    );
  }

  return {
    key: readFileSync(resolvedKeyPath),
    cert: readFileSync(resolvedCertPath),
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: resolveHttpsOptions(),
  });

  // The GlobalExceptionFilter centralizes error handling across the entire application.
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Establishing a global prefix isolates the API routes from potential static assets or frontend routes if hosted together.
  app.setGlobalPrefix('api');

  // The Global Validation Pipe enforces our DTO contracts at the network edge.
  // - whitelist: Strips out any properties not explicitly defined in the DTO.
  // - forbidNonWhitelisted: Throws an error if the payload contains unknown properties (prevents prototype pollution/injection).
  // - transform: Automatically casts payloads into their corresponding DTO class instances.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    helmet({
      hsts:
        process.env.NODE_ENV === 'production'
          ? undefined
          : false,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  });

  // Binds the server to all network interfaces ('0.0.0.0') to ensure compatibility with Docker and Cloud environments.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error('Error starting server:', err);
});
