import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { ConfigModule } from '@nestjs/config';
import { SubjectModule } from './subject/subject.module';
import { TaskModule } from './task/task.module';
import { ExamModule } from './exam/exam.module';
import { FileModule } from './file/file.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GeminiModule } from './gemini/gemini.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    AuthModule,
    DbModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SubjectModule,
    TaskModule,
    ExamModule,
    FileModule,
    GeminiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
