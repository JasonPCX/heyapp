import express from "express";

import verifyAuth from "#middlewares/verify-auth.middleware.js";
import {
  getMessagesByChatId,
  saveMessage,
} from "#controllers/messages.controller.js";
import { validateRequest } from "#middlewares/request-validator.middleware.js";
import { createMessageRequestSchema, getMessagesByChatIdRequestSchema } from "#schemas/message.schemas.js";

const router = express.Router();

router.get(
  "/:chatId",
  [verifyAuth, validateRequest(getMessagesByChatIdRequestSchema)],
  getMessagesByChatId
);
router.post(
  "/",
  [verifyAuth, validateRequest(createMessageRequestSchema)],
  saveMessage
);

export default router;
