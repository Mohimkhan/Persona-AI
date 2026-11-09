"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, User, Loader2 } from "lucide-react";

interface GuestPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaName: string;
  onSignIn: () => void;
  onContinueAsGuest: () => Promise<void>;
}

export function GuestPromptModal({
  isOpen,
  onClose,
  personaName,
  onSignIn,
  onContinueAsGuest,
}: GuestPromptModalProps) {
  const [loadingGuest, setLoadingGuest] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loadingGuest) {
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
  }, [isOpen, loadingGuest, onClose]);

  if (!isOpen) return null;

  const handleGuestClick = async () => {
    setLoadingGuest(true);
    try {
      await onContinueAsGuest();
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
      onClick={() => {
        if (!loadingGuest) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-card border border-border text-card-foreground rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          disabled={loadingGuest}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        {/* Modal Header */}
        <div className="space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Save your conversation with {personaName}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Persona AI uses accounts to remember your context and past
              conversations. You can jump straight in as a{" "}
              <strong className="text-foreground font-semibold">Guest</strong>{" "}
              right now, and all your messages will automatically merge into your
              account if you choose to sign up later.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGuestClick}
            disabled={loadingGuest}
            className="w-full sm:w-auto text-xs h-9 px-4 gap-1.5 font-medium"
          >
            {loadingGuest ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Starting Session...</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Try as Guest</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={() => {
              onClose();
              onSignIn();
            }}
            disabled={loadingGuest}
            className="w-full sm:w-auto text-xs h-9 px-5 font-semibold"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
