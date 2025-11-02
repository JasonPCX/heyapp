import { StatusCodes } from "http-status-codes";

import FriendRequestService from "#services/friend-request.service.js";
import asyncCatch from "#utils/asyncCatch.js";
import { getUserFriendRequestsSchema } from "#schemas/friends-requests.schemas.js";

export const getUserFriendRequests = asyncCatch(async (req, res) => {
  const userData = req.user;

  const rawQuery = {
    type: req.query.type,
    status: req.query.status.split("|"),
  };

  const validatedQuery = getUserFriendRequestsSchema.parse(rawQuery);

  const friendRequests = await FriendRequestService.getFriendRequestsWithRelations(
    validatedQuery.type,
    userData.id,
    validatedQuery.status
  );

  return res.status(StatusCodes.OK).json({
    data: friendRequests,
  });
});
