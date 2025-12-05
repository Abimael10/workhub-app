import { randomUUID } from "crypto";

export function getRequestId() {
  return randomUUID();
}
