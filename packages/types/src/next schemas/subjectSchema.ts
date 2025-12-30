import z from "zod";

import { SemesterEnum } from "@repo/db";
export const createSubjectSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(100, { message: "Title should not exceed 100 characters" }),
  description: z
    .string()
    .max(500, { message: "Description should not exceed of 500 characters" })
    .optional(),
  semester: z.enum(SemesterEnum),
});

export type CreateSubjectTypes = z.infer<typeof createSubjectSchema>;

export const createTopicSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(100, { message: "Title should not exceed 100 characters" }),
  subjectId: z.number().int(),
  parentId: z.number().int().optional(),
  order: z.number().int().default(0),
});

export type CreateTopicTypes = z.infer<typeof createTopicSchema>;