import { createContext, useContext, useCallback } from "react";
import { toast, type ToastOptions } from "react-toastify";

interface NotificationContextType {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const success = useCallback(
    (message: string, options?: ToastOptions) => toast.success(message, options),
    []
  );
  const error = useCallback(
    (message: string, options?: ToastOptions) => toast.error(message, options),
    []
  );
  const warning = useCallback(
    (message: string, options?: ToastOptions) => toast.warning(message, options),
    []
  );
  const info = useCallback(
    (message: string, options?: ToastOptions) => toast.info(message, options),
    []
  );

  return (
    <NotificationContext.Provider value={{ success, error, warning, info }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
