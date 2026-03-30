import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Prisma 7 can use a driver adapter instead of relying only on the datasource URL
    // inside schema.prisma. Here we bind Prisma to our PostgreSQL connection string.
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });

    // We pass the adapter to the generated Prisma Client so the whole app uses
    // the same database configuration through Nest dependency injection.
    super({ adapter });
  }

  // Called automatically by Nest when the module is initialized.
  // This ensures the database connection is opened as the app starts.
  async onModuleInit() {
    await this.$connect();
  }

  // Called automatically when Nest shuts the application down.
  // This helps Prisma close the database connection cleanly.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
