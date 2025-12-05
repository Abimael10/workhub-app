"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { RouterOutputs } from "@/lib/trpc/client";
import { DataTable } from "@/ui/components/common/DataTable";
import { EditableCell } from "./EditableCell";
import { Pagination } from "@/ui/components/common/Pagination";
import { formatCurrency } from "@/lib/utils/money";
import { CLIENTS_PAGE_SIZE } from "@/domain/clients/constants";
import { Button } from "@/ui/components/common/Button";
import { Modal, ModalContent, ModalDescription, ModalTitle, ModalTrigger } from "@/ui/components/common/Modal";
import { CreateClientForm } from "@/ui/components/clients/CreateClientForm";
import { Spinner } from "@/ui/components/common/Spinner";
import { deleteClientAction } from "@/server/actions/clients/delete-client";
import { listClientsAction } from "@/server/actions/clients/list-clients";
import { updateClientFieldAction } from "@/server/actions/clients/update-client-field";
import { ConfirmDialog } from "@/ui/components/common/ConfirmDialog";

type ClientRow = RouterOutputs["clients"]["list"]["items"][number];
type ClientsPageResult = RouterOutputs["clients"]["list"];
type EditableField = "name" | "type" | "valueDop" | "startDate" | "endDate";

const clientTypeOptions = [
  { label: "Persona", value: "PERSON" },
  { label: "Empresa", value: "COMPANY" },
];

type ClientsTableProps = {
  initialPage?: ClientsPageResult;
};

export function ClientsTable({ initialPage }: ClientsTableProps) {
  const [page, setPage] = useState(initialPage?.page ?? 1);
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim();
  const [clientsPage, setClientsPage] = useState<ClientsPageResult>(
    initialPage ?? { page: 1, pageSize: CLIENTS_PAGE_SIZE, total: 0, items: [] },
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmClient, setConfirmClient] = useState<ClientRow | null>(null);
  const [isFetching, startTransition] = useTransition();

  const fetchClients = useCallback(
    (targetPage: number, term: string) => {
      startTransition(() => {
        listClientsAction({
          page: targetPage,
          pageSize: CLIENTS_PAGE_SIZE,
          ...(term && { search: term }),
        })
          .then((result) => {
            setClientsPage(result);
            if (result.page !== targetPage) {
              setPage(result.page);
            }
          })
          .catch((error) => {
            console.error("Clients fetch failed", error);
            toast.error("No se pudieron cargar los clientes. Intenta de nuevo.");
          });
      });
    },
    [startTransition],
  );

  const refreshCurrentPage = useCallback(() => {
    fetchClients(page, normalizedSearch);
  }, [fetchClients, page, normalizedSearch]);

  useEffect(() => {
    fetchClients(page, normalizedSearch);
  }, [fetchClients, page, normalizedSearch]);

  const handleFieldUpdate = useCallback(
    async (clientId: string, field: EditableField, rawValue: string | number | null) => {
      const payload =
        field === "valueDop"
          ? Number(rawValue ?? 0)
          : field === "startDate" || field === "endDate"
            ? rawValue === "" || rawValue == null
              ? null
              : rawValue
            : rawValue;

      try {
        await updateClientFieldAction({ id: clientId, field, value: payload });
        setClientsPage((previous) => ({
          ...previous,
          items: previous.items.map((item) =>
            item.id === clientId ? { ...item, [field]: payload } : item,
          ),
        }));
        toast.success("Cliente actualizado");
        await refreshCurrentPage();
      } catch (error) {
        console.error("Client update failed", error);
        toast.error("No se pudo actualizar el cliente. Intenta de nuevo.");
        await refreshCurrentPage();
      }
    },
    [refreshCurrentPage],
  );



  const handleDelete = useCallback(
    async (client: ClientRow) => {
      setDeletingId(client.id);
      setClientsPage((previous) => ({
        ...previous,
        total: Math.max(0, previous.total - 1),
        items: previous.items.filter((item) => item.id !== client.id),
      }));

      try {
        const result = await deleteClientAction(client.id);
        if (!result.success) {
          throw new Error(result.error ?? "No se pudo eliminar el cliente.");
        }
        toast.success(`Cliente ${client.name} eliminado`);
        const nextTotalPages = Math.max(
          1,
          Math.ceil(Math.max(0, clientsPage.total - 1) / CLIENTS_PAGE_SIZE),
        );
        setPage((currentPage) => Math.min(currentPage, nextTotalPages));
        await refreshCurrentPage();
      } catch (error) {
        console.error("Client delete failed", error);
        toast.error(error instanceof Error ? error.message : "No se pudo eliminar el cliente. Intenta de nuevo.");
        await refreshCurrentPage();
      } finally {
        setDeletingId(null);
        setConfirmClient(null);
      }
    },
    [clientsPage.total, refreshCurrentPage],
  );

  const columns = useMemo<ColumnDef<ClientRow>[]>(() => {
    const cols: ColumnDef<ClientRow>[] = [];


    cols.push(
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <EditableCell
            value={row.original.name}
            onSave={(value) => handleFieldUpdate(row.original.id, "name", value)}
          />
        ),
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => (
          <EditableCell
            type="select"
            value={row.original.type}
            options={clientTypeOptions}
            onSave={(value) => handleFieldUpdate(row.original.id, "type", value)}
          />
        ),
      },
      {
        accessorKey: "valueDop",
        header: "Valor",
        cell: ({ row }) => (
          <EditableCell
            type="currency"
            value={Number(row.original.valueDop)}
            onSave={(value) => handleFieldUpdate(row.original.id, "valueDop", value)}
          />
        ),
      },
      {
        accessorKey: "startDate",
        header: "Inicio",
        cell: ({ row }) => (
          <EditableCell
            type="date"
            value={row.original.startDate}
            onSave={(value) => handleFieldUpdate(row.original.id, "startDate", value)}
          />
        ),
      },
      {
        accessorKey: "endDate",
        header: "Fin",
        cell: ({ row }) => (
          <EditableCell
            type="date"
            value={row.original.endDate}
            onSave={(value) => handleFieldUpdate(row.original.id, "endDate", value)}
          />
        ),
      },
      {
        id: "creator",
        header: "Creado por",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.creator?.name ?? row.original.creator?.email ?? "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          // Show delete button
          return (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={async () => {
                setConfirmClient(row.original);
              }}
              disabled={deletingId === row.original.id}
              aria-label={`Eliminar ${row.original.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          );
        },
      },
    );

    return cols;
  }, [deletingId, handleFieldUpdate]);

  const currentItems = clientsPage.items ?? [];
  const currentTotal = clientsPage.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(currentTotal / CLIENTS_PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-white/5 bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Filtros</p>
          <p className="text-sm text-white">Listado de clientes</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar clientes"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            className="w-full rounded-full border border-white/10 bg-black/50 py-2 pl-10 pr-4 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Modal>
          <ModalTrigger asChild>
            <Button variant="secondary" size="sm" className="w-full justify-center md:w-auto">
              <UserPlus className="h-4 w-4" />
              Crear cliente
            </Button>
          </ModalTrigger>
          <ModalContent>
            <ModalTitle>Agrega un nuevo cliente</ModalTitle>
            <ModalDescription>
              Captura registros CRM con acciones de servidor (Postgres + actualización en vivo).
            </ModalDescription>
            <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-4">
              <CreateClientForm onCreated={refreshCurrentPage} />
            </div>
          </ModalContent>
        </Modal>
        <div className="text-right text-sm text-muted-foreground">
          <p>Valor total</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(currentItems.reduce((sum, client) => sum + Number(client.valueDop ?? 0), 0))}
          </p>
        </div>
      </div>
      <div className="relative">
        {isFetching && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/20 backdrop-blur-sm">
            <Spinner />
          </div>
        )}
        <DataTable columns={columns} data={currentItems} isLoading={false} emptyState={undefined} />
      </div>
      {currentItems.length > 0 && (
        <Pagination
          page={page}
          pageSize={CLIENTS_PAGE_SIZE}
          total={currentTotal}
          onPageChange={(next) => setPage(next)}
        />
      )}
      <ConfirmDialog
        open={Boolean(confirmClient)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmClient(null);
          }
        }}
        title="Eliminar cliente"
        description={
          confirmClient
            ? `¿Eliminar al cliente "${confirmClient.name}"? Esta acción no se puede deshacer.`
            : "¿Eliminar este cliente?"
        }
        confirmLabel="Eliminar"
        confirmTone="destructive"
        isConfirming={Boolean(deletingId)}
        onConfirm={async () => {
          if (confirmClient) {
            await handleDelete(confirmClient);
          }
        }}
      />
    </div>
  );
}
