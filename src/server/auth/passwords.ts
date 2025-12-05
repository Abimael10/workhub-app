import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const storedHash = Buffer.from(hashHex, "hex");
  const derived = scryptSync(password, salt, storedHash.length);

  if (derived.length !== storedHash.length) {
    return false;
  }

  return timingSafeEqual(derived, storedHash);
}
