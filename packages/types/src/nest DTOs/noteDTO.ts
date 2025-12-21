import { createZodDto } from "nestjs-zod";
import {
  createNoteSchema,
  updateNoteSchema,
  createTagSchema,
} from "../next schemas/noteSchema";

export class CreateNoteDTO extends createZodDto(createNoteSchema) {}
export class UpdateNoteDTO extends createZodDto(updateNoteSchema) {}
export class CreateTagDTO extends createZodDto(createTagSchema) {}

