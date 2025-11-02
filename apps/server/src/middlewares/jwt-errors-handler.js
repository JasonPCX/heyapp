import { ForbiddenException } from "#utils/HttpError.js";

export function jwtErrorHandler(error, req, res, next) {
    if (error.name === 'TokenExpiredError') {
        throw new ForbiddenException("Session expired");
    } else if (error.name === 'JsonWebTokenError') {
        throw new ForbiddenException("Bad credentials");
    } else {
        next(error);
    }
}