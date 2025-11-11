import crypto from "node:crypto";

import logger from "#utils/logger.js";
import { chatRoom, userRoom } from "#utils/socket.js";
import { callKey, onlineUsersKey } from "#utils/redis.js";
import { z } from "zod";

const validateNewCall = z.object({
  calleeId: z.uuid(),
  chatId: z.uuid(),
});

const validateIceCandidate = z.object({
  iceCandidate: z.any(),
  callId: z.uuid(),
});

const validateCallNegotiation = z.object({
  callId: z.uuid(),
  description: z.any(),
});

const validateCallEnd = z.object({
  callId: z.uuid(),
});

const validateCallCancel = z.object({
  callId: z.uuid(),
});

/**
 * Handles call-related socket events.
 *
 * @async
 * @param {Object} args
 * @param {import("socket.io").Socket} args.socket - Socket.IO socket instance
 * @param {import("socket.io").Server} args.io - Socket.IO server instance
 * @param {import("redis").RedisClientType} args.redisClient - Redis client instance
 * @returns {Promise<void>}
 */

export async function handleCalls({ socket, io, redisClient }) {
  socket.on("call:new", async (data, callback) => {
    // Setting call identifier
    const callId = crypto.randomUUID();

    const validation = validateNewCall.safeParse(data);
    if (!validation.success) {
      return callback({
        status: "ERROR",
        errorCode: "INVALID_DATA",
        errors: z.treeifyError(validation.error),
      });
    }

    const { calleeId, chatId } = validation.data;

    const isCalleeUserOnline = await redisClient.sIsMember(
      onlineUsersKey(),
      calleeId
    );

    if (isCalleeUserOnline === 0) {
      return callback({
        status: "ERROR",
        errorCode: "USER_OFFLINE",
      });
    }

    await redisClient.hSet(callKey(callId), "callerId", socket.user.id);
    await redisClient.hSet(callKey(callId), "calleeId", calleeId);
    await redisClient.hSet(callKey(callId), "chatId", chatId);

    io.in(userRoom(calleeId)).socketsJoin(chatRoom(chatId));
    socket
      .to(userRoom(calleeId))
      .emit("call:incoming", callId, socket.user, chatId, false);

    // Return success response with callId to the caller
    // Caller is polite peer, callee is impolite peer for perfect negotiation
    return callback({
      status: "SUCCESS",
      callId: callId,
      isPolitePeer: true,
    });
  });

  socket.on("call:candidate", async (data, callback) => {
    const validation = validateIceCandidate.safeParse(data);
    if (!validation.success) {
      return callback({
        status: "ERROR",
        errorCode: "INVALID_DATA",
        errors: z.treeifyError(validation.error),
      });
    }

    const { iceCandidate, callId } = validation.data;
    const userId = socket.user.id;

    const callerId = await redisClient.hGet(callKey(callId), "callerId");
    const calleeId = await redisClient.hGet(callKey(callId), "calleeId");

    if (userId === callerId) {
      return socket
        .to(userRoom(calleeId))
        .emit("call:candidate:new", iceCandidate);
    } else if (userId === calleeId) {
      return socket
        .to(userRoom(callerId))
        .emit("call:candidate:new", iceCandidate);
    } else {
      return callback({
        status: "ERROR",
        errorCode: "FAILED_TO_SIGNAL_ICE_CANDIDATE",
      });
    }
  });

  socket.on("call:negotiation", async (data, callback) => {
    const validation = validateCallNegotiation.safeParse(data);
    if (!validation.success) {
      return callback({
        status: "ERROR",
        errorCode: "INVALID_DATA",
        errors: z.treeifyError(validation.error),
      });
    }
    const { callId, description } = validation.data;
    const userId = socket.user.id;

    const callerId = await redisClient.hGet(callKey(callId), "callerId");
    const calleeId = await redisClient.hGet(callKey(callId), "calleeId");

    if (userId === callerId) {
      return socket
        .to(userRoom(calleeId))
        .emit("call:description:new", description);
    } else if (userId === calleeId) {
      return socket
        .to(userRoom(callerId))
        .emit("call:description:new", description);
    } else {
      return callback({
        status: "ERROR",
        errorCode: "FAILED_TO_SIGNAL_ICE_CANDIDATE",
      });
    }
  });

  socket.on("call:cancel", async (data, callback) => {
    const validation = validateCallCancel.safeParse(data);
    if (!validation.success) {
      if (callback) {
        return callback({
          status: "ERROR",
          errorCode: "INVALID_DATA",
          errors: z.treeifyError(validation.error),
        });
      }
      return;
    }

    const { callId } = validation.data;
    const userId = socket.user.id;

    const callerId = await redisClient.hGet(callKey(callId), "callerId");
    const calleeId = await redisClient.hGet(callKey(callId), "calleeId");
    const chatId = await redisClient.hGet(callKey(callId), "chatId");

    // Only the caller can cancel the call
    if (userId !== callerId) {
      if (callback) {
        return callback({
          status: "ERROR",
          errorCode: "UNAUTHORIZED",
        });
      }
      return;
    }

    // Notify the callee that the call was cancelled
    socket.to(userRoom(calleeId)).emit("call:cancelled", callId);

    // Clean up call data from Redis
    await redisClient.hDel(callKey(callId), "callerId");
    await redisClient.hDel(callKey(callId), "calleeId");
    await redisClient.hDel(callKey(callId), "chatId");

    if (callback) {
      return callback({
        status: "SUCCESS",
      });
    }
  });

  socket.on("call:end", async (data, callback) => {
    const validation = validateCallEnd.safeParse(data);
    if (!validation.success) {
      return callback({
        status: "ERROR",
        errorCode: "INVALID_DATA",
        errors: z.treeifyError(validation.error),
      });
    }

    const { callId } = validation.data;

    // Validate that the user is part of the call
    const callerId = await redisClient.hGet(callKey(callId), "callerId");
    const calleeId = await redisClient.hGet(callKey(callId), "calleeId");
    const userId = socket.user.id;

    if (userId !== callerId && userId !== calleeId) {
      if (callback) {
        return callback({
          status: "ERROR",
          errorCode: "UNAUTHORIZED",
        });
      }
      return;
    }

    const chatId = await redisClient.hGet(callKey(callId), "chatId");
    await redisClient.hDel(callKey(callId), "callerId");
    await redisClient.hDel(callKey(callId), "calleeId");
    await redisClient.hDel(callKey(callId), "chatId");

    socket.to(chatRoom(chatId)).emit("call:ended", callId);
  });
}
