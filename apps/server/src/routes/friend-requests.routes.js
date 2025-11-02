import express from "express";

import { getUserFriendRequests } from "#controllers/friend-requests.controller.js";
import verifyAuth from "#middlewares/verify-auth.middleware.js";

const router = express.Router();

router.get("/", [verifyAuth], getUserFriendRequests);

export default router;
