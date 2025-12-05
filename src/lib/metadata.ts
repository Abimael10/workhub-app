import type { Metadata } from "next";

const defaultBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://workhub.app";

export function createDashboardMetadata(params: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const canonical = new URL(params.path, defaultBaseUrl).toString();

  return {
    title: `${params.title} · Workhub`,
    description: params.description,
    alternates: { canonical },
    openGraph: {
      title: `${params.title} · Workhub`,
      description: params.description,
      url: canonical,
      siteName: "Workhub",
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}
