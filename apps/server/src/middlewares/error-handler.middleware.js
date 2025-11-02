import { getReasonPhrase, StatusCodes } from "http-status-codes";
import logger from "#utils/logger.js";

export function errorHandler(error, req, res, next) {
    logger.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error?.message ?? getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
    })
    
}