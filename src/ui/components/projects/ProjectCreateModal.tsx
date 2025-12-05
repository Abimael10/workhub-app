"use client";

import { Modal, ModalContent, ModalDescription, ModalTitle, ModalTrigger } from "@/ui/components/common/Modal";
import { Button } from "@/ui/components/common/Button";
import { CreateProjectForm } from "@/ui/components/projects/CreateProjectForm";

export function ProjectCreateModal() {
  // Using suppressHydrationWarning to handle SSR/client rendering differences
  return (
    <Modal>
      <ModalTrigger asChild>
        <Button>Crear proyecto</Button>
      </ModalTrigger>
      <ModalContent suppressHydrationWarning>
        <ModalTitle>Inicia una nueva iniciativa</ModalTitle>
        <ModalDescription>
          Los proyectos se guardan en el servidor y poblarán cada columna del panel en tiempo real.
        </ModalDescription>
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-4">
          <CreateProjectForm />
        </div>
      </ModalContent>
    </Modal>
  );
}