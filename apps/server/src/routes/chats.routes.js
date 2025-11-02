import express from "express";

import {
  findOrCreateDirectChatByMembersIds,
  getChat,
  getUserChats,
} from "#controllers/chats.controller.js";
import { validateRequest } from "#middlewares/request-validator.middleware.js";
import verifyAuth from "#middlewares/verify-auth.middleware.js";
import {
  findOrCreateDirectChatRequestSchema,
  getChatByIdRequestSchema,
} from "#schemas/chat.schemas.js";

const router = express.Router();

router.get("/", [verifyAuth], getUserChats);
router.get(
  "/:id",
  [verifyAuth, validateRequest(getChatByIdRequestSchema)],
  getChat
);
router.post(
  "/direct",
  [verifyAuth, validateRequest(findOrCreateDirectChatRequestSchema)],
  findOrCreateDirectChatByMembersIds
);

export default router;
