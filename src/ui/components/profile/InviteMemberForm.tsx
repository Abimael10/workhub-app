"use client";

import { useState, useTransition } from "react";
import { MailPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/ui/components/common/Button";

type Props = {
  organizationName: string;
};

export function InviteMemberForm({ organizationName }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [isPending, startTransition] = useTransition();

  const handleInvite = () => {
    startTransition(async () => {
      const response = await fetch("/api/organizations/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        toast.error(data?.message ?? "No se pudo agregar al miembro.");
        return;
      }

      toast.success("Miembro agregado a la organización");
      setEmail("");
    });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-inner shadow-black/30">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Invitar miembros</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Comparte acceso a <span className="text-white">{organizationName}</span>. Solo propietarios pueden invitar.
      </p>

      <div className="mt-4 space-y-3">
        <label className="block text-sm text-muted-foreground">
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
            placeholder="persona@ejemplo.com"
          />
        </label>
        <label className="block text-sm text-muted-foreground">
          Rol
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
          >
            <option value="MEMBER">Miembro</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <Button
          className="w-full"
          disabled={!email || isPending}
          onClick={handleInvite}
          variant="secondary"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
          Agregar miembro
        </Button>
      </div>
    </div>
  );
}
