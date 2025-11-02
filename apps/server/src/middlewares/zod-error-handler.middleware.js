import { StatusCodes } from "http-status-codes";
import z, { ZodError } from "zod";

export function zodErrorHandler(error, req, res, next) {
  if (error instanceof ZodError) {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: z.prettifyError(error),
      errors: z.treeifyError(error),
    });
  } else {
    next(error);
  }
}
