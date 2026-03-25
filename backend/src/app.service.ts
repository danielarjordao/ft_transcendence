import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async testDatabaseConnection() {
    try {
      const userCount = await this.prisma.user.count();
      return {
        status: 'Success',
        message: 'Connected to PostgreSQL!',
        users_in_db: userCount,
      };
    } catch (error) {
      console.error('Database error:', error);

      return {
        status: 'Error',
        message: 'Could not connect to the database.',
      };
    }
  }
}
