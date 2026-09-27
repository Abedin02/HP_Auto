import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
};

/** Native-<dialog>-backed confirmation used for deleting vehicles and photos. */
export function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  onCancel,
  onConfirm,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} eyebrow="Confirm delete" title={title}>
      <p className="text-muted-foreground">{description}</p>
      <div className="mt-8 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </Modal>
  );
}
