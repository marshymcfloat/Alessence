import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const createFlashcardDeckBackendSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  subjectId: z.number().int().optional().nullable(),
  sourceFileId: z.number().int().optional().nullable(),
});

const updateFlashcardDeckBackendSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  subjectId: z.number().int().optional().nullable(),
});

const createFlashcardBackendSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  frontImageUrl: z.string().url().optional().nullable(),
  backImageUrl: z.string().url().optional().nullable(),
  deckId: z.number().int(),
});

const updateFlashcardBackendSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
  frontImageUrl: z.string().url().optional().nullable(),
  backImageUrl: z.string().url().optional().nullable(),
});

const reviewFlashcardBackendSchema = z.object({
  cardId: z.number().int(),
  quality: z.number().int().min(1).max(4),
  timeSpent: z.number().int().min(0).optional(),
});

export class CreateFlashcardDeckDTO extends createZodDto(createFlashcardDeckBackendSchema) {}
export class UpdateFlashcardDeckDTO extends createZodDto(updateFlashcardDeckBackendSchema) {}
export class CreateFlashcardDTO extends createZodDto(createFlashcardBackendSchema) {}
export class UpdateFlashcardDTO extends createZodDto(updateFlashcardBackendSchema) {}
export class ReviewFlashcardDTO extends createZodDto(reviewFlashcardBackendSchema) {}

