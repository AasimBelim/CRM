export interface SignOutModalProps {
    isOpen: boolean;
    onModalChange?: (isOpen: boolean) => void;
}

export interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    size?: "sm" | "md" | "lg" | "xl";
    onConfirm: () => void;
    onCancel?: () => void;
}

export interface BannerProps {
    title: string;
    subtitle?: string;
    size?: "large" | "small";
}