import { API } from "./apiInstance";
import type { Chat, ChatInfoResponse, ChatPreview } from "@/types/chat";
import type { SuccessResponse } from "@/types/api";

const RESOURCE = "chats";

export async function getUserChats() {
  const response = await API.get<SuccessResponse<ChatPreview[]>>(`/${RESOURCE}`);
  return response.data;
}

export async function getChatById(chatId: string) {
  const response = await API.get<ChatInfoResponse>(
    `/${RESOURCE}/${chatId}`
  );
  return response.data;
}

export async function createChat(userId: string) {
  const response = await API.post<
    Record<string, string>,
    SuccessResponse<Chat>
  >(`/${RESOURCE}/direct`, { userId });
  return response.data;
}
