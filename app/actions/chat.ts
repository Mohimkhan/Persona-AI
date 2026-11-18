"use server";

import { cookies } from "next/headers";
import {
  getSupabaseServerClient,
  createServerSupabaseAdminClient,
} from "@/lib/utils/supabase/server";
import { Chat, Message as DbMessage } from "@/types/database.types";
import { type YouTubeVideo } from "@/app/actions/yt";

const GUEST_MESSAGE_LIMIT = 5;

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
 * Guard 1: Sets an HttpOnly, secure cookie to mark this browser/device as registered.
 * Unreachable and unmodifiable by client JavaScript or DevTools.
 */
export async function markDeviceAsRegisteredAction() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "ps_registered_device",
    value: "true",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
  return { success: true };
}

/**
 * Checks if the current visitor is eligible for a guest session,
 * whether they have reached the 5-message preview limit, or are already registered.
 * Checks both the HttpOnly cookie and the hardware device fingerprint.
 */
export async function checkGuestEligibilityAction(deviceHash?: string): Promise<{
  eligibleForGuest: boolean;
  isRegisteredDevice: boolean;
  messageLimitReached?: boolean;
  guestMessagesUsed?: number;
  remainingGuestMessages?: number;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const isRegisteredDevice =
      cookieStore.get("ps_registered_device")?.value === "true";

    if (isRegisteredDevice) {
      return {
        eligibleForGuest: false,
        isRegisteredDevice: true,
        messageLimitReached: true,
        guestMessagesUsed: 0,
        remainingGuestMessages: 0,
      };
    }

    // Check device fingerprint against PostgreSQL
    if (deviceHash) {
      const admin = await createServerSupabaseAdminClient();
      const { data: matchedUsers } = await admin
        .from("users")
        .select("id, email, raw_user_meta_data")
        .filter("raw_user_meta_data->>device_hash", "eq", deviceHash);

      if (matchedUsers && matchedUsers.length > 0) {
        const hasRegisteredUser = matchedUsers.some((u) => u.email !== null);
        if (hasRegisteredUser) {
          return {
            eligibleForGuest: false,
            isRegisteredDevice: true,
            messageLimitReached: true,
            guestMessagesUsed: 0,
            remainingGuestMessages: 0,
            error:
              "This device is already linked to an account. Please sign in to continue.",
          };
        }

        // Already created a guest session on this device
        return {
          eligibleForGuest: false,
          isRegisteredDevice: false,
          messageLimitReached: true,
          guestMessagesUsed: GUEST_MESSAGE_LIMIT,
          remainingGuestMessages: 0,
          error:
            "A guest session has already been used on this device. Please create an account or sign in to continue.",
        };
      }
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If user is already an active guest, count user messages
    if (user && user.is_anonymous) {
      const admin = await createServerSupabaseAdminClient();
      const { count } = await admin
        .from("messages")
        .select("id, chats!inner(user_id)", { count: "exact", head: true })
        .eq("chats.user_id", user.id)
        .eq("role", "user");

      const used = count || 0;
      const remaining = Math.max(0, GUEST_MESSAGE_LIMIT - used);

      return {
        eligibleForGuest: remaining > 0,
        isRegisteredDevice: false,
        messageLimitReached: remaining <= 0,
        guestMessagesUsed: used,
        remainingGuestMessages: remaining,
      };
    }

    // Clean visitor
    return {
      eligibleForGuest: true,
      isRegisteredDevice: false,
      messageLimitReached: false,
      guestMessagesUsed: 0,
      remainingGuestMessages: GUEST_MESSAGE_LIMIT,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return {
      eligibleForGuest: true,
      isRegisteredDevice: false,
      error: message,
    };
  }
}

/**
 * Explicitly creates a guest session when requested by the user.
 * Rejected if the device is marked as registered or has already used its guest allowance.
 */
export async function createGuestAccountAction(deviceHash?: string): Promise<{
  success: boolean;
  user?: unknown;
  error?: string;
  isRegisteredDevice?: boolean;
}> {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("ps_registered_device")?.value === "true") {
      return {
        success: false,
        isRegisteredDevice: true,
        error:
          "This device already has a registered account. Please sign in to continue.",
      };
    }

    // Check device fingerprint in DB to prevent duplicate guest creation even if cookies deleted
    if (deviceHash) {
      const admin = await createServerSupabaseAdminClient();
      const { data: matchedUsers } = await admin
        .from("users")
        .select("id, email, raw_user_meta_data")
        .filter("raw_user_meta_data->>device_hash", "eq", deviceHash);

      if (matchedUsers && matchedUsers.length > 0) {
        const hasRegistered = matchedUsers.some((u) => u.email !== null);
        return {
          success: false,
          isRegisteredDevice: hasRegistered,
          error: hasRegistered
            ? "This device already has a registered account. Please sign in to continue."
            : "A guest session has already been used on this device. Please create an account or sign in to continue.",
        };
      }
    }

    const supabase = await getSupabaseServerClient();
    const { data: anonData, error } = await supabase.auth.signInAnonymously({
      options: {
        data: deviceHash
          ? { device_hash: deviceHash, is_guest: true }
          : { is_guest: true },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: anonData.user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return { success: false, error: message };
  }
}

/**
 * Fetches all chats for the currently authenticated or guest user.
 * Does NOT automatically create guest accounts on page load.
 */
export async function fetchChatsAction(): Promise<{
  success: boolean;
  chats: Chat[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, chats: [] };
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
 * Creates a new chat session for an authenticated or guest user.
 */
export async function createChatAction(
  persona: "tech_bro" | "angry_gf",
  title: string = "New Conversation",
): Promise<{ success: boolean; chat?: Chat; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
 * Enforces a 5-message cap on anonymous guests (Guard 3).
 */
export async function insertMessageAction(
  chatId: string,
  role: "user" | "assistant",
  content: string,
  data?: YouTubeVideo[],
): Promise<{
  success: boolean;
  message?: SerializedMessage;
  error?: string;
  limitReached?: boolean;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Guard 3: If user is an anonymous guest and sending a user message, enforce 5-message limit
    if (user.is_anonymous && role === "user") {
      const admin = await createServerSupabaseAdminClient();
      const { count } = await admin
        .from("messages")
        .select("id, chats!inner(user_id)", { count: "exact", head: true })
        .eq("chats.user_id", user.id)
        .eq("role", "user");

      const userMsgCount = count || 0;
      if (userMsgCount >= GUEST_MESSAGE_LIMIT) {
        return {
          success: false,
          limitReached: true,
          error:
            "You have reached the free guest preview limit of 5 messages. Please sign in or create an account to continue.",
        };
      }
    }

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

    await markDeviceAsRegisteredAction();

    return { success: true, mergedCount: updated?.length || 0 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return { success: false, mergedCount: 0, error: message };
  }
}
