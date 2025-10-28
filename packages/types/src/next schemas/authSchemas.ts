import { email, z } from "zod";

export const authLoginSchema = z.object({
  email: z
    .string()
    .email({ message: "Please pass a valid email" })
    .min(1, { message: "Email is required" })
    .max(50, { message: "Email should not exceed 50 characters" }),

  password: z
    .string()
    .min(1, { message: "password is required" })
    .max(25, { message: "Password should not exceed 25 characters" }),
});

export const authRegisterSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "Name is required" })
      .max(50, { message: "Name should not exceed 50 characters" }),

    email: z
      .string()
      .email({ message: "Please pass a valid email" })
      .min(1, { message: "Email is required" })
      .max(50, { message: "Email should not exceed 50 characters" }),

    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(25, { message: "Password should not exceed 25 characters" }),

    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AuthLoginTypes = z.infer<typeof authLoginSchema>;
export type AuthRegisterTypes = z.infer<typeof authRegisterSchema>;
