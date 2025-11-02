import dayjs from "dayjs";

import { ChatMemberService } from "#services/chat-member.service.js";
import { MessageService } from "#services/message.service.js";
import logger from "#utils/logger.js";
import { onlineUsersKey, userSocketIdKey } from "#utils/redis.js";
import { chatRoom, userRoom } from "#utils/socket.js";
import { z } from "zod";


const validateNewMessage = z.object({
  id: z.uuid(),
  chatId: z.uuid(),
  text: z.string().min(1).max(500),
});

/**
 * Handles message-related socket events.
 *
 * @async
 * @param {Object} args
 * @param {import("socket.io").Socket} args.socket - Socket.IO socket instance
 * @param {import("socket.io").Server} args.io - Socket.IO server instance
 * @param {import("redis").RedisClientType} args.redisClient - Redis client instance
 * @returns {Promise<void>}
 */
export async function handleMessages({ socket, io, redisClient }) {
  socket.on("message:send", async (data, callback) => {
    const validation = validateNewMessage.safeParse(data);
    if (!validation.success) {
      return callback({
        status: "ERROR",
        errorCode: "INVALID_DATA",
        errors: z.treeifyError(validation.error),
      });
    }

    const validatedData = validation.data;
    try {
      // Making sure user has access to read  given chats messages
      const hasMemberShip = await ChatMemberService.hasMembershipToChat(
        socket.user.id,
        validatedData.chatId
      );

      if (!hasMemberShip) {
        return callback({
          status: "ERROR",
          message: "Access denied to chat information",
        });
      }

      // Storing message in database
      const newMessage = await MessageService.create({
        ...validatedData,
        userId: socket.user.id,
      });

      const formattedMessage = {
        ...newMessage,
        createdAtFormatted: dayjs.tz(newMessage.createdAt).calendar(dayjs()),
      };

      // Making sure all users are in the chat room
      const chatMembers = await ChatMemberService.getChatMembersByChatId(
        validatedData.chatId
      );

      let chatRoomMap = io.of("/").adapter.rooms.get(chatRoom(validatedData.chatId));

      if (!chatRoomMap) {
        socket.join(chatRoom(validatedData.chatId));
        chatRoomMap = io.of("/").adapter.rooms.get(chatRoom(validatedData.chatId));
      }

      // Ensure all online chat members are in the chat room
      for (const chatMember of chatMembers) {
        const userId = chatMember.userId;
        const isUserOnline = await redisClient.sIsMember(
          onlineUsersKey(),
          userId
        );

        if (!isUserOnline) {
          continue;
        }

        const socketId = await redisClient.get(userSocketIdKey(userId));
        
        // Check if socketId exists and if the socket is in the chat room
        if (socketId && !chatRoomMap.has(socketId)) {
          io.in(userRoom(userId)).socketsJoin(chatRoom(validatedData.chatId));
        }
      }

      // Emitting new message to all chat members
      socket.to(chatRoom(validatedData.chatId)).emit("message:new", formattedMessage);

      return callback({
        status: "OK",
        data: formattedMessage,
      });
    } catch (error) {
      logger.error("Error occurred while trying to send a message:", error);
      return callback({
        status: "ERROR",
        message: "Unknown error",
      });
    }
  });
}
