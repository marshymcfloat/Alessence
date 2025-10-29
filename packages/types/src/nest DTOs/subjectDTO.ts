import { createZodDto } from "nestjs-zod";
import { createSubjectSchema } from "../next schemas/subjectSchema";

export class CreateSubjectDTO extends createZodDto(createSubjectSchema) {}
