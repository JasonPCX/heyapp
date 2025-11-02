import { type FriendRequest, type SuccessResponse } from "@/types";
import { API } from "./apiInstance";

const RESOURCE = "friend-requests";

export async function getUserPendingFriendRequests() {
  const query = new URLSearchParams({
    type: "received",
    status: "pending",
  });
  const response = await API.get<SuccessResponse<FriendRequest[]>>(
    `/${RESOURCE}?${query}`
  );

  return response.data;
}
