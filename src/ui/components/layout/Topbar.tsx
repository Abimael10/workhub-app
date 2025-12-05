"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Building2, ChevronDown, LogOut, User2 } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { cn } from "@/lib/utils";

type TopbarProps = {
  user: NonNullable<Session["user"]>;
};

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/5 bg-background/70 px-4 backdrop-blur-2xl md:px-8">
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Espacio</span>
        <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
          <Building2 className="h-4 w-4 text-primary" />
          {user.organizationName ?? "Tu espacio"}
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-muted-foreground">
            {user.organizationId?.slice(0, 8)}
          </span>
        </div>
      </div>

      
      <div className="flex items-center gap-3">
        {/*
        <Button variant="secondary" size="sm" className="hidden md:inline-flex">
          Crear proyecto
        </Button>
        */}
        <UserProfile user={user} />
      </div>
    </header>
  );
}

function UserProfile({ user }: TopbarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-12 w-32 rounded-full border border-white/10 bg-card/40" aria-hidden="true" />
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-3 rounded-full border border-white/10 bg-card/50 px-3 py-1.5 text-left text-sm text-white shadow-inner shadow-black/40 transition hover:border-primary/50">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/70 to-indigo-500/70 text-base font-semibold">
            {user?.name?.[0]?.toUpperCase() ?? "E"}
          </span>
          <div className="hidden text-left leading-tight md:block">
            <p className="font-semibold">{user?.name ?? "Operador"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        sideOffset={12}
        className="glass-panel golden-border w-56 rounded-2xl p-2 text-sm text-muted-foreground"
      >
        <DropdownMenu.Label className="px-3 py-2 text-xs uppercase tracking-[0.4em]">
          Sesión
        </DropdownMenu.Label>
        <DropdownMenu.Separator className="my-1 h-px bg-white/5" />
        <DropdownMenu.Item
          asChild
          className={cn(
            "focus:bg-white/10 focus:outline-none",
          )}
        >
          <Link
            href="/profile"
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-white transition",
              "hover:bg-white/10",
            )}
          >
            <User2 className="h-4 w-4 text-primary" />
            Perfil
          </Link>
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onSelect={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-white transition",
            "hover:bg-destructive/30 focus:bg-destructive/30 focus:outline-none",
          )}
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-destructive/20 text-destructive-foreground">
            <LogOut className="h-4 w-4" />
          </span>
          <span className="flex-1">Cerrar sesión</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
