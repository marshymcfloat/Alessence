import { z } from "zod";
import { File as DBFile } from "@repo/db";

// Union type for files: either a browser File or a database File
export type SummaryFileInput = File | DBFile;

export const createNewSummarySchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(200, { message: "Title should not exceed 200 characters" }),

  description: z
    .string()
    .min(1, { message: "Description is required" })
    .max(2000, { message: "Description should not exceed 2000 characters" })
    .describe("Describe what the summary should focus on"),

  files: z
    .array(z.custom<SummaryFileInput>())
    .refine(
      (files) =>
        files.length > 0 &&
        files.every((file) => file !== undefined && file !== null),
      {
        message: "Please select an existing file or upload a new one.",
      }
    ),

  subjectId: z.coerce
    .number<number>({
      error: "Please select a subject for this summary.",
    })
    .optional(),

  template: z.enum([
    "COMPREHENSIVE",
    "KEY_POINTS",
    "CHAPTER_SUMMARY",
    "CONCEPT_MAP",
    "CUSTOM",
  ]),
});

export type CreateNewSummaryTypes = z.infer<typeof createNewSummarySchema>;
