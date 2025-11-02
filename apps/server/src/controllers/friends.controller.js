import { UserService } from "#services/user.service.js";
import asyncCatch from "#utils/asyncCatch.js";
import { StatusCodes } from "http-status-codes";

export const getUserFriends = asyncCatch(async (req, res) => {
  const userId = req.user.id;

  const friends = await UserService.getFriends(userId);

  return res.status(StatusCodes.OK).json({
    data: friends,
  });
});
