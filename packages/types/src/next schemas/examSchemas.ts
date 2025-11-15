import { z } from "zod";

export const createNewExamSchema = z.object({
  describe: z
    .string()
    .min(1, { message: "This field is required" })
    .max(2000, { message: "This field should not exceed 2000 characters" }),

  items: z.coerce
    .number<number>({ error: "Please select the number of items" })
    .min(1, { message: "Must have at least 1 item" }),

  files: z
    .array(z.any())
    .refine((file) => file !== undefined && file !== null, {
      message: "Please select an existing file or upload a new one.",
    }),
  subjectId: z.coerce.number<number>({
    error: "Please select a subject for this exam.",
  }),
  questionTypes: z
    .array(z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "IDENTIFICATION"]))
    .min(1, { message: "At least one question type must be selected" }),
});

export type CreateNewExamTypes = z.infer<typeof createNewExamSchema>;
