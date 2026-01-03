"use client";

import { ReactNode } from "react";
import { DesktopOnly } from "@/ui/components/common/DesktopOnly";

type DesktopOnlyProviderProps = {
  children: ReactNode;
};

export function DesktopOnlyProvider({ children }: DesktopOnlyProviderProps) {
  return <DesktopOnly>{children}</DesktopOnly>;
}