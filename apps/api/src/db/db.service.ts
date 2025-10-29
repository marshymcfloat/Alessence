import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@repo/db/server';

@Injectable()
export class DbService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
