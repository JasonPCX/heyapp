import { z } from "zod";
import { idParamsSchema } from "./common.schemas.js";

export const findOrCreateDirectChatRequestSchema = z.object({
  body: z.object({
    userId: z.uuidv4(),
  }),
});

export const getChatByIdRequestSchema = z.object({
  params: idParamsSchema,
});
