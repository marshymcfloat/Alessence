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
import { HealthModule } from './health/health.module';
import { SummaryModule } from './summary/summary.module';
import { StudySessionModule } from './study-session/study-session.module';
import { NoteModule } from './note/note.module';
import { SearchModule } from './search/search.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CalendarModule } from './calendar/calendar.module';
import { GoalModule } from './goal/goal.module';
import { FlashcardModule } from './flashcard/flashcard.module';

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
    HealthModule,
    SummaryModule,
    StudySessionModule,
    NoteModule,
    SearchModule,
    AnalyticsModule,
    CalendarModule,
    GoalModule,
    FlashcardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
