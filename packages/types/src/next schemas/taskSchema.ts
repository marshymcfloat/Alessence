import { TaskStatusEnum } from "@repo/db";
import z from "zod";

const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: "Title is required" })
      .max(50, { message: "Title should not exceed 50 characters" }),
    description: z
      .string()
      .max(500, { message: "Description should not exceed 500 characters" })
      .optional(),
    deadline: z.date(),
    status: z.nativeEnum(TaskStatusEnum),
    subject: z.number().optional(),
  })
  .refine((value) => value.deadline >= startOfToday, {
    message: "Deadline cannot be in the past",
    path: ["deadline"],
  });
export type CreateTaskTypes = z.infer<typeof createTaskSchema>;
export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type TaskSubjectInput = z.output<typeof z.coerce.number>;
