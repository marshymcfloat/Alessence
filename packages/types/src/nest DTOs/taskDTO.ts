import { createZodDto } from "nestjs-zod";
import { createTaskSchema } from "../next schemas/taskSchema";

export class CreateTaskDTO extends createZodDto(createTaskSchema) {}
