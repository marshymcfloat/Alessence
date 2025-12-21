import { z } from "zod";

export const createGoalSchema = z.object({
  periodType: z.enum(["DAILY", "WEEKLY"]),
  targetMinutes: z.number().int().min(1).max(10080), // Max 7 days * 24 hours = 10080 minutes
  subjectId: z.number().int().optional().nullable(),
  startDate: z.string().datetime().optional(),
});

export const updateGoalSchema = z.object({
  periodType: z.enum(["DAILY", "WEEKLY"]).optional(),
  targetMinutes: z.number().int().min(1).max(10080).optional(),
  subjectId: z.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
});

export type CreateGoalTypes = z.infer<typeof createGoalSchema>;
export type UpdateGoalTypes = z.infer<typeof updateGoalSchema>;
