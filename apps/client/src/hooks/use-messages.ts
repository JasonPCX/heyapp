import socket from "@/lib/sockets";
import { getUserChats } from "@/services/chatServices";
import { sendMessage } from "@/services/messageServices";
import { useBoundStore } from "@/stores/useBoundStore";
import type { Message, SuccessResponse } from "@/types";
import type { ChatMessagesResponse, ChatPreview } from "@/types/chat";
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { useNotification } from "./use-notification";

export const useSendMessageMutation = (chatId: string) => {
  const currentUser = useBoundStore((state) => state.user);

  return useMutation({
    mutationKey: ["new-message"],
    mutationFn: async (newMessage: {
      id: string;
      chatId: string;
      text: string;
    }) =>
      new Promise(async (resolve, reject) => {
        const response = await socket.emitWithAck("message:send", newMessage);
        if (!response) {
          return reject(null);
        }

        switch (response.status) {
          case "OK":
            return resolve(response.data);
          case "ERROR":
            return reject(response);
          default:
            return reject(null);
        }
      }),
    async onMutate(variables, context) {
      // cancel any outgoing chat messages refetch so they don't override our optimistic update
      await context.client.cancelQueries({
        queryKey: ["chats", chatId, "messages"],
      });
      // snapshot the previous pages structure
      const previous = context.client.getQueryData([
        "chats",
        chatId,
        "messages",
      ]);

      // new message body
      const optimisticMessage: Message = {
        id: variables.id,
        userId: currentUser.id,
        messageDirection: "outgoing",
        createdAt: new Date().toISOString(),
        createdAtFormatted: dayjs().calendar(),
        user: currentUser,
        text: variables.text,
        chatId: variables.chatId,
      };

      // optimistically append to the last page of the infinite cache
      context.client.setQueryData(
        ["chats", chatId, "messages"],
        (old: InfiniteData<ChatMessagesResponse>) => {
          if (!old) {
            return {
              pageParams: [0],
              pages: [
                {
                  data: [optimisticMessage],
                  pagination: { count: 0, hasMore: false, offset: 0 },
                },
              ],
            };
          }

          // Getting the last page
          const oldLastPage = old.pages[old.pages.length - 1];
          const lastPage =
            oldLastPage !== undefined && oldLastPage !== null
              ? {
                  ...oldLastPage,
                }
              : {
                  data: [],
                  pagination: {
                    count: 0,
                    hasMore: false,
                    offset: 0,
                  },
                };

          const updatedLastPage = {
            ...lastPage,
            data: [...lastPage.data, optimisticMessage],
            pagination: {
              ...lastPage.pagination,
              count: lastPage.data.length + 1,
            },
          };

          // Returning updated pages
          return {
            ...old,
            pages: [...old.pages.slice(0, -1), updatedLastPage],
          };
        }
      );

      return { previous };
    },
    async onSuccess(_data, _variables, _onMutateResult, context) {
      // invalidate so server state replaces optimistic entry
      await context.client.invalidateQueries({
        queryKey: ["chats", chatId, "messages"],
      });

      // also invalidate chats list for the user
      await context.client.invalidateQueries({
        queryKey: ["chats", currentUser.id],
      });

      await context.client.invalidateQueries({
        queryKey: ["chats-preview"],
      });
    },

    onError(error, _newTodo, onMutateResult, context) {
      // Using the context returned from onMutate to rollback
      context.client.setQueryData(
        ["chats", chatId, "messages"],
        onMutateResult?.previous
      );
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message);
        return;
      }

      toast.error(error.message);
    },
  });
};

export const useListenNewMessage = () => {
  const currentUser = useBoundStore((state) => state.user);
  const queryClient = useQueryClient();
  let location = useLocation();
  const { fireNotification } = useNotification();

  useEffect(() => {
    socket.on("message:new", async (newMessage) => {
      const chatId = newMessage.chatId;

      // getting cached chats preview data, if not exist getUserChats will be called and cached, its just
      const chatsPreviewList = await queryClient.ensureQueryData<
        SuccessResponse<ChatPreview[]>
      >({
        queryKey: ["chats-preview"],
        queryFn: getUserChats,
      });

      // check if chat is in cached chats
      const existChatInCache = chatsPreviewList.data.some(
        (chat) => chat.id === chatId
      );

      // retrieving fresh chats previews in order to load missing one
      if (!existChatInCache) {
        queryClient.invalidateQueries({
          queryKey: ["chats-preview"],
        });
      }

      queryClient.setQueryData(["chats-preview"], (old: any) => {
        if (!old?.data) return old;

        const updatedChats = old.data.map((chat: ChatPreview) => {
          if (chat.id === chatId) {
            return {
              ...chat,
              lastMessageText: newMessage.text,
              lastMessageAt: newMessage.createdAt,
              lastMessageAtFormatted: newMessage.createdAtFormatted,
              lastMessageUserName: newMessage.user.name,
            };
          }
          return chat;
        });

        // Sorting by most recent message
        const chatIndex = updatedChats.findIndex(
          (chat: ChatPreview) => chat.id === chatId
        );
        if (chatIndex > 0) {
          const [movedChat] = updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(movedChat);
        }

        return { ...old, data: updatedChats };
      });

      if (newMessage.user.id === currentUser.id) {
        return;
      }

      queryClient.setQueryData(["chats", chatId, "messages"], (old: any) => {
        if (!old?.pages) return old;
        const lastPage = old.pages[old.pages.length - 1];

        // Evitar duplicados
        const messageExists = lastPage.data.some(
          (m: Message) => m.id === newMessage.id
        );

        if (messageExists) return old;

        const messageData = {
          ...newMessage,
          messageDirection:
            newMessage.userId === currentUser.id ? "outgoing" : "incoming",
        };

        const updatedLastPage = {
          ...lastPage,
          data: [...lastPage.data, messageData],
        };

        return {
          ...old,
          pages: [...old.pages.slice(0, -1), updatedLastPage],
        };
      });

      const chatPathName = `/chats/${chatId}`;

      // treat chat as open if pathname equals or is a sub-route of the chat
      const isChatOpen =
        location?.pathname === chatPathName ||
        location?.pathname?.startsWith(`${chatPathName}/`);

      if (!isChatOpen) {
        fireNotification("HeyApp", {
          body: "You have a new message",
          data: { chatId },
        });
      }
    });

    return () => {
      socket.removeAllListeners("message:new");
    };
  }, [queryClient, location]);
};
