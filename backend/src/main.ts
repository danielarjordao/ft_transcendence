import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create the NestJS application using the root module (AppModule)
  const app = await NestFactory.create(AppModule);

  // Set a global prefix for all routes (e.g., /api/workspaces instead of just /workspaces)
  app.setGlobalPrefix('api');

  // Use a global validation pipe to automatically validate incoming requests based on our DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS to allow requests from the frontend (running on a different port)
  app.enableCors();

  // Start the server on the specified port (default to 3000 if not set in environment variables)
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

// Call the bootstrap function to start the server, and catch any errors that occur during startup
bootstrap().catch((err) => {
  console.error('Error starting server:', err);
});
