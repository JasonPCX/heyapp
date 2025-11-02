import { UnauthorizedException } from "#utils/HttpError.js";
import { decodeData } from "#utils/jwt.js";

export default function verifyAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException(
        "Invalid authorization data",
        req.originalUrl
      );
    }
    const token = authorization.split(" ")[1];
    if (!token) {
      throw new UnauthorizedException(
        "Invalid authorization data",
        req.originalUrl,
        { authorization }
      );
    }

    const decodedData = decodeData(token);

    req.user = decodedData;

    next();
  } catch (error) {
    next(error);
  }
}

export function verifySocketAuth(socket, next) {
  const token = socket.handshake.auth.token;

  if (!token) {
    const err = new Error("Token no proporcionado");
    err.data = { context: { status: 401 } };
    return next(err);
  }

  try {
    const decoded = decodeData(token);
    socket.user = decoded;
    next();
  } catch (error) {
    const err = new Error("Token inválido");
    err.data = { context: { status: 401 } };
    next(err);
  }
}
