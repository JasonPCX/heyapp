import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "node:http";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { ENV } from "#utils/env.js";
import logger from "#utils/logger.js";
import { errorHandler } from "#middlewares/error-handler.middleware.js";
import router from "#routes/index.js";
import { zodErrorHandler } from "#middlewares/zod-error-handler.middleware.js";
import { jwtErrorHandler } from "#middlewares/jwt-errors-handler.js";
import { httpErrorHandler } from "#middlewares/http-error-handler.middleware.js";
import { dbErrorHandler } from "#middlewares/db-error-handler.middleware.js";
import { getClient } from "#utils/redis.js";
import { initializeSocketIO } from "#utils/socket.js";
import { StatusCodes } from "http-status-codes";

// dayjs plugins
dayjs.extend(calendar);
dayjs.extend(utc);
dayjs.extend(timezone);

const PORT = ENV.SERVER_PORT;

const app = express();
const httpServer = createServer(app);
const redisClient = getClient();
initializeSocketIO({ httpServer, redisClient });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());

app.use("/api", router);

// custom 404
app.use((req, res, next) => {
  res.status(StatusCodes.NOT_FOUND).send("Sorry can't find that!");
});

app.use(jwtErrorHandler);
app.use(zodErrorHandler);
app.use(dbErrorHandler);
app.use(httpErrorHandler);
app.use(errorHandler);

httpServer.listen(PORT, () => {
  const client = getClient();
  client.connect();
  logger.info(`Server running on port: ${PORT}`);
});
