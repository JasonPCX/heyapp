import crypto from "node:crypto";

import logger from "#utils/logger.js";
import { chatRoom, userRoom } from "#utils/socket.js";
import { callKey, onlineUsersKey } from "#utils/redis.js";
import { z } from "zod";

const validateNewCall = z.object({
  to: z.uuid(),
  chatId: z.uuid(),
  offer: z.any(),
});

const validateIceCandidate = z.object({
  type: z.enum(["offerCandidate", "answerCandidate"]),
  iceCandidate: z.any(),
  callId: z.uuid(),
});

const validateCallResponse = z.object({
  callId: z.uuid(),
  response: z.enum(["HANGUP", "ANSWER"]),
  answer: z.any().optional(),
});

const validateCallEnd = z.uuid();

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

    const isReceiverOnline = await redisClient.sIsMember(onlineUsersKey(), data.to);

    if (isReceiverOnline === 0) {
      return callback({
        status: "ERROR",
        errorCode: "USER_OFFLINE",
      });
    }

    await redisClient.hSet(callKey(callId), "from", socket.user.id);
    await redisClient.hSet(callKey(callId), "to", data.to);
    await redisClient.hSet(callKey(callId), "chatId", data.chatId);
    await redisClient.hSet(callKey(callId), "offer", JSON.stringify(data.offer));

    io.in(userRoom(data.to)).socketsJoin(chatRoom(data.chatId));
    socket
      .to(userRoom(data.to))
      .emit("call:incoming", callId, data.offer, socket.user, data.chatId);

    // Return success response with callId to the caller
    callback({
      status: "SUCCESS",
      callId: callId,
    });
  });

  socket.on("call:candidate", async (data) => {
    
    const validation = validateIceCandidate.safeParse(data);
    if (!validation.success) {
      return socket.emit("call:candidate:error", {
        status: "ERROR",
        errorCode: "INVALID_DATA",
        errors: z.treeifyError(validation.error),
      });
    }

    const { type, iceCandidate, callId } = validation.data;

    if (type === "answerCandidate") {
      const fromUserId = await redisClient.hGet(callKey(callId), "from");
      socket
        .to(userRoom(fromUserId))
        .emit("call:candidate:added", iceCandidate);
    } else if (type === "offerCandidate") {
      const toUserId = await redisClient.hGet(callKey(callId), "to");
      socket.to(userRoom(toUserId)).emit("call:candidate:added", iceCandidate);
    } else {
      logger.error("Candidate type is missing");
    }
  });

  socket.on("call:answer", async (data) => {
    const validation = validateCallResponse.safeParse(data);
    if (!validation.success) {
      return socket.emit("call:answer:error", {
        status: "ERROR",
        errorCode: "INVALID_DATA",
        errors: z.treeifyError(validation.error),
      });
    }
    const { callId, response, answer } = validation.data;

    await redisClient.hSet(
      callKey(callId),
      "answer",
      JSON.stringify(answer)
    );

    const callerUserId = await redisClient.hGet(callKey(callId), "from");

    socket
      .to(userRoom(callerUserId))
      .emit("call:answered", callId, response, answer);
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

    const callId = validation.data;

    const chatId = await redisClient.hGet(callKey(callId), "chatId");
    await redisClient.hDel(callKey(callId), "from");
    await redisClient.hDel(callKey(callId), "to");
    await redisClient.hDel(callKey(callId), "offer");
    await redisClient.hDel(callKey(callId), "chatId");

    socket.to(chatRoom(chatId)).emit("call:ended", callId);
  });
}
