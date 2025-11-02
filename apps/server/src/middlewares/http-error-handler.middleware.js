import { HttpError } from "#utils/HttpError.js";

export function httpErrorHandler(error, req, res, next) {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json(error.getProblemObject());
  } else {
    next(error);
  }
}
