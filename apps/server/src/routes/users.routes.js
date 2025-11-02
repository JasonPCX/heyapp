import express from "express";

import verifyAuth from "#middlewares/verify-auth.middleware.js";
import { getUsers } from "#controllers/users.controller.js";

const router = express.Router();

router.get("/", [verifyAuth], getUsers);

export default router;
