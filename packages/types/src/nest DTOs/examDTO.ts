import { createZodDto } from "nestjs-zod";
import z from "zod";

export const createExamBackendSchema = z.object({
  describe: z
    .string()
    .min(1, { message: "This field is required" })
    .max(2000, { message: "This field should not exceed 2000 characters" }),

  items: z.coerce
    .number<number>({ error: "Items must be a number" })
    .min(1, { message: "Must have at least 1 item" }),

  subjectId: z.coerce
    .number({ error: "Subject ID must be a number" })
    .min(1, "A subject is required"),

  questionTypes: z
    .array(z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "IDENTIFICATION"]))
    .min(1, { message: "At least one question type must be selected" }),

  existingFileIds: z
    .preprocess(
      (val) => (Array.isArray(val) ? val : [val].filter(Boolean)),
      z.array(z.coerce.number())
    )
    .optional(),
});

export class CreateExamDto extends createZodDto(createExamBackendSchema) {}
