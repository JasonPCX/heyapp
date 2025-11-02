import pino from "pino";
import { ENV } from "./env.js";

const logger = pino({
  level: ENV.LOG_LEVEL,
  base: {
    pid: false,
  },
  transport: {
    target: "pino-pretty",
  },
});

export default logger;
