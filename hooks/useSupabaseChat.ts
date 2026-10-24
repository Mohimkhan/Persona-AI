"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { Chat, Message as DbMessage } from "@/types/database.types";
import {
  fetchChatsAction,
  createChatAction,
  deleteChatAction,
  fetchMessagesAction,
  insertMessageAction,
  clearChatMessagesAction,
  updateChatTitleAction,
  migrateLocalStorageChatsAction,
  LocalStorageChatPayload,
  SerializedMessage,
} from "@/app/actions/chat";
import { createClient } from "@/lib/utils/supabase/client";
import { showToast } from "@/lib/utils/toast";
import { type YouTubeVideo } from "@/app/actions/yt";

export const PERSONAS = {
  angry_gf: {
    name: "Angry Girlfriend",
    image: "/images/angry_gf.png",
    fallback: "AGF",
    greeting:
      "Oh, so you finally have time to talk to me? Who were you texting just now?",
  },
  tech_bro: {
    name: "Analogy Tech Bro",
    image: "/images/tech_bro.png",
    fallback: "ATB",
    greeting:
      "Yo! Ready to build something scalable? Or do you need me to explain Docker using a tupperware analogy again?",
  },
} as const;

export type PersonaType = keyof typeof PERSONAS;

export function useSupabaseChat(initialPersona: PersonaType = "tech_bro") {
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SerializedMessage[]>([]);
  const [activePersona, setActivePersona] = useState<PersonaType>(initialPersona);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isInitializingRef = useRef(false);
  const supabase = createClient();

  // Find active chat object
  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  // Sync active persona when active chat changes
  useEffect(() => {
    if (activeChat && activeChat.persona !== activePersona) {
      setActivePersona(activeChat.persona as PersonaType);
    }
  }, [activeChat, activePersona]);

  // Load messages for a given chat via Server Action
  const loadMessagesForChat = useCallback(
    async (chatId: string, persona: PersonaType) => {
      setIsLoadingMessages(true);
      try {
        const res = await fetchMessagesAction(chatId);
        if (!res.success) {
          throw new Error(res.error || "Failed to load messages");
        }

        if (res.messages.length === 0) {
          // If fresh chat with no messages, show initial greeting
          const greetingMsg: SerializedMessage = {
            id: `greeting-${chatId}`,
            role: "assistant",
            content: PERSONAS[persona].greeting,
          };
          setMessages([greetingMsg]);
        } else {
          setMessages(res.messages);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
        showToast({ message: "Failed to load messages", type: "error" });
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [],
  );

  // Initialize Auth session, migrate LocalStorage, and fetch chats
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    async function init() {
      setIsLoadingSession(true);
      try {
        // 1. Resolve user session on client / anonymous login
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        let resolvedUser = currentUser;
        if (!resolvedUser) {
          const { data: anonData, error: anonError } =
            await supabase.auth.signInAnonymously();
          if (anonError) throw anonError;
          resolvedUser = anonData.user;
        }

        setUser(resolvedUser);

        // 2. Perform one-time LocalStorage migration
        if (typeof window !== "undefined") {
          const MIGRATION_KEY = "persona_ai_migrated_v1";
          if (!window.localStorage.getItem(MIGRATION_KEY)) {
            const personas: PersonaType[] = ["tech_bro", "angry_gf"];
            const payloads: LocalStorageChatPayload[] = [];

            for (const p of personas) {
              const raw = window.localStorage.getItem(`chatMessages:${p}`);
              if (!raw) continue;
              try {
                const msgs = JSON.parse(raw);
                if (Array.isArray(msgs) && msgs.some((m) => m.role === "user")) {
                  const firstUser = msgs.find((m) => m.role === "user");
                  const title = firstUser
                    ? firstUser.content.slice(0, 36) +
                      (firstUser.content.length > 36 ? "..." : "")
                    : `${p === "tech_bro" ? "Tech Bro" : "Angry GF"} Chat`;
                  payloads.push({
                    persona: p,
                    title,
                    messages: msgs.map((m) => ({
                      role: m.role,
                      content: m.content,
                      data: m.data || [],
                    })),
                  });
                }
              } catch (e) {
                console.error("Failed parsing localStorage for migration:", e);
              }
            }

            if (payloads.length > 0) {
              const migRes = await migrateLocalStorageChatsAction(payloads);
              if (migRes.success) {
                window.localStorage.setItem(MIGRATION_KEY, "true");
              }
            } else {
              window.localStorage.setItem(MIGRATION_KEY, "true");
            }
          }
        }

        // 3. Fetch chats via Server Action
        setIsLoadingChats(true);
        const chatsRes = await fetchChatsAction();
        if (chatsRes.success) {
          const fetchedChats = chatsRes.chats;
          setChats(fetchedChats);

          if (fetchedChats.length > 0) {
            const matchingChat =
              fetchedChats.find((c) => c.persona === initialPersona) ||
              fetchedChats[0];
            setActiveChatId(matchingChat.id);
            setActivePersona(matchingChat.persona as PersonaType);
            await loadMessagesForChat(
              matchingChat.id,
              matchingChat.persona as PersonaType,
            );
          } else {
            // Create first chat if none exist
            const newChatRes = await createChatAction(
              initialPersona,
              "New Conversation",
            );
            if (newChatRes.success && newChatRes.chat) {
              setChats([newChatRes.chat]);
              setActiveChatId(newChatRes.chat.id);
              setActivePersona(initialPersona);
              setMessages([
                {
                  id: `greeting-${newChatRes.chat.id}`,
                  role: "assistant",
                  content: PERSONAS[initialPersona].greeting,
                },
              ]);
            }
          }
        }
        setIsLoadingChats(false);
      } catch (err) {
        console.error("Chat initialization error:", err);
        showToast({ message: "Failed to connect to chat service", type: "error" });
      } finally {
        setIsLoadingSession(false);
      }
    }

    init();
  }, [initialPersona, loadMessagesForChat, supabase]);

  // Realtime subscription: Listen for live inserts/updates on active chat
  useEffect(() => {
    if (!activeChatId) return;

    const channel = supabase
      .channel(`realtime:messages:${activeChatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${activeChatId}`,
        },
        (payload) => {
          const newRow = payload.new as DbMessage;
          setMessages((prev) => {
            // Deduplicate if optimistic message or already in state
            if (prev.some((m) => m.id === newRow.id)) {
              return prev;
            }
            return [
              ...prev,
              {
                id: newRow.id,
                role: newRow.role as "user" | "assistant",
                content: newRow.content,
                data: (newRow.data as unknown as YouTubeVideo[]) || [],
                created_at: newRow.created_at,
              },
            ];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatId, supabase]);

  // Select an existing chat
  const handleSelectChat = useCallback(
    async (chatId: string) => {
      if (chatId === activeChatId) return;
      const targetChat = chats.find((c) => c.id === chatId);
      if (!targetChat) return;

      setActiveChatId(chatId);
      setActivePersona(targetChat.persona as PersonaType);
      await loadMessagesForChat(chatId, targetChat.persona as PersonaType);
    },
    [activeChatId, chats, loadMessagesForChat],
  );

  // Create a new chat session via Server Action
  const handleCreateNewChat = useCallback(
    async (personaToCreate?: PersonaType) => {
      const chosenPersona = personaToCreate || activePersona;

      try {
        const res = await createChatAction(chosenPersona, "New Conversation");
        if (res.success && res.chat) {
          setChats((prev) => [res.chat!, ...prev]);
          setActiveChatId(res.chat.id);
          setActivePersona(chosenPersona);
          setMessages([
            {
              id: `greeting-${res.chat.id}`,
              role: "assistant",
              content: PERSONAS[chosenPersona].greeting,
            },
          ]);
        }
      } catch (err) {
        console.error("Error creating new chat:", err);
        showToast({ message: "Failed to create new chat", type: "error" });
      }
    },
    [activePersona],
  );

  // Delete a chat session via Server Action
  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      try {
        const res = await deleteChatAction(chatId);
        if (!res.success) {
          throw new Error(res.error || "Failed to delete chat");
        }

        const remainingChats = chats.filter((c) => c.id !== chatId);
        setChats(remainingChats);

        if (activeChatId === chatId) {
          if (remainingChats.length > 0) {
            const nextChat = remainingChats[0];
            setActiveChatId(nextChat.id);
            setActivePersona(nextChat.persona as PersonaType);
            await loadMessagesForChat(
              nextChat.id,
              nextChat.persona as PersonaType,
            );
          } else {
            // All chats deleted; create a fresh one
            const freshRes = await createChatAction(
              activePersona,
              "New Conversation",
            );
            if (freshRes.success && freshRes.chat) {
              setChats([freshRes.chat]);
              setActiveChatId(freshRes.chat.id);
              setMessages([
                {
                  id: `greeting-${freshRes.chat.id}`,
                  role: "assistant",
                  content: PERSONAS[activePersona].greeting,
                },
              ]);
            }
          }
        }
        showToast({ message: "Chat deleted", type: "success" });
      } catch (err) {
        console.error("Error deleting chat:", err);
        showToast({ message: "Failed to delete chat", type: "error" });
      }
    },
    [activeChatId, activePersona, chats, loadMessagesForChat],
  );

  // Clear messages in active chat via Server Action
  const handleClearCurrentChat = useCallback(async () => {
    if (!activeChatId) return;

    try {
      const res = await clearChatMessagesAction(activeChatId);
      if (!res.success) throw new Error(res.error || "Failed to clear chat");

      setMessages([
        {
          id: `greeting-${activeChatId}`,
          role: "assistant",
          content: PERSONAS[activePersona].greeting,
        },
      ]);
      showToast({ message: "Chat cleared", type: "success" });
    } catch (err) {
      console.error("Error clearing chat:", err);
      showToast({ message: "Failed to clear chat", type: "error" });
    }
  }, [activeChatId, activePersona]);

  // Send message via Server Action and AI route
  const handleSendMessage = useCallback(
    async (inputContent: string) => {
      if (!inputContent.trim() || isSending || !activeChatId) return;

      const userText = inputContent.trim();
      const tempId = `temp-${Date.now()}`;
      const optimisticUserMsg: SerializedMessage = {
        id: tempId,
        role: "user",
        content: userText,
      };

      const updatedMessages = [...messages, optimisticUserMsg];
      setMessages(updatedMessages);
      setIsSending(true);

      try {
        // 1. Insert user message via Server Action
        const insertRes = await insertMessageAction(
          activeChatId,
          "user",
          userText,
        );

        if (insertRes.success && insertRes.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? insertRes.message! : m)),
          );
        }

        // 2. Update title if it was "New Conversation"
        if (
          activeChat &&
          (activeChat.title === "New Conversation" || !activeChat.title)
        ) {
          const newTitle =
            userText.length > 32 ? userText.slice(0, 32) + "..." : userText;
          updateChatTitleAction(activeChatId, newTitle).catch(console.error);
          setChats((prev) =>
            prev.map((c) =>
              c.id === activeChatId ? { ...c, title: newTitle } : c,
            ),
          );
        }

        // 3. Call AI Chat API
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            persona: activePersona,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw errorData || new Error("Failed to fetch response");
        }

        const data = await res.json();
        const assistantText = data.text || "";
        const assistantVideos = (data?.data as YouTubeVideo[]) || [];

        // 4. Save AI assistant message via Server Action
        const assistantRes = await insertMessageAction(
          activeChatId,
          "assistant",
          assistantText,
          assistantVideos,
        );

        if (assistantRes.success && assistantRes.message) {
          setMessages((prev) => {
            // Deduplicate if already picked up by Realtime listener
            if (prev.some((m) => m.id === assistantRes.message!.id)) {
              return prev;
            }
            return [...prev, assistantRes.message!];
          });
        }

        // 5. Update local chat list order
        setChats((prev) => {
          const current = prev.find((c) => c.id === activeChatId);
          if (!current) return prev;
          const remaining = prev.filter((c) => c.id !== activeChatId);
          return [
            { ...current, updated_at: new Date().toISOString() },
            ...remaining,
          ];
        });
      } catch (err: unknown) {
        console.error("Send message error:", err);
        const errorObj = err as { code?: number };
        if (errorObj?.code === 503) {
          showToast({
            message: "Model is currently busy right now",
            type: "error",
          });
        } else {
          showToast({ message: "Something went wrong", type: "error" });
        }
      } finally {
        setIsSending(false);
      }
    },
    [activeChat, activeChatId, activePersona, isSending, messages],
  );

  return {
    user,
    chats,
    activeChat,
    activeChatId,
    activePersona,
    messages,
    isLoadingSession,
    isLoadingChats,
    isLoadingMessages,
    isSending,
    handleSelectChat,
    handleCreateNewChat,
    handleDeleteChat,
    handleClearCurrentChat,
    handleSendMessage,
    setActivePersona,
  };
}
