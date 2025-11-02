import { randomBytes } from "crypto";

export function generateKey(size) {
  return randomBytes(size).toString("hex");
}
