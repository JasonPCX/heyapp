import { createClient } from "redis";
import { ENV } from "./env.js";
import logger from "./logger.js";

const client = createClient({
  socket: {
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
  },
});

client.on("connect", () =>
  logger.info("Redis Client: initializing connection to the server")
);
client.on("ready", () => logger.info("Redis Client: client is ready to use"));
client.on("error", (err) => logger.error("Redis Client Error", err.message));

export function callKey(callId) {
  return `call:${callId}`;
}

export function onlineUsersKey() {
  return "users:online";
}

export function userSocketIdKey(userId) {
  return `user:${userId}:sid`;
}

export const getClient = () => client;
