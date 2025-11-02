import { UserService } from "#services/user.service.js";
import asyncCatch from "#utils/asyncCatch.js";

export const getUsers = asyncCatch(async (req, res, next) => {
  const { q: searchQuery } = req.query;
  const userData = req.user;

  if (
    searchQuery !== undefined &&
    searchQuery !== null &&
    searchQuery.trim() !== "" &&
    searchQuery.trim().length < 3
  ) {
    return res.status(200).json({
      data: [],
    });
  }

  const users = await UserService.searchUsers(
    {
      emailOrNameStr: searchQuery,
    },
    [userData.id]
  );

  return res.status(200).json({
    data: users,
  });
});