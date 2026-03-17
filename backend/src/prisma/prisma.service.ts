// backend/src/prisma/prisma.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

    // Create adapter with URL string
    const adapter = new PrismaBetterSqlite3({
      url: databaseUrl.replace('file:', ''),
    });

    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to database');

      // Test query to verify DB is working
      const userCount = await this.user.count();
      this.logger.log(`Current users in DB: ${userCount}`);
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }
}
