import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Instantiate the Prisma Client
const prisma = new PrismaClient();

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  // Function to test database connection
  async testDatabaseConnection() {
    try {
      // Tries to count how many users exist in the DB
      const userCount = await prisma.user.count();
      return {
        status: 'Success',
        message: 'Connected to PostgreSQL!',
        users_in_db: userCount,
      };
    } catch (error) {
      // Log the error to the terminal for debugging
      console.error('Database error:', error);

      return {
        status: 'Error',
        message: 'Could not connect to the database.',
      };
    }
  }
}
