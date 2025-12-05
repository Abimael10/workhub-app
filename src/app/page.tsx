import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/options";

export default async function Home() {
  const session = await getServerSession(authOptions).catch(() => null);
  redirect(session?.user ? "/projects" : "/login");
}
