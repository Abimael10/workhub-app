"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { api, type RouterOutputs } from "@/lib/trpc/client";
import { projectStatuses } from "@/lib/validation/projects";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { Spinner } from "@/ui/components/common/Spinner";
import { changeProjectStatusAction } from "@/server/actions/projects/change-project-status";
import { deleteProjectAction } from "@/server/actions/projects/delete-project";
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from "@/ui/components/common/Modal";
import { formatDate } from "@/lib/utils/date";
import { Badge } from "@/ui/components/common/Badge";
import { ConfirmDialog } from "@/ui/components/common/ConfirmDialog";

type Project = RouterOutputs["projects"]["list"][number];

const statusMeta: Record<Project["status"], { title: string; accent: string }> = {
  BACKLOG: { title: "Pendiente", accent: "from-slate-700/80 to-slate-900/80" },
  IN_PROGRESS: { title: "En progreso", accent: "from-indigo-600/40 to-indigo-900/60" },
  BLOCKED: { title: "Bloqueado", accent: "from-rose-600/30 to-rose-900/40" },
  DONE: { title: "Completado", accent: "from-emerald-600/30 to-emerald-900/40" },
};

const priorityLabels: Record<Project["priority"], string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

type KanbanBoardProps = {
  initialProjects?: Project[];
};

export function KanbanBoard({ initialProjects }: KanbanBoardProps) {
  const utils = api.useUtils();
  const [isClient, setIsClient] = useState(false);
  const [dragPortal, setDragPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Safe because we only toggle once to prevent SSR hydration mismatches for DragDropContext.
    setIsClient(true);
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.createElement("div");
    el.id = "kanban-drag-portal";
    el.style.position = "fixed";
    el.style.inset = "0";
    el.style.pointerEvents = "none";
    el.style.zIndex = "60";
    document.body.appendChild(el);
    setDragPortal(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmProject, setConfirmProject] = useState<Project | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const closeProject = () => setActiveProject(null);

  const {
    data: projects,
    isLoading,
    error,
  } = api.projects.list.useQuery(undefined, {
    refetchOnMount: true,
    initialData: initialProjects ?? [],
  });

  const normalizedProjects = useMemo(
    () => (Array.isArray(projects) ? projects : initialProjects ?? []),
    [projects, initialProjects],
  );

  const grouped = useMemo(() => {
    return projectStatuses.reduce<Record<string, Project[]>>((acc, status) => {
      acc[status] = normalizedProjects.filter((project) => project.status === status);
      return acc;
    }, {});
  }, [normalizedProjects]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.droppableId === result.source.droppableId) return;

    const nextStatus = result.destination.droppableId as Project["status"];
    const previous = utils.projects.list.getData();
    if (Array.isArray(previous)) {
      utils.projects.list.setData(undefined, () =>
        previous.map((project) =>
          project.id === result.draggableId ? { ...project, status: nextStatus } : project,
        ),
      );
    }

    void (async () => {
      try {
        const response = await changeProjectStatusAction({
          id: result.draggableId,
          status: nextStatus,
        });
        if (!response.success) {
          if (Array.isArray(previous)) {
            utils.projects.list.setData(undefined, previous);
          }
          toast.error(response.error ?? "No se pudo mover el proyecto.");
        } else {
          utils.projects.list.invalidate();
        }
      } catch (error) {
        console.error("Project status update failed", error);
        if (Array.isArray(previous)) {
          utils.projects.list.setData(undefined, previous);
        }
        toast.error("No se pudo mover el proyecto. Intenta de nuevo.");
      }
    })();
  };


  const handleDelete = async (projectId: string, projectName: string) => {
    const previous = utils.projects.list.getData();
    setDeletingId(projectId);
    if (Array.isArray(previous)) {
      utils.projects.list.setData(undefined, () =>
        previous.filter((project) => project.id !== projectId),
      );
    }
    try {
      const response = await deleteProjectAction(projectId);

      if (!response.success) {
        throw new Error(response.error ?? "No se pudo eliminar el proyecto.");
      }
      toast.success(`"${projectName}" eliminado`);

      // Invalidate the projects list query
      await utils.projects.list.invalidate();
    } catch (err) {
      console.error("Project deletion failed", err);
      if (Array.isArray(previous)) {
        utils.projects.list.setData(undefined, previous);
      }
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el proyecto. Inténtalo de nuevo.");
    } finally {
      setDeletingId(null);
      setConfirmProject(null);
    }
  };

  if (error) {
    throw error;
  }

  if (isLoading && normalizedProjects.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-white/5">
        <Spinner />
      </div>
    );
  }

  if (!isLoading && normalizedProjects.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/10 text-sm text-muted-foreground">
        <p>Todavía no hay proyectos.</p>
        <p>Usa el botón “Crear proyecto” para crear tu primera tarjeta.</p>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-white/5">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid gap-4 lg:grid-cols-4">
          {/* Regular view - show all statuses */}
          {projectStatuses.map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided, snapshot) => (
                <KanbanColumn
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  count={grouped[status]?.length ?? 0}
                  title={statusMeta[status].title}
                  accentClass={statusMeta[status].accent}
                  isActive={snapshot.isDraggingOver}
                >
                  {grouped[status]?.map((project, index) => (
                    <Draggable draggableId={project.id} index={index} key={project.id}>
                      {(dragProvided, dragSnapshot) => {
                        const card = (
                          <KanbanCard
                            project={project}
                            onDelete={() => setConfirmProject(project)}
                            isDeleting={deletingId === project.id}
                            ref={dragProvided.innerRef}
                            dragHandleProps={dragProvided.dragHandleProps}
                            draggableProps={dragProvided.draggableProps}
                            isDragging={dragSnapshot.isDragging}
                            onOpen={() => setActiveProject(project)}
                            statusLabel={statusMeta[project.status]?.title ?? project.status}
                            priorityLabel={priorityLabels[project.priority] ?? project.priority}
                          />
                        );
                        if (dragPortal && dragSnapshot.isDragging) {
                          return createPortal(card, dragPortal);
                        }
                        return card;
                      }}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </KanbanColumn>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      <Modal
        open={Boolean(activeProject)}
        onOpenChange={(open) => {
          if (!open) {
            closeProject();
          }
        }}
      >
        <ModalContent>
          {activeProject && (
            <>
              <ModalHeader>
                <ModalTitle>{activeProject.name}</ModalTitle>
                <ModalDescription>
                  {activeProject.description || "Aún no se ha proporcionado una descripción."}
                </ModalDescription>
              </ModalHeader>
              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge tone="success">
                    {priorityLabels[activeProject.priority] ?? activeProject.priority}
                  </Badge>
                  <span className="text-xs uppercase tracking-[0.4em] text-white/70">
                    {statusMeta[activeProject.status]?.title ?? activeProject.status}
                  </span>
                </div>
                <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-white">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Creado</p>
                    <p>{formatDate(activeProject.createdAt, "MMM d, yyyy p")}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Actualizado</p>
                    <p>{formatDate(activeProject.updatedAt, "MMM d, yyyy p")}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </ModalContent>
      </Modal>
      <ConfirmDialog
        open={Boolean(confirmProject)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmProject(null);
          }
        }}
        title="Eliminar proyecto"
        description={
          confirmProject
            ? `¿Eliminar "${confirmProject.name}"? Esta acción no se puede deshacer.`
            : "¿Eliminar este proyecto?"
        }
        confirmLabel="Eliminar"
        confirmTone="destructive"
        isConfirming={Boolean(deletingId)}
        onConfirm={async () => {
          if (confirmProject) {
            await handleDelete(confirmProject.id, confirmProject.name);
          }
        }}
      />
    </>
  );
}
