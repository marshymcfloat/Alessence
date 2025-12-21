import { SessionTypeEnum, SessionStatusEnum } from "@repo/db";
import z from "zod";

export const createStudySessionSchema = z.object({
  type: z.nativeEnum(SessionTypeEnum),
  duration: z.number().int().positive({ message: "Duration must be positive" }),
  subjectId: z.number().optional(),
});

export const updateStudySessionSchema = z.object({
  status: z.nativeEnum(SessionStatusEnum).optional(),
  actualDuration: z.number().int().positive().optional(),
  pausedDuration: z.number().int().nonnegative().optional(),
});

export type CreateStudySessionTypes = z.infer<typeof createStudySessionSchema>;
export type UpdateStudySessionTypes = z.infer<typeof updateStudySessionSchema>;

