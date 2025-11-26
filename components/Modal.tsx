import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import type { ButtonProps } from "@mui/material/Button";
import type { ReactNode } from "react";

export type ModalAction = {
  label: string;
  onClick: () => void | Promise<void>;
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  startIcon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
};

interface ModalProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ModalAction[];
  onClose?: () => void;
  contentClassName?: string;
}

/**
 * Generic dialog wrapper that standardizes title, description, custom content,
 * and a dynamic action footer with optional loading indicators.
 */
const Modal = ({
  open,
  title,
  description,
  children,
  actions,
  onClose,
  contentClassName,
}: ModalProps) => {
  const hasContent = Boolean(description) || Boolean(children);

  const renderDescription = () => {
    if (!description) return null;
    if (typeof description === "string") {
      return <DialogContentText>{description}</DialogContentText>;
    }
    return description;
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      {hasContent && (
        <DialogContent className={contentClassName}>
          {renderDescription()}
          {children}
        </DialogContent>
      )}
      {actions?.length ? (
        <DialogActions>
          {actions.map((action) => (
            <Button
              key={action.label}
              onClick={action.onClick}
              color={action.color}
              variant={action.variant}
              startIcon={action.startIcon}
              disabled={action.disabled || action.loading}
              autoFocus={action.autoFocus}
            >
              {action.loading ? <CircularProgress size={18} /> : action.label}
            </Button>
          ))}
        </DialogActions>
      ) : null}
    </Dialog>
  );
};

export default Modal;
