import { getDbErrorMessage } from "#utils/dbErrors.js";
import { DrizzleError, DrizzleQueryError } from "drizzle-orm";
import { StatusCodes } from "http-status-codes";
import { DatabaseError } from "pg";

export function dbErrorHandler(error, req, res, next) {
  if (
    error instanceof DrizzleQueryError &&
    error.cause instanceof DatabaseError
  ) {
    const { message, constraint } = getDbErrorMessage(error);
    return res.status(StatusCodes.BAD_REQUEST).json({
      message,
      constraint,
    });
  } else {
    next(error);
  }
}
