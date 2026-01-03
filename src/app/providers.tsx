"use client";

import { ReactNode, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { api } from "@/lib/trpc/client";
import { createQueryClient } from "@/lib/react-query/queryClient";
import { Toaster } from "sonner";
import { trpcTransformer } from "@/lib/trpc/transformer";
import { DesktopOnly } from "@/ui/components/common/DesktopOnly";

type ProvidersProps = {
  children: ReactNode;
};

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: trpcTransformer,
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <DesktopOnly>
          {children}
        </DesktopOnly>
        {process.env.NODE_ENV !== "production" && <ReactQueryDevtools buttonPosition="bottom-left" />}
        <Toaster closeButton theme="dark" richColors />
      </QueryClientProvider>
    </api.Provider>
  );
}
