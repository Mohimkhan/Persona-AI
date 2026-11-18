"use client";

import { useState } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import {
  mergeGuestChatsAction,
  markDeviceAsRegisteredAction,
} from "@/app/actions/chat";
import { getDeviceFingerprint } from "@/lib/utils/fingerprint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/utils/toast";
import { FiX, FiLock, FiMail, FiLoader } from "react-icons/fi";
import { RiSparklingLine } from "react-icons/ri";
import { FcGoogle } from "react-icons/fc";
import { User } from "@supabase/supabase-js";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { IoIosEyeOff } from "react-icons/io";
import { IoMdEye } from "react-icons/io";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthSuccess: () => void;
}

const signInUpSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

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
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();
  const isGuest = currentUser?.is_anonymous ?? true;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signInUpSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

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
      const deviceHash = await getDeviceFingerprint();

      if (mode === "signup") {
        if (isGuest && currentUser) {
          // Upgrade the existing guest into a permanent user (retaining exact user_id!)
          const { error } = await supabase.auth.updateUser({
            email,
            password,
            data: { device_hash: deviceHash, is_guest: false },
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
            options: {
              data: { device_hash: deviceHash, is_guest: false },
            },
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
        // Sign in to existing account without contaminating with temporary guest chats
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        await markDeviceAsRegisteredAction();

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
          <FiX className="h-4 w-4" />
        </Button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-1">
            <RiSparklingLine className="w-6 h-6" />
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
          <FcGoogle className="h-5 w-5 shrink-0" />
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
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 h-10 text-xs sm:text-sm"
                disabled={loading}
                minLength={6}
              />
              <div onClick={() => setShowPassword(!showPassword)}>
                {!!password.trim().length &&
                  (!showPassword ? (
                    <IoIosEyeOff className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <IoMdEye className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  ))}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 font-medium text-xs sm:text-sm mt-2"
            disabled={loading}
          >
            {loading ? (
              <FiLoader className="h-4 w-4 animate-spin" />
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
