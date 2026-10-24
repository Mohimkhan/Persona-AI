"use client";

import { useState } from "react";
import { Chat } from "@/types/database.types";
import { PersonaType, PERSONAS } from "@/hooks/useSupabaseChat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Trash2,
  MessageSquare,
  Bot,
  User as UserIcon,
  X,
  Sparkles,
} from "lucide-react";
import { User } from "@supabase/supabase-js";

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
}: ChatSidebarProps) {
  const [filterPersona, setFilterPersona] = useState<"all" | PersonaType>("all");

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

  const isGuest = user?.is_anonymous ?? true;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-80 bg-card border-r border-border flex flex-col h-full transition-transform duration-300 ease-in-out md:translate-x-0 ${
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
              const personaInfo =
                PERSONAS[chat.persona as PersonaType] || PERSONAS.tech_bro;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    if (window.innerWidth < 768) onClose();
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
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs truncate leading-snug">
                      {chat.title || "New Conversation"}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                      {formatRelativeTime(chat.updated_at)}
                    </span>
                  </div>

                  {/* Delete Button (visible on hover / focus) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to delete this chat?")) {
                        onDeleteChat(chat.id);
                      }
                    }}
                    title="Delete Chat"
                    className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border bg-card/50">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-muted/40">
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
                {isGuest ? "Guest User" : user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>{isGuest ? "Cloud Synced" : user?.email}</span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
