import { Module } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { DbModule } from 'src/db/db.module';
import { AuthModule } from 'src/auth/auth.module';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [DbModule, AuthModule, GeminiModule],
  controllers: [SubjectController],
  providers: [SubjectService],
})
export class SubjectModule {}
