import { createZodDto } from "nestjs-zod";
import { createSubjectSchema, createTopicSchema } from "../next schemas/subjectSchema";

export class CreateSubjectDTO extends createZodDto(createSubjectSchema) {}
export class CreateTopicDTO extends createZodDto(createTopicSchema) {}
