import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export function signData(payload) {
  const token = jwt.sign(payload, ENV.JWT_SECRET);
  return token;
}

export function decodeData(token) {
  const decodedData = jwt.decode(token, ENV.JWT_SECRET);
  return decodedData;
}
