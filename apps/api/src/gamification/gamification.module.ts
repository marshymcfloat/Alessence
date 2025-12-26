import { Module, OnModuleInit } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule implements OnModuleInit {
  constructor(private readonly gamificationService: GamificationService) {}

  async onModuleInit() {
    // Seed achievements on app startup
    await this.gamificationService.seedAchievements();
  }
}

