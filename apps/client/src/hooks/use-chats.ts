import socket from "@/lib/sockets";
import { createChat, getChatById, getUserChats } from "@/services/chatServices";
import { getMessagesByChatId } from "@/services/messageServices";
import { useBoundStore } from "@/stores/useBoundStore";
import type { SuccessResponse } from "@/types";
import type {
  ChatInfoResponse,
  ChatMessagesResponse,
  ChatPreview,
} from "@/types/chat";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect } from "react";
import { toast } from "sonner";

export const useChatsPreview = () => {
  const isAuthenticated = useBoundStore((state) => state.isAuthenticated);

  return useQuery<SuccessResponse<ChatPreview[]>>({
    queryKey: ["chats-preview"],
    queryFn: getUserChats,
    enabled: isAuthenticated,
  });
};

export const useChat = (chatId: string) => {
  const isSelectedChatId = chatId !== undefined || chatId !== null;

  return useQuery<ChatInfoResponse>({
    queryKey: ["chats", chatId],
    queryFn: () => getChatById(chatId),
    enabled: isSelectedChatId,
    placeholderData: keepPreviousData,
  });
};

export const useChats = (chatId: string) => {
  const isSelectedChatId = chatId !== undefined || chatId !== null;

  return useInfiniteQuery<ChatMessagesResponse>({
    queryKey: ["chats", chatId, "messages"],
    queryFn: ({ pageParam = 0 }) =>
      getMessagesByChatId(chatId, {
        offset: pageParam as number,
      }),
    enabled: isSelectedChatId,
    // provide an initial page param for typing + first request
    initialPageParam: 0,
    // Try to read server-provided next offset, otherwise compute by pages
    getNextPageParam: (lastPage: ChatMessagesResponse) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.offset ?? 0;
      }
      return undefined;
    },
    select: (data) => {
      // Reverse pages order so older messages are first
      return {
        pageParams: data.pageParams,
        pages: data.pages.slice().reverse(),
      };
    },
    staleTime: Infinity
  });
};

export const useCreateChatMutation = () => {
  return useMutation({
    mutationKey: ["create-or-find-chat"],
    mutationFn: createChat,
    onError(error, _variables, _onMutateResult, _context) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.message);
        return;
      }
      console.error(error);
    },
  });
};
