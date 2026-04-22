import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  danger: { color: "danger", icon: <AlertTriangle size={20} className="text-danger me-2" /> },
  warning: { color: "warning", icon: <AlertTriangle size={20} className="text-warning me-2" /> },
  primary: { color: "primary", icon: null },
};

const ConfirmDialog = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const config = variantConfig[variant];

  return (
    <Modal isOpen={isOpen} toggle={onCancel} size="sm" centered>
      <ModalHeader toggle={onCancel}>
        <span className="d-flex align-items-center">
          {config.icon}
          {title}
        </span>
      </ModalHeader>
      <ModalBody>{message}</ModalBody>
      <ModalFooter>
        <Button color="secondary" outline onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button color={config.color} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmDialog;
