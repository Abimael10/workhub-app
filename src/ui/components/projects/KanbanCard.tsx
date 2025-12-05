"use client";

import { forwardRef } from "react";
import type {
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps,
} from "@hello-pangea/dnd";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/lib/trpc/client";
import { Badge } from "@/ui/components/common/Badge";
import { Button } from "@/ui/components/common/Button";
import { formatDate } from "@/lib/utils/date";

type Project = RouterOutputs["projects"]["list"][number];

type KanbanCardProps = {
  project: Project;
  draggableProps: DraggableProvidedDraggableProps;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
  isDragging?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
  onOpen?: () => void;
  statusLabel?: string;
  priorityLabel?: string;
};

export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  (
    {
      project,
      draggableProps,
      dragHandleProps,
      isDragging,
      onDelete,
      isDeleting,
      onOpen,
      statusLabel,
      priorityLabel,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        {...draggableProps}
        role="button"
        tabIndex={0}
        onClick={(event) => {
          if (event.defaultPrevented || isDragging) return;
          onOpen?.();
        }}
        onKeyDown={(event) => {
          if (event.defaultPrevented || isDragging) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen?.();
          }
        }}
        className={cn(
          "flex min-h-[176px] flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-card/90 p-4 text-sm text-white shadow-lg transition",
          isDragging && "shadow-glow"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex-1 cursor-grab active:cursor-grabbing"
            {...(dragHandleProps ?? {})}
          >
            <p className="text-sm font-semibold line-clamp-2 break-words">{project.name}</p>
            <p className="text-[11px] text-muted-foreground">
              Creado por {project.creator?.name ?? project.creator?.email ?? "—"} ·{" "}
              {formatDate(project.createdAt, "MMM d, yyyy p")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge tone="success" className="shrink-0 capitalize">
              {priorityLabel ?? project.priority.toLowerCase()}
            </Badge>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete();
                }}
                disabled={isDeleting}
                aria-label={`Eliminar ${project.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground line-clamp-3 break-words">
            {project.description || "Aún no hay descripción."}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">{statusLabel ?? project.status}</span>
            <span className="whitespace-nowrap">{formatDate(project.updatedAt, "MMM d, yyyy")}</span>
          </div>
        </div>
      </div>
    );
  },
);
KanbanCard.displayName = "KanbanCard";
