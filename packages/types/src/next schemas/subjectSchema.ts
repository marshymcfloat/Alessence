import z from "zod";

import { SemesterEnum } from "@repo/db/enums";
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
