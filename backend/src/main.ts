import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // TODO: [Feature - Security] Lock down CORS for production.
  // Replace the default open CORS policy with an explicit array of allowed frontend origins (e.g., origin: ['https://fazelo.com']).
  app.enableCors();

  // Binds the server to all network interfaces ('0.0.0.0') to ensure compatibility with Docker and Cloud environments.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error('Error starting server:', err);
});
