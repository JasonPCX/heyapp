import bcrypt from "bcrypt";

const SALT_LENGTH = 12;

export async function generateHash(str) {
  const hash = await bcrypt.hash(str, SALT_LENGTH);
  return hash;
}

export async function compareHash(str, hash) {
  const match = await bcrypt.compare(str, hash);
  return match;
}
