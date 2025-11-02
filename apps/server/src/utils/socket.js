import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import helmet from "helmet";

import { verifySocketAuth } from "#middlewares/verify-auth.middleware.js";
import { handleConnection } from "#handlers/handleConnection.js";
import { handleMessages } from "#handlers/handleMessages.js";
import { handleCalls } from "#handlers/handleCalls.js";
import { handleFriendRequests } from "#handlers/handleFriendRequests.js";

let ioInstance = null;

export function initializeSocketIO({ httpServer, redisClient }) {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "https://admin.socket.io",
        "http://localhost:5173",
        "https://reliable-fifth-quilt-fiction.trycloudflare.com",
      ],
      credentials: true,
    },
  });
  ioInstance = io;

  io.engine.use(helmet());
  // Auth middleware
  io.use(verifySocketAuth);

  io.on("connection", async (socket) => {
    handleConnection({ socket, io, redisClient });
    handleMessages({ socket, io, redisClient });
    handleCalls({ socket, io, redisClient });
    handleFriendRequests({ socket, io, redisClient });
  });

  instrument(io, {
    auth: false,
  });

  return io;
}

export function chatRoom(chatId) {
  return `chat:${chatId}`;
}

export function userRoom(userId) {
  return `user:${userId}`;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.IO not initialized!");
  }
  return ioInstance;
}
