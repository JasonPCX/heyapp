import { z } from "zod";

export const getMessagesByChatIdRequestSchema = z.object({
  params: z.object({
    chatId: z.uuidv4(),
  }),
  query: z.object({
    offset: z.coerce.number().min(0).optional(),
    size: z.coerce.number().min(1).max(100).optional(),
  }),
});

export const messageSchema = z.object({
  id: z.uuidv4(),
  userId: z.uuidv4(),
  chatId: z.uuidv4(),
  text: z.string().max(500),
});

export const createMessageRequestSchema = z.object({
  body: messageSchema.pick({
    id: true,
    chatId: true,
    text: true,
  }),
});
