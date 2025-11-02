import { getReasonPhrase, StatusCodes } from "http-status-codes";

export class HttpError extends Error {
    constructor(message, statusCode, instance, context) {
        super(message);
        this.statusCode = statusCode;
        this.instance = instance;
        this.context = context;
    }

    getProblemObject() {
        return {
            message: this.message,
            instance: this.instance,
            context: this.context,
        }
    }
}

export class NotFoundException extends HttpError {
    constructor(message, instance, context) {
        super(message ?? getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND, instance, context);
    }
}

export class BadRequestException extends HttpError {
    constructor(message, instance, context) {
        super(message ?? getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST, instance, context);
    }
}

export class UnauthorizedException extends HttpError {
    constructor(message, instance, context) {
        super(message ?? getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED, instance, context);
    }
}

export class ForbiddenException extends HttpError {
    constructor(message, instance, context) {
        super(message ?? getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN, instance, context);
    }
}
