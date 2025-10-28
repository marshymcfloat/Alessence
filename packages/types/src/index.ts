export * from "./next schemas/authSchemas";

export type SafeUser = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
};
