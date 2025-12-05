import type { HTMLAttributes, ReactNode, ForwardedRef } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
  title: string;
  count: number;
  accentClass: string;
  isActive?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: ReactNode;
};

export const KanbanColumn = forwardRef<HTMLDivElement, KanbanColumnProps>(
  ({ className, title, count, accentClass, isActive, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-[450px] flex-col rounded-3xl border border-white/5 bg-gradient-to-br p-4 transition",
        accentClass,
        isActive && "ring-2 ring-primary/60",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-sm text-white/90">
        <div>
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/60">Estado</p>
          <p className="font-semibold">{title}</p>
        </div>
        <span className="rounded-full bg-black/30 px-3 py-1 text-xs">{count}</span>
      </div>
      <div
        className="mt-4 flex flex-1 flex-col gap-4"
      >
        {children}
      </div>
    </div>
  );
});

KanbanColumn.displayName = "KanbanColumn";
