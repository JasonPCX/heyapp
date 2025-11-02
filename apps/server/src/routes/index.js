import express from "express";

import authRouter from "./auth.routes.js";
import usersRouter from "./users.routes.js";
import chatsRouter from "./chats.routes.js";
import messagesRouter from "./messages.routes.js";
import friendsRouter from "./friends.routes.js";
import friendRequestsRouter from "./friend-requests.routes.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter)
router.use("/chats", chatsRouter);
router.use("/messages", messagesRouter);
router.use("/friends", friendsRouter);
router.use("/friend-requests", friendRequestsRouter);

export default router;
