import { type SuccessResponse, type User } from "@/types";
import { API } from "./apiInstance";

const RESOURCE = "friends";

export async function getUserFriends() {
  const response = await API.get<SuccessResponse<User[]>>(`/${RESOURCE}`);

  return response.data;
}
