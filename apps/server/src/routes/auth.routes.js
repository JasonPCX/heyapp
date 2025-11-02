import express from "express";

import { validateRequest } from "#middlewares/request-validator.middleware.js";
import {
  logInRequestSchema,
  signUpRequestSchema,
} from "#schemas/auth.schemas.js";
import {
  logIn,
  me,
  recoverPassword,
  resetPassword,
  signUp,
} from "#controllers/auth.controller.js";
import verifyAuth from "#middlewares/verify-auth.middleware.js";

const router = express.Router();

router.post("/signup", [validateRequest(signUpRequestSchema)], signUp);
router.post("/login", [validateRequest(logInRequestSchema)], logIn);
router.post("/recover-password", recoverPassword);
router.post("/reset-password", resetPassword);
router.get("/me", [verifyAuth], me);

export default router;
