"use client";

import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalDescription, ModalTitle, ModalTrigger } from "@/ui/components/common/Modal";
import { Button } from "@/ui/components/common/Button";
import { UploadDropzone } from "@/ui/components/files/UploadDropzone";

export function UploadFileModal() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="secondary" size="sm" className="w-full justify-center md:w-auto" disabled aria-disabled>
        Subir archivo
      </Button>
    );
  }

  return (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary" size="sm" className="w-full justify-center md:w-auto">
          Subir archivo
        </Button>
      </ModalTrigger>
      <ModalContent>
        <ModalTitle>Sube un nuevo documento</ModalTitle>
        <ModalDescription>Arrastra archivos o haz clic para buscarlos y descríbelos para el equipo.</ModalDescription>
        <div className="mt-6">
          <UploadDropzone />
        </div>
      </ModalContent>
    </Modal>
  );
}
