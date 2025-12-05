"use client";

import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string | null };
};

type Props = {
  members: Member[];
  title?: string;
};

const roleLabels: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Admin",
  MEMBER: "Miembro",
};

export function OrganizationMembers({ members, title = "Miembros" }: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-inner shadow-black/30">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{title}</p>
      <div className="mt-4 space-y-3 text-sm">
        {members.length === 0 && <p className="text-muted-foreground">Aún no hay miembros.</p>}
        {members.map((member) => {
          const label = roleLabels[member.role] ?? member.role;
          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
            >
              <div>
                <p className="text-white">{member.user.name ?? member.user.email ?? "Usuario"}</p>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white",
                )}
              >
                <Shield className="h-3 w-3 text-primary" />
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
