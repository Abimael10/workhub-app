"use client";

import Image from "next/image";
import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/ui/components/common/Button";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/projects",
        redirect: false,
      });
      if (result?.error) {
        setError("No se pudo iniciar sesión. Verifica tus credenciales.");
      } else {
        window.location.href = "/projects";
      }
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
              Ingresa a tu espacio
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Accede con tu correo y contraseña.
            </p>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm text-muted-foreground">
                Correo electrónico
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                  placeholder="demo@workhub.com"
                />
              </label>
              <label className="block text-sm text-muted-foreground">
                Contraseña
                <input
                  type="password"
                  name="password"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                  placeholder="••••••••"
                />
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" disabled={isPending}>
                {isPending ? "Autenticando…" : "Entrar al panel"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Aún no tienes cuenta?{" "}
              <Link
                href="/register"
                className="text-white underline underline-offset-4"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        <div className="flex-1">
          <div className="relative mx-auto w-full max-w-[720px] overflow-hidden rounded-[32px] aspect-[16/9] min-h-[420px]">
            <div className="relative h-full w-full">
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
