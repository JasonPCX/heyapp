import { z } from "zod";

const envSchema = z.object({
  MODE: z.string(),
  VITE_API_URL: z.string(),
  VITE_SOCKET_URL: z.string(),
});

const result = envSchema.safeParse(import.meta.env);

if (!result.success) {
  console.error("Error while validating env file...");
  console.error(z.prettifyError(result.error));
  throw new Error("Invalid environment variables");
}

export const ENV = result.data;
