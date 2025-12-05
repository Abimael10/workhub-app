import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Tag({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
