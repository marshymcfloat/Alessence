import { createZodDto } from "nestjs-zod";
import z from "zod";

export const createSummaryBackendSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(200, { message: "Title should not exceed 200 characters" }),

  description: z
    .string()
    .min(1, { message: "Description is required" })
    .max(2000, { message: "Description should not exceed 2000 characters" }),

  subjectId: z.coerce
    .number({ error: "Subject ID must be a number" })
    .optional(),

  template: z
    .enum([
      "COMPREHENSIVE",
      "KEY_POINTS",
      "CHAPTER_SUMMARY",
      "CONCEPT_MAP",
      "CUSTOM",
    ])
    .optional()
    .default("COMPREHENSIVE"),

  existingFileIds: z
    .preprocess(
      (val) => (Array.isArray(val) ? val : [val].filter(Boolean)),
      z.array(z.coerce.number())
    )
    .optional(),
});

export class CreateSummaryDto extends createZodDto(createSummaryBackendSchema) {}

