"use client";

import Image from "next/image";
import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/ui/components/common/Button";

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const organizationName = String(formData.get("organizationName"));

    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, organizationName }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(data?.message ?? "No se pudo crear la cuenta.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/projects",
        redirect: false,
      });

      if (signInResult?.error) {
        setError(
          "Cuenta creada, pero no se pudo iniciar sesión. Intenta iniciar sesión manualmente.",
        );
        return;
      }

      window.location.href = signInResult?.url ?? "/projects";
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-4 py-12 text-white">
      <div className="flex w-full max-w-6xl flex-col gap-8 md:flex-row md:items-center">
        <div className="md:w-[420px]">
          <div className="rounded-3xl bg-[#161616] p-8 shadow-2xl">
            <div className="flex items-center justify-center">
              <Image
                src="/assets/workhub-logo-2.png"
                alt="Enti"
                width={160}
                height={46}
                priority
              />
            </div>
            <h1 className="mt-6 text-center text-3xl font-bold leading-tight md:text-[32px] md:leading-[38px]">
              Crea tu organización
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Regístrate con tus datos.
            </p>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm text-muted-foreground">
                Nombre completo
                <input
                  type="text"
                  name="name"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                  placeholder="Taylor Jenkins"
                />
              </label>
              <label className="block text-sm text-muted-foreground">
                Correo electrónico
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                  placeholder="demo@workhub.com"
                />
              </label>
              <label className="block text-sm text-muted-foreground">
                Contraseña
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                  placeholder="••••••••"
                />
              </label>
              <label className="block text-sm text-muted-foreground">
                Organización
                <input
                  type="text"
                  name="organizationName"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                  placeholder="Aurora Labs"
                />
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" disabled={isPending}>
                {isPending ? "Creando espacio…" : "Crear y acceder"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="text-white underline underline-offset-4"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        <div className="flex-1">
          <div className="relative mx-auto w-full max-w-[720px] overflow-hidden rounded-[32px] aspect-[16/9] min-h-[420px]">
            <div className="relative h-full w-full image-fade-effect">
              <Image
                src="/assets/the-man-final-1.gif"
                alt="Animación del flujo de trabajo en tiempo real"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
