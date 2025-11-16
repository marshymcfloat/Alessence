import { File, Subject, Task } from "@repo/db";

export * from "./next schemas/authSchemas";
export * from "./next schemas/subjectSchema";
export * from "./next schemas/taskSchema";
export * from "./next schemas/examSchemas";
export type SafeUser = {
  id: String;
  email: String;
  createdAt: Date;
  updatedAt: Date;
  name: String;
};

export type GetAllSubjectReturnType = {
  subjects: SubjectWithTaskProgress[];
  userId: String;
};

export type ActionReturnType<T = unknown> = {
  success: boolean;
  error?: String;
  message?: String;
  data?: T;
};

// Task with subject relation included
export type TaskWithSubject = Task & {
  subject: {
    id: number;
    title: string;
  } | null;
};

export type CreateNewSubjectReturnType = {
  newSubject: Subject;
  userId: String;
};

export type CreateNewTaskReturnType = {
  newTask: Task;
  userId: String;
};

export type GetAllTasksReturnType = {
  allTasks: Task[];
  userId: String;
};

export type UpdateTaskStatusReturnType = {
  updatedTask: Task;
  userId: String;
};

export type SubjectWithTaskProgress = Subject & {
  taskCounts: {
    total: number;
    done: number;
    onProgress: number;
    planned: number;
  };
};

export type getAllFilesReturnType = {
  files: File[];
  userId: String;
};
