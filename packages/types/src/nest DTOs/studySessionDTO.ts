import { createZodDto } from "nestjs-zod";
import { createStudySessionSchema, updateStudySessionSchema } from "../next schemas/studySessionSchema";

export class CreateStudySessionDTO extends createZodDto(createStudySessionSchema) {}
export class UpdateStudySessionDTO extends createZodDto(updateStudySessionSchema) {}

