import { ChatService } from "#services/chat.service.js";
import logger from "#utils/logger.js";
import { onlineUsersKey, userSocketIdKey } from "#utils/redis.js";
import { chatRoom, userRoom } from "#utils/socket.js";

/**
 * Handle a newly established socket connection for an authenticated user.
 *
 * @async
 * @param {Object} args
 * @param {import("socket.io").Socket} args.socket - Socket.IO socket instance
 * @param {import("socket.io").Server} args.io - Socket.IO server instance
 * @param {import("redis").RedisClientType} args.redisClient - Redis client instance
 * @returns {Promise<void>}
 */
export async function handleConnection({ socket, io, redisClient }) {
  logger.info("User connected: " + socket.user.id);
  await redisClient.sAdd(onlineUsersKey(), socket.user.id);
  await redisClient.set(userSocketIdKey(socket.user.id), socket.id);

  let chats = [];

  try {
    chats = await ChatService.getUserChatsId(socket.user.id);
  } catch (error) {
    logger.error("Something went wrong while trying to retrieve user chats");
  }

  chats.forEach((chat) => {
    socket.join(chatRoom(chat.id));
    logger.info(`User ${socket.user.id} joined chat ${chat.id}`);
  });

  socket.join(userRoom(socket.user.id));

  socket.on("disconnecting", async (reason) => {
    logger.info("User " + socket.user.id + " is disconnecting: " + reason);
    await redisClient.sRem(onlineUsersKey(), socket.user.id);
    await redisClient.unlink(userSocketIdKey(socket.user.id));
  });

  socket.on("disconnect", async (reason) => {
    logger.info("User " + socket.user.id + " disconnected: " + reason);
  });
}
