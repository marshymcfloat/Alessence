"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmText = "Continue",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              variant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {isLoading ? "Please wait..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for easier usage
interface UseConfirmDialogOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    options: UseConfirmDialogOptions | null;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    options: null,
    resolve: null,
  });

  const confirm = React.useCallback(
    (options: UseConfirmDialogOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          open: true,
          options,
          resolve,
        });
      });
    },
    []
  );

  const handleConfirm = React.useCallback(() => {
    dialogState.resolve?.(true);
    setDialogState((prev) => ({ ...prev, open: false }));
  }, [dialogState.resolve]);

  const handleCancel = React.useCallback(() => {
    dialogState.resolve?.(false);
    setDialogState((prev) => ({ ...prev, open: false }));
  }, [dialogState.resolve]);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        dialogState.resolve?.(false);
      }
      setDialogState((prev) => ({ ...prev, open }));
    },
    [dialogState.resolve]
  );

  const ConfirmDialogComponent = React.useMemo(() => {
    if (!dialogState.options) return null;

    return (
      <ConfirmDialog
        open={dialogState.open}
        onOpenChange={handleOpenChange}
        title={dialogState.options.title}
        description={dialogState.options.description}
        confirmText={dialogState.options.confirmText}
        cancelText={dialogState.options.cancelText}
        variant={dialogState.options.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }, [dialogState, handleConfirm, handleCancel, handleOpenChange]);

  return { confirm, ConfirmDialogComponent };
}

