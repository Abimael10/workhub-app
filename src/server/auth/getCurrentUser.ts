import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export async function getCurrentUser() {
  return getServerSession(authOptions);
}
