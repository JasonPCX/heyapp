import { z } from "zod";

const signUpSchema = z
  .object({
    name: z.string().min(2).max(50),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const logInSchema = signUpSchema.pick({
    email: true,
    password: true,
})

export const signUpRequestSchema = z.object({
    body: signUpSchema,
});

export const logInRequestSchema = z.object({
    body: logInSchema,
})