"use client";

import { useMemo } from "react";
import { Button } from "./Button";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "primary" | "destructive";
  isConfirming?: boolean;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmTone = "destructive",
  isConfirming,
  onConfirm,
}: ConfirmDialogProps) {
  const confirmVariant = useMemo(
    () => (confirmTone === "destructive" ? "destructive" : "primary"),
    [confirmTone],
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalTitle>{title}</ModalTitle>
        {description ? <ModalDescription>{description}</ModalDescription> : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="sm:min-w-[120px]"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            className="sm:min-w-[140px]"
            onClick={() => {
              void onConfirm();
            }}
            disabled={isConfirming}
          >
            {isConfirming ? "Procesando…" : confirmLabel}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
