import type { SuccessResponse, User } from "@/types";
import { API } from "./apiInstance";

const RESOURCE = "users";

export async function getUsers(query: Record<string, string>) {
    const searchQuery = new URLSearchParams(query);
  const response = await API.get<SuccessResponse<User[]>>(
    `/${RESOURCE}?${searchQuery}`
  );
  return response.data;
}