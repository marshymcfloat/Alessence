import { Module } from '@nestjs/common';
import { StudySessionController } from './study-session.controller';
import { StudySessionService } from './study-session.service';
import { DbModule } from 'src/db/db.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [StudySessionController],
  providers: [StudySessionService],
})
export class StudySessionModule {}

