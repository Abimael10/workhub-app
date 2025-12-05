import type { Metadata } from "next";
import { requireUser } from "@/server/auth/requireUser";
import { createDashboardMetadata } from "@/lib/metadata";
import DeleteAccountForm from "@/ui/components/profile/DeleteAccountForm";
import { db } from "@/server/db";
import { listMembershipsWithOrganization } from "@/server/db/repositories/memberships-repo";
import { OrganizationSwitcher } from "@/ui/components/profile/OrganizationSwitcher";
import { InviteMemberForm } from "@/ui/components/profile/InviteMemberForm";
import { OrganizationMembers } from "@/ui/components/profile/OrganizationMembers";
import { listMembersByOrganization } from "@/server/db/repositories/memberships-repo";

export const metadata: Metadata = createDashboardMetadata({
  title: "Perfil",
  description: "Resumen de tu cuenta y organización activa.",
  path: "/profile",
});

function formatId(id: string | null | undefined) {
  if (!id) return "—";
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export default async function ProfilePage() {
  const user = await requireUser();
  const memberships = await listMembershipsWithOrganization(db, user.id);
  const members = await listMembersByOrganization(db, user.organizationId);

  const orgName = user.organizationName ?? "Tu organización";
  const role = user.membershipRole ?? "MEMBER";
  const roleLabel = role === "OWNER" ? "Propietario" : role === "ADMIN" ? "Admin" : "Miembro";

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-primary/5 to-indigo-500/10 p-6 shadow-glow">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Perfil</p>
        <h1 className="mt-2 font-display text-3xl text-white">{user.name ?? "Operador"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este espacio refleja tu identidad y la organización activa. Cambia de organización cuando agreguemos
          el conmutador para mantener tus datos aislados.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-inner shadow-black/30">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Cuenta</p>
          <div className="mt-4 space-y-3 text-sm text-white">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-semibold">{user.name ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Correo</span>
              <span className="font-semibold">{user.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">ID de usuario</span>
              <span className="font-mono text-xs text-primary/90">{formatId(user.id)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-inner shadow-black/30">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Organización</p>
          <div className="mt-4 space-y-3 text-sm text-white">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-semibold">{orgName}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Rol</span>
              <span className="font-semibold">{roleLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">ID de organización</span>
              <span className="font-mono text-xs text-primary/90">{formatId(user.organizationId)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">ID de membresía</span>
              <span className="font-mono text-xs text-primary/90">{formatId(user.membershipId)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2" id="organization">
        <OrganizationSwitcher memberships={memberships} activeOrganizationId={user.organizationId} />
        {role === "OWNER" && <InviteMemberForm organizationName={orgName} />}
      </div>

      <OrganizationMembers members={members} />

      <DeleteAccountForm organizationName={orgName} />
    </section>
  );
}
