import { StatusCodes } from "http-status-codes";

import { compareHash } from "#utils/generateHash.js";
import asyncCatch from "#utils/asyncCatch.js";
import { BadRequestException, NotFoundException } from "#utils/HttpError.js";
import { signData } from "#utils/jwt.js";
import { UserService } from "#services/user.service.js";

export const signUp = asyncCatch(async (req, res) => {
  const data = req.body;

  const user = await UserService.getUserByEmail(data.email);

  if (user) {
    throw new BadRequestException(
      "The email provided is already in use",
      req.originalUrl,
      {
        email: data.email,
      }
    );
  }

  const newUser = await UserService.register(data);

  return res.status(StatusCodes.CREATED).json({
    message: "Your account has been created successfully! Please log in to get started.",
    data: newUser,
  });
});

export const logIn = asyncCatch(async (req, res) => {
  const data = req.body;

  const user = await UserService.getUserByEmail(data.email);

  if (!user) {
    throw new BadRequestException(
      "Invalid email or password",
      req.originalUrl,
      data
    );
  }

  const passwordMatch = await compareHash(data.password, user.password);

  if (!passwordMatch) {
    throw new BadRequestException(
      "Invalid email or password",
      req.originalUrl,
      { password: data.password }
    );
  }

  const token = signData({
    id: user.id,
    name: user.name,
    email: user.email,
  });

  return res.json({
    message: "Logged in successfully. Welcome back!",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

export const me = asyncCatch(async (req, res, next) => {
  const userData = await UserService.findById(req.user.id);

  if (!userData) {
    throw new NotFoundException(
      "User not found",
      req.originalUrl,
      req.user.id
    );
  }

  return res.json(userData);
});

export const resetPassword = asyncCatch(async (req, res, next) => {});

export const recoverPassword = asyncCatch(async (req, res, next) => {});
