import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { ConfigModule } from '@nestjs/config';
import { SubjectModule } from './subject/subject.module';
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    AuthModule,
    DbModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SubjectModule,
    TaskModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
