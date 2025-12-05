import type { ReactNode } from "react";
import { requireUser } from "@/server/auth/requireUser";
import { Sidebar } from "@/ui/components/layout/Sidebar";
import { Topbar } from "@/ui/components/layout/Topbar";
import { RealtimeSync } from "@/ui/components/layout/RealtimeSync";

export const runtime = "nodejs";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6 md:px-8">
      <Sidebar />
      <div className="flex w-full flex-col rounded-3xl border border-white/5 bg-card/60 backdrop-blur-xl">
        <Topbar user={user} />
        <RealtimeSync organizationId={user.organizationId} />
        <main className="space-y-8 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
