import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const createGoalBackendSchema = z.object({
  periodType: z.enum(["DAILY", "WEEKLY"]),
  targetMinutes: z.number().int().min(1).max(10080),
  subjectId: z.number().int().optional().nullable(),
  startDate: z.string().datetime().optional(),
});

const updateGoalBackendSchema = z.object({
  periodType: z.enum(["DAILY", "WEEKLY"]).optional(),
  targetMinutes: z.number().int().min(1).max(10080).optional(),
  subjectId: z.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
});

export class CreateGoalDTO extends createZodDto(createGoalBackendSchema) {}
export class UpdateGoalDTO extends createZodDto(updateGoalBackendSchema) {}
