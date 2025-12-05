"use client";

import { useState, useTransition } from "react";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/ui/components/common/Button";
import { cn } from "@/lib/utils";

type Membership = {
  id: string;
  role: string;
  organizationId: string;
  organization: { id: string; name: string | null };
};

type Props = {
  memberships: Membership[];
  activeOrganizationId: string;
};

export function OrganizationSwitcher({ memberships, activeOrganizationId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [activeOrg, setActiveOrg] = useState(activeOrganizationId);

  const handleSwitch = (organizationId: string) => {
    startTransition(async () => {
      const response = await fetch("/api/account/switch-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
        credentials: "include",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        toast.error(data?.message ?? "No se pudo activar la organización.");
        return;
      }
      setActiveOrg(organizationId);
      toast.success("Organización activada");
      window.location.reload();
    });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-inner shadow-black/30">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Organizaciones</p>
      <div className="mt-4 space-y-3 text-sm">
        {memberships.map((membership) => {
          const isActive = membership.organizationId === activeOrg;
          const organizationName =
            membership.organization?.name ?? `Org ${membership.organizationId.slice(0, 8)}`;
          return (
            <div
              key={membership.id}
              className={cn(
                "flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/40 p-4 md:flex-row md:items-center md:justify-between",
                isActive && "border-primary/50 shadow-glow",
              )}
            >
              <div>
                <p className="text-white">{organizationName}</p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-white">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    {membership.role}
                  </span>
                  {isActive && <span className="text-primary">Activo</span>}
                </p>
              </div>
              {!isActive && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => handleSwitch(membership.organizationId)}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Usar esta organización"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
