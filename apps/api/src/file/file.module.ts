import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { DbModule } from 'src/db/db.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
