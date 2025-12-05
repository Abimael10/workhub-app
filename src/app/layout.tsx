import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "WorkHub | Espacio de trabajo",
  description:
    "WorkHub es un espacio de trabajo modular y nativo de la nube para que los equipos gestionen proyectos, clientes y archivos en un panel único.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-background">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60 blur-3xl" />
          <Providers>
            <div className="relative z-10">{children}</div>
          </Providers>
        </div>
      </body>
    </html>
  );
}
