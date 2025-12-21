import { z } from "zod";

export const createFlashcardDeckSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  subjectId: z.number().int().optional().nullable(),
  sourceFileId: z.number().int().optional().nullable(),
});

export const updateFlashcardDeckSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  subjectId: z.number().int().optional().nullable(),
});

export const createFlashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  frontImageUrl: z
    .string()
    .refine(
      (val) => val === "" || z.string().url().safeParse(val).success,
      { message: "Must be a valid URL or empty" }
    )
    .transform((val) => (val === "" ? null : val))
    .optional()
    .nullable(),
  backImageUrl: z
    .string()
    .refine(
      (val) => val === "" || z.string().url().safeParse(val).success,
      { message: "Must be a valid URL or empty" }
    )
    .transform((val) => (val === "" ? null : val))
    .optional()
    .nullable(),
  deckId: z.number().int(),
});

export const updateFlashcardSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
  frontImageUrl: z
    .string()
    .refine(
      (val) => val === "" || z.string().url().safeParse(val).success,
      { message: "Must be a valid URL or empty" }
    )
    .transform((val) => (val === "" ? null : val))
    .optional()
    .nullable(),
  backImageUrl: z
    .string()
    .refine(
      (val) => val === "" || z.string().url().safeParse(val).success,
      { message: "Must be a valid URL or empty" }
    )
    .transform((val) => (val === "" ? null : val))
    .optional()
    .nullable(),
});

export const reviewFlashcardSchema = z.object({
  cardId: z.number().int(),
  quality: z.number().int().min(1).max(4), // 1=Again, 2=Hard, 3=Good, 4=Easy
  timeSpent: z.number().int().min(0).optional(),
});

export type CreateFlashcardDeckTypes = z.infer<typeof createFlashcardDeckSchema>;
export type UpdateFlashcardDeckTypes = z.infer<typeof updateFlashcardDeckSchema>;
export type CreateFlashcardTypes = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardTypes = z.infer<typeof updateFlashcardSchema>;
export type ReviewFlashcardTypes = z.infer<typeof reviewFlashcardSchema>;

