import FriendRequestService from "#services/friend-request.service.js";
import { z } from "zod";

export const getUserFriendRequestsSchema = z.object({
  status: z.array(z.enum(Object.values(FriendRequestService.friendRequestStatus))),
  type: z.enum(Object.values(FriendRequestService.friendRequestTypes)),
});
