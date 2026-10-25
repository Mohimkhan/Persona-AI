"use server";

import {
  getSupabaseServerClient,
  createServerSupabaseAdminClient,
} from "@/lib/utils/supabase/server";
import { Chat, Message as DbMessage } from "@/types/database.types";
import { type YouTubeVideo } from "@/app/actions/yt";

export interface SerializedMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  data?: YouTubeVideo[];
  created_at?: string;
}

export interface LocalStorageChatPayload {
  persona: "tech_bro" | "angry_gf";
  title: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    data?: YouTubeVideo[];
  }>;
}

/**
 * Ensures the session is resolved on the server.
 * If no session exists, creates an anonymous user and persists session cookies.
 */
export async function getOrCreateUserSessionAction() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { user };
  }

  const { data: anonData, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("Server Action: Error signing in anonymously:", error.message);
    throw new Error(error.message);
  }

  return { user: anonData.user };
}

/**
 * Server Action: Fetches all chats for the currently authenticated or guest user.
 */
export async function fetchChatsAction(): Promise<{
  success: boolean;
  chats: Chat[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const { data: anonData } = await supabase.auth.signInAnonymously();
      user = anonData?.user || null;
    }

    if (!user) {
      return { success: false, chats: [], error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("fetchChatsAction error:", error);
      return { success: false, chats: [], error: error.message };
    }

    return { success: true, chats: (data as Chat[]) || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return { success: false, chats: [], error: message };
  }
}

/**
 * Server Action: Creates a new chat session.
 */
export async function createChatAction(
  persona: "tech_bro" | "angry_gf",
  title: string = "New Conversation",
): Promise<{ success: boolean; chat?: Chat; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const { data: anonData } = await supabase.auth.signInAnonymously();
      user = anonData?.user || null;
    }

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("chats")
      .insert({
        user_id: user.id,
        persona,
        title,
      })
      .select()
      .single();

    if (error) {
      console.error("createChatAction error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, chat: data as Chat };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Updates a chat title.
 */
export async function updateChatTitleAction(
  chatId: string,
  title: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("chats")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", chatId);

    if (error) {
      console.error("updateChatTitleAction error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Deletes a chat session (cascades automatically to all messages).
 */
export async function deleteChatAction(
  chatId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("chats").delete().eq("id", chatId);

    if (error) {
      console.error("deleteChatAction error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Fetches all messages for a specific chat.
 */
export async function fetchMessagesAction(
  chatId: string,
): Promise<{ success: boolean; messages: SerializedMessage[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("fetchMessagesAction error:", error);
      return { success: false, messages: [], error: error.message };
    }

    const serialized: SerializedMessage[] = ((data as DbMessage[]) || []).map(
      (m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        data: (m.data as unknown as YouTubeVideo[]) || [],
        created_at: m.created_at,
      }),
    );

    return { success: true, messages: serialized };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return { success: false, messages: [], error: message };
  }
}

/**
 * Server Action: Inserts a message into the database.
 */
export async function insertMessageAction(
  chatId: string,
  role: "user" | "assistant",
  content: string,
  data?: YouTubeVideo[],
): Promise<{ success: boolean; message?: SerializedMessage; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        role,
        content,
        data: (data || []) as unknown as null,
      })
      .select()
      .single();

    if (error) {
      console.error("insertMessageAction error:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: {
        id: inserted.id,
        role: inserted.role as "user" | "assistant",
        content: inserted.content,
        data: (inserted.data as unknown as YouTubeVideo[]) || [],
        created_at: inserted.created_at,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Clears all messages in a chat thread.
 */
export async function clearChatMessagesAction(
  chatId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("chat_id", chatId);

    if (error) {
      console.error("clearChatMessagesAction error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Safely migrates local storage chat payloads into Supabase.
 */
export async function migrateLocalStorageChatsAction(
  payloads: LocalStorageChatPayload[],
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const { data: anonData } = await supabase.auth.signInAnonymously();
      user = anonData?.user || null;
    }

    if (!user) {
      return { success: false, migratedCount: 0, error: "Not authenticated" };
    }

    let count = 0;

    for (const item of payloads) {
      if (!item.messages || item.messages.length === 0) continue;

      // 1. Create chat record
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .insert({
          user_id: user.id,
          persona: item.persona,
          title: item.title,
        })
        .select()
        .single();

      if (chatError || !chat) {
        console.error("migrateLocalStorageChatsAction chat error:", chatError);
        continue;
      }

      // 2. Batch insert messages
      const msgsToInsert = item.messages.map((m) => ({
        chat_id: chat.id,
        role: m.role,
        content: m.content,
        data: (m.data || []) as unknown as null,
      }));

      const { error: msgsError } = await supabase
        .from("messages")
        .insert(msgsToInsert);

      if (msgsError) {
        console.error("migrateLocalStorageChatsAction msgs error:", msgsError);
        continue;
      }

      count++;
    }

    return { success: true, migratedCount: count };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return { success: false, migratedCount: 0, error: message };
  }
}

/**
 * Server Action: Transfers all chats from a guest user to an authenticated user when logging in.
 */
export async function mergeGuestChatsAction(
  guestUserId: string,
): Promise<{ success: boolean; mergedCount: number; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id === guestUserId) {
      return { success: true, mergedCount: 0 };
    }

    // Safely transfer chats across user_ids on the server
    const admin = await createServerSupabaseAdminClient();
    const { data: updated, error } = await admin
      .from("chats")
      .update({ user_id: user.id })
      .eq("user_id", guestUserId)
      .select();

    if (error) {
      console.error("mergeGuestChatsAction error:", error);
      return { success: false, mergedCount: 0, error: error.message };
    }

    return { success: true, mergedCount: updated?.length || 0 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return { success: false, mergedCount: 0, error: message };
  }
}
