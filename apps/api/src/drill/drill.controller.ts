import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DrillService } from './drill.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from '../auth/decorator/get-user.decorator';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  IsNumber,
} from 'class-validator';

export class GenerateDrillDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  @IsOptional()
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @IsNumber()
  @IsOptional()
  subjectId?: number;
}

export class GenerateAuditDrillDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  @IsOptional()
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @IsNumber()
  @IsOptional()
  subjectId?: number;
}

@Controller('drill')
@UseGuards(AuthGuard('jwt'))
export class DrillController {
  constructor(private readonly drillService: DrillService) {}

  /**
   * Generate a variable math problem with randomized numbers
   */
  @Post('math')
  async generateMathDrill(
    @Body() dto: GenerateDrillDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.drillService.generateMathDrill(dto, user.userId);
  }

  /**
   * Generate a step-by-step audit/computation problem
   * Shows detailed computation trace like a professor's whiteboard
   */
  @Post('audit')
  async generateAuditDrill(
    @Body() dto: GenerateAuditDrillDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.drillService.generateAuditDrill(dto, user.userId);
  }
}
