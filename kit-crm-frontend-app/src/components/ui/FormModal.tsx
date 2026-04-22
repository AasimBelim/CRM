import type { ReactNode } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "reactstrap";

interface FormModalProps {
  isOpen: boolean;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  submitColor?: string;
  onSubmit: () => void;
  onClose: () => void;
  children: ReactNode;
  disableSubmit?: boolean;
}

const FormModal = ({
  isOpen,
  title,
  size = "md",
  loading = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  submitColor = "primary",
  onSubmit,
  onClose,
  children,
  disableSubmit = false,
}: FormModalProps) => {
  return (
    <Modal isOpen={isOpen} toggle={onClose} size={size}>
      <ModalHeader toggle={onClose}>{title}</ModalHeader>
      <ModalBody>{children}</ModalBody>
      <ModalFooter>
        <Button color="secondary" outline onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          color={submitColor}
          onClick={onSubmit}
          disabled={loading || disableSubmit}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="me-1" /> Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default FormModal;
