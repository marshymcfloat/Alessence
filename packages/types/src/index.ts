import { File, Subject, Task } from "@repo/db";

export * from "./next schemas/authSchemas";
export * from "./next schemas/subjectSchema";
export * from "./next schemas/taskSchema";
export * from "./next schemas/examSchemas";
export * from "./next schemas/summarySchemas";
export * from "./next schemas/studySessionSchema";
export * from "./next schemas/noteSchema";
export * from "./next schemas/goalSchemas";
export * from "./next schemas/flashcardSchemas";
export type SafeUser = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
};

export type GetAllSubjectReturnType = {
  subjects: SubjectWithTaskProgress[];
  userId: string;
};

export type ActionReturnType<T = unknown> = {
  success: boolean;
  error?: string;
  message?: string;
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
  userId: string;
};

export type CreateNewTaskReturnType = {
  newTask: Task;
  userId: string;
};

export type GetAllTasksReturnType = {
  allTasks: Task[];
  userId: string;
};

export type UpdateTaskStatusReturnType = {
  updatedTask: Task;
  userId: string;
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
  userId: string;
};
