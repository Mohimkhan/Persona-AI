"use client";

import { useState } from "react";
import { Chat } from "@/types/database.types";
import { PersonaType, PERSONAS } from "@/hooks/useSupabaseChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  MessageSquare,
  Bot,
  User as UserIcon,
  X,
  Sparkles,
  LogIn,
  LogOut,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AuthModal } from "@/components/auth/AuthModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createClient } from "@/lib/utils/supabase/client";

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  activePersona: PersonaType;
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  onCreateNewChat: (persona?: PersonaType) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat?: (chatId: string, newTitle: string) => void;
  onSessionChange?: () => void;
  onLogout?: () => void;
}

export function ChatSidebar({
  chats,
  activeChatId,
  activePersona,
  user,
  isOpen,
  onClose,
  onSelectChat,
  onCreateNewChat,
  onDeleteChat,
  onRenameChat,
  onSessionChange,
  onLogout,
}: ChatSidebarProps) {
  const [filterPersona, setFilterPersona] = useState<"all" | PersonaType>("all");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Dialog states for delete chat & logout confirmation
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const supabase = createClient();
  const isGuest = user?.is_anonymous ?? true;

  const filteredChats = chats.filter((c) => {
    if (filterPersona === "all") return true;
    return c.persona === filterPersona;
  });

  const formatRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const handleStartRename = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title || "");
  };

  const handleSaveRename = (chatId: string) => {
    const currentChat = chats.find((c) => c.id === chatId);
    const trimmedNew = editTitle.trim();
    const trimmedOld = (currentChat?.title || "").trim();

    // Only call rename action if title actually changed and is non-empty
    if (onRenameChat && trimmedNew && trimmedNew !== trimmedOld) {
      onRenameChat(chatId, trimmedNew);
    }
    setEditingChatId(null);
  };

  const handleExecuteLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onAuthSuccess={() => {
          if (onSessionChange) onSessionChange();
        }}
      />

      {/* Delete Chat Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!chatToDelete}
        onClose={() => setChatToDelete(null)}
        onConfirm={() => {
          if (chatToDelete) {
            onDeleteChat(chatToDelete.id);
            setChatToDelete(null);
          }
        }}
        title="Delete conversation?"
        description={`Are you sure you want to delete "${
          chatToDelete?.title || "this chat"
        }"? All messages in this conversation will be permanently removed.`}
        confirmText="Delete Chat"
        variant="destructive"
        icon={<Trash2 className="w-5 h-5" />}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleExecuteLogout}
        title="Sign out of your account?"
        description="Are you sure you want to sign out? You can sign back in at any time to access your saved conversations."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="destructive"
        icon={<LogOut className="w-5 h-5" />}
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 sm:w-80 bg-card border-r border-border flex flex-col h-full transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-sm tracking-tight">Conversations</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* New Chat Button */}
          <Button
            onClick={() => {
              onCreateNewChat(activePersona);
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full justify-center gap-2 font-medium h-9 text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </Button>

          {/* Persona Filter Tabs */}
          <div className="flex p-0.5 rounded-lg bg-muted/60 text-muted-foreground text-xs">
            <button
              onClick={() => setFilterPersona("all")}
              className={`flex-1 py-1 rounded-md transition-all font-medium ${
                filterPersona === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterPersona("tech_bro")}
              className={`flex-1 py-1 rounded-md transition-all font-medium ${
                filterPersona === "tech_bro"
                  ? "bg-background text-foreground shadow-xs"
                  : "hover:text-foreground"
              }`}
            >
              Tech Bro
            </button>
            <button
              onClick={() => setFilterPersona("angry_gf")}
              className={`flex-1 py-1 rounded-md transition-all font-medium ${
                filterPersona === "angry_gf"
                  ? "bg-background text-foreground shadow-xs"
                  : "hover:text-foreground"
              }`}
            >
              Angry GF
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4 text-muted-foreground">
              <Sparkles className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">No chats found</p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                Start a new conversation above!
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isEditing = editingChatId === chat.id;
              const personaInfo =
                PERSONAS[chat.persona as PersonaType] || PERSONAS.tech_bro;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectChat(chat.id);
                      if (window.innerWidth < 768) onClose();
                    }
                  }}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-left transition-colors ${
                    isActive
                      ? "bg-muted text-foreground font-medium shadow-xs"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {/* Persona Avatar */}
                  <Avatar className="w-7 h-7 shrink-0 border border-border/50">
                    <AvatarImage
                      src={personaInfo.image}
                      alt={personaInfo.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-[10px]">
                      {personaInfo.fallback}
                    </AvatarFallback>
                  </Avatar>

                  {/* Title & Timestamp */}
                  <div className="flex-1 min-w-0 pr-12">
                    {isEditing ? (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(chat.id);
                            if (e.key === "Escape") setEditingChatId(null);
                          }}
                          className="h-6 text-xs px-1.5 py-0"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(chat.id)}
                          className="text-primary hover:text-primary/80 p-0.5"
                          title="Save title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs truncate leading-snug">
                          {chat.title || "New Conversation"}
                        </p>
                        <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                          {formatRelativeTime(chat.updated_at)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Action Buttons (visible on hover) */}
                  {!isEditing && (
                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <button
                        onClick={(e) => handleStartRename(e, chat)}
                        title="Rename Chat"
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatToDelete(chat);
                        }}
                        title="Delete Chat"
                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border bg-card/50 space-y-2">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-muted/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {isGuest ? (
                    <Bot className="w-3.5 h-3.5" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-foreground">
                  {isGuest
                    ? "Guest User"
                    : user?.user_metadata?.full_name ||
                      user?.email?.split("@")[0] ||
                      "Account"}
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>{isGuest ? "Temporary Session" : user?.email}</span>
                </p>
              </div>
            </div>

            {!isGuest && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutConfirm(true)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Upgrade / Sign In Banner for Guests */}
          {isGuest && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full text-xs h-8 gap-1.5 border-primary/20 hover:border-primary/50 text-foreground"
            >
              <LogIn className="w-3.5 h-3.5 text-primary" />
              <span>Sign In / Save Chats</span>
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
