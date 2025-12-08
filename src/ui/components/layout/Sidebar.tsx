"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsersRound, FolderKanban, Files, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/clients", label: "Clientes", icon: UsersRound },
  { href: "/files", label: "Archivos", icon: Files },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel golden-border sticky top-4 hidden h-[calc(100vh-2rem)] w-64 flex-shrink-0 flex-col justify-between p-6 md:flex">
      <div>
        <Link href="/projects" className="flex items-center justify-center pb-4">
          <Image
            src="/assets/workhub-logo-2.png"
            alt="Enti"
            width={380}
            height={70}
            priority
            unoptimized
            className="h-28 w-auto max-w-full"
          />
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-white/10 text-white shadow-glow"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Organización</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Invita miembros y cambia de espacio desde tu perfil.
        </p>
        <Link
          href="/profile#organization"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:border-primary hover:bg-primary/20"
        >
          <Building2 className="h-4 w-4" />
          Abrir organización
        </Link>
      </div>
    </aside>
  );
}
