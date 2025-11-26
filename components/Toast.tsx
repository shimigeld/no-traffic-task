import { Alert, Snackbar, type AlertColor } from "@mui/material";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface ToastContextValue {
  pushToast: (toast: ToastState) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook exposing the toast dispatch function; requires component tree to be wrapped by ToastProvider.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  autoHideDuration?: number;
}

/**
 * Hosts the snackbar UI and exposes a context API for pushing user feedback toasts.
 */
const ToastProvider = ({ children, autoHideDuration = 4000 }: ToastProviderProps) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const pushToast = useCallback((next: ToastState) => {
    setToast({ ...next, open: true });
  }, []);

  const handleClose = useCallback(() => {
    setToast((prev) => (prev ? { ...prev, open: false } : prev));
  }, []);

  const isOpen = toast?.open ?? false;
  const severity = toast?.severity ?? "success";
  const message = toast?.message ?? "";

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <Snackbar open={isOpen} autoHideDuration={autoHideDuration} onClose={handleClose}>
        <Alert severity={severity} sx={{ width: "100%" }} onClose={handleClose}>
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
