import { API } from "./apiInstance";
import { type ChatMessagesResponse, type Message } from "@/types/chat";
import type { SuccessResponse } from "@/types/api";

const RESOURCE = "messages";

export async function getMessagesByChatId(
  chatId: string,
  queryOptions: {
    offset: number;
    size?: number;
  }
) {
  const params = new URLSearchParams();
  Object.entries(queryOptions).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });
  const response = await API.get<ChatMessagesResponse>(
    `/${RESOURCE}/${chatId}?${params.toString()}`
  );
  return response.data;
}

export async function sendMessage(data: { chatId: string; text: string }) {
  const response = await API.post<typeof data, SuccessResponse<Message>>(
    `/${RESOURCE}`,
    data
  );
  return response.data;
}
