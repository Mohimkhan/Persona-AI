"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FiAlertCircle, FiRefreshCw, FiX } from "react-icons/fi";

interface SendFailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  isLoading?: boolean;
}

export function SendFailedModal({
  isOpen,
  onClose,
  onRetry,
  isLoading = false,
}: SendFailedModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-card border border-border text-card-foreground rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          disabled={isLoading}
        >
          <FiX className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl shrink-0 bg-destructive/10 text-destructive">
            <FiAlertCircle className="w-5 h-5" />
          </div>

          <div className="space-y-1.5 pt-0.5 min-w-0 pr-6">
            <h3 className="text-lg font-bold tracking-tight text-foreground leading-snug">
              Account Couldn&apos;t Be Created
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your guest account couldn&apos;t be created because the message was not
              sent. Please try again or try after some time.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs h-9 px-4"
          >
            Close
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onRetry}
            disabled={isLoading}
            className="text-xs h-9 px-4 font-semibold gap-1.5"
          >
            <FiRefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
