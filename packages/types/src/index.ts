export * from "./next schemas/authSchemas";
export * from "./next schemas/subjectSchema";

export type SafeUser = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
};
