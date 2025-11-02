import express from "express";

import { getUserFriends } from "#controllers/friends.controller.js";
import verifyAuth from "#middlewares/verify-auth.middleware.js";

const router = express.Router();

router.get("/", [verifyAuth], getUserFriends);

export default router;
