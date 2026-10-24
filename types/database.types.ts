export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      chats: {
        Row: {
          created_at: string;
          id: string;
          persona: "tech_bro" | "angry_gf";
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          persona: "tech_bro" | "angry_gf";
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          persona?: "tech_bro" | "angry_gf";
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chats_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          chat_id: string;
          content: string;
          created_at: string;
          data: Json | null;
          id: string;
          role: "user" | "assistant" | "system";
        };
        Insert: {
          chat_id: string;
          content: string;
          created_at?: string;
          data?: Json | null;
          id?: string;
          role: "user" | "assistant" | "system";
        };
        Update: {
          chat_id?: string;
          content?: string;
          created_at?: string;
          data?: Json | null;
          id?: string;
          role?: "user" | "assistant" | "system";
        };
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string | null;
          fullname: string | null;
          id: string;
          image_url: string | null;
          raw_user_meta_data: Json | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          fullname?: string | null;
          id: string;
          image_url?: string | null;
          raw_user_meta_data?: Json | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          fullname?: string | null;
          id?: string;
          image_url?: string | null;
          raw_user_meta_data?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Chat = Database["public"]["Tables"]["chats"]["Row"];
export type ChatInsert = Database["public"]["Tables"]["chats"]["Insert"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
