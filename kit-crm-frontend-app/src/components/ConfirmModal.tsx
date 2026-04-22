import { Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import type { ConfirmModalProps } from "@/types/General";

const ConfirmModal = (props: ConfirmModalProps) => {
    const {
        isOpen: propIsOpen,
        title = "Are you Sure?",
        message = "Do you really want to delete this? This process cannot be undone.",
        size = "sm",
        onConfirm,
        onCancel
    } = props;

    return <Modal isOpen={propIsOpen} size={size}>
        <ModalHeader toggle={() => {
            onCancel && onCancel();
        }}>{title}</ModalHeader>
        <ModalBody>
            {message}
        </ModalBody>
        <ModalFooter>
            <button className="btn btn-secondary" onClick={() => {
                if (onCancel) onCancel();
            }}>Cancel</button>
            <button className="btn btn-danger" onClick={() => {
                if (onConfirm) onConfirm();
            }}>Delete</button>
        </ModalFooter>
    </Modal>;
}

export default ConfirmModal;