"use client";

import { useState } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import {
  mergeGuestChatsAction,
  markDeviceAsRegisteredAction,
} from "@/app/actions/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/utils/toast";
import { X, Lock, Mail, Sparkles, Loader2 } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthSuccess: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const isGuest = currentUser?.is_anonymous ?? true;

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/chat`
          : undefined;

      await markDeviceAsRegisteredAction();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      console.error("Google sign in error:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to sign in with Google";
      showToast({ message: msg, type: "error" });
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast({ message: "Please fill in all fields", type: "error" });
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        if (isGuest && currentUser) {
          // Upgrade the existing guest into a permanent user (retaining exact user_id!)
          const { error } = await supabase.auth.updateUser({
            email,
            password,
          });

          if (error) throw error;

          await markDeviceAsRegisteredAction();

          showToast({
            message: "Account created successfully! Your chats are saved.",
            type: "success",
          });
          onAuthSuccess();
          onClose();
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) throw error;

          await markDeviceAsRegisteredAction();

          showToast({
            message: "Check your email to confirm your account!",
            type: "success",
          });
          onAuthSuccess();
          onClose();
        }
      } else {
        // Sign in to existing account
        const guestId = currentUser?.id;
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        await markDeviceAsRegisteredAction();

        // If user was a guest and has existing chats, merge them into this account
        if (isGuest && guestId && data.user.id !== guestId) {
          await mergeGuestChatsAction(guestId);
        }

        showToast({ message: "Signed in successfully!", type: "success" });
        onAuthSuccess();
        onClose();
      }
    } catch (err: unknown) {
      console.error("Auth error:", err);
      const msg = err instanceof Error ? err.message : "Authentication failed";
      showToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {mode === "signup" ? "Save & Sync Your Chats" : "Welcome Back"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {mode === "signup"
              ? "Convert your guest session into a permanent account to access your conversations on any device."
              : "Sign in to access all your synced conversations."}
          </p>
        </div>

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 h-10 border-border"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span className="text-xs sm:text-sm font-medium">
            Continue with Google
          </span>
        </Button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="absolute bg-card px-2 text-[11px] text-muted-foreground uppercase tracking-wider">
            Or with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9 h-10 text-xs sm:text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 h-10 text-xs sm:text-sm"
                disabled={loading}
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 font-medium text-xs sm:text-sm mt-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "signup" ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center text-xs text-muted-foreground">
          {mode === "signup" ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-primary font-medium hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-primary font-medium hover:underline"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
