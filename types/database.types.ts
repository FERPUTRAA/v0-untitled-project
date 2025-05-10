export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          username: string
          avatar_emoji: string
          created_at: string
          updated_at: string
          last_online: string
          location: string | null
          bio: string | null
          age: number | null
          gender: string | null
          share_location: boolean
          last_profile_change: string | null
        }
        Insert: {
          id: string
          email: string
          full_name: string
          username?: string
          avatar_emoji?: string
          created_at?: string
          updated_at?: string
          last_online?: string
          location?: string | null
          bio?: string | null
          age?: number | null
          gender?: string | null
          share_location?: boolean
          last_profile_change?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          username?: string
          avatar_emoji?: string
          created_at?: string
          updated_at?: string
          last_online?: string
          location?: string | null
          bio?: string | null
          age?: number | null
          gender?: string | null
          share_location?: boolean
          last_profile_change?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          created_at: string
          read: boolean
          encrypted: boolean
          media_type: string | null
          media_url: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          created_at?: string
          read?: boolean
          encrypted?: boolean
          media_type?: string | null
          media_url?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          created_at?: string
          read?: boolean
          encrypted?: boolean
          media_type?: string | null
          media_url?: string | null
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: "pending" | "accepted" | "rejected"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status: "pending" | "accepted" | "rejected"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: "pending" | "accepted" | "rejected"
          created_at?: string
          updated_at?: string
        }
      }
      calls: {
        Row: {
          id: string
          caller_id: string
          receiver_id: string
          start_time: string
          end_time: string | null
          status: "missed" | "answered" | "rejected" | "ongoing"
          call_type: "audio" | "video"
        }
        Insert: {
          id?: string
          caller_id: string
          receiver_id: string
          start_time?: string
          end_time?: string | null
          status: "missed" | "answered" | "rejected" | "ongoing"
          call_type: "audio" | "video"
        }
        Update: {
          id?: string
          caller_id?: string
          receiver_id?: string
          start_time?: string
          end_time?: string | null
          status?: "missed" | "answered" | "rejected" | "ongoing"
          call_type?: "audio" | "video"
        }
      }
      user_security: {
        Row: {
          user_id: string
          two_factor_enabled: boolean
          two_factor_secret: string | null
          encryption_enabled: boolean
          public_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          encryption_enabled?: boolean
          public_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          encryption_enabled?: boolean
          public_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          device_info: string
          ip_address: string
          location: string | null
          created_at: string
          last_active: string
        }
        Insert: {
          id?: string
          user_id: string
          device_info: string
          ip_address: string
          location?: string | null
          created_at?: string
          last_active?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_info?: string
          ip_address?: string
          location?: string | null
          created_at?: string
          last_active?: string
        }
      }
    }
  }
}
