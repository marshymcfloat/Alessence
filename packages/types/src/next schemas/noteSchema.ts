import z from "zod";

export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(200, { message: "Title should not exceed 200 characters" }),
  content: z.string().min(1, { message: "Content is required" }),
  isMarkdown: z.boolean().default(false),
  subjectId: z.number().optional(),
  fileId: z.number().optional(),
  taskId: z.number().optional(),
  tagIds: z.array(z.number()).optional(),
});

export const updateNoteSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(200, { message: "Title should not exceed 200 characters" })
    .optional(),
  content: z.string().min(1, { message: "Content is required" }).optional(),
  isMarkdown: z.boolean().optional(),
  subjectId: z.number().nullable().optional(),
  fileId: z.number().nullable().optional(),
  taskId: z.number().nullable().optional(),
  tagIds: z.array(z.number()).optional(),
});

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Tag name is required" })
    .max(50, { message: "Tag name should not exceed 50 characters" }),
  color: z.string().optional(),
  description: z.string().max(200).optional(),
});

export type CreateNoteTypes = z.infer<typeof createNoteSchema>;
export type UpdateNoteTypes = z.infer<typeof updateNoteSchema>;
export type CreateTagTypes = z.infer<typeof createTagSchema>;

