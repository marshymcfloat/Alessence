import { Subject, Task } from "@repo/db";

export * from "./next schemas/authSchemas";
export * from "./next schemas/subjectSchema";
export * from "./next schemas/taskSchema";

export type SafeUser = {
  id: String;
  email: String;
  createdAt: Date;
  updatedAt: Date;
  name: String;
};

export type GetAllSubjectReturnType = {
  subjects: Subject[];
  userId: String;
};

export type ActionReturnType<T = any> = {
  success: boolean;
  error?: String;
  message?: String;
  data?: T;
};

export type CreateNewSubjectReturnType = {
  newSubject: Subject;
  userId: String;
};

export type CreateNewTaskReturnType = {
  newTask: Task;
  userId: String;
};
