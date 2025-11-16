import { Controller, Get } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Controller('health')
export class HealthController {
  constructor(private readonly dbService: DbService) {}

  @Get()
  async check() {
    try {
      await this.dbService.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
