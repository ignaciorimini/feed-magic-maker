export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      content_entries: {
        Row: {
          created_at: string
          created_date: string
          description: string | null
          id: string
          topic: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_date?: string
          description?: string | null
          id?: string
          topic: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_date?: string
          description?: string | null
          id?: string
          topic?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_platforms: {
        Row: {
          content_entry_id: string
          content_type: string | null
          created_at: string | null
          generated_at: string | null
          id: string
          image_url: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          publish_date: string | null
          published_at: string | null
          published_url: string | null
          scheduled_at: string | null
          slides_url: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          text: string | null
          updated_at: string | null
        }
        Insert: {
          content_entry_id: string
          content_type?: string | null
          created_at?: string | null
          generated_at?: string | null
          id?: string
          image_url?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          publish_date?: string | null
          published_at?: string | null
          published_url?: string | null
          scheduled_at?: string | null
          slides_url?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          text?: string | null
          updated_at?: string | null
        }
        Update: {
          content_entry_id?: string
          content_type?: string | null
          created_at?: string | null
          generated_at?: string | null
          id?: string
          image_url?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          publish_date?: string | null
          published_at?: string | null
          published_url?: string | null
          scheduled_at?: string | null
          slides_url?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_platforms_content_entry_id_fkey"
            columns: ["content_entry_id"]
            isOneToOne: false
            referencedRelation: "content_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_guides: {
        Row: {
          created_at: string
          description: string | null
          id: string
          service: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          service: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          service?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          brand_guidelines: Json | null
          created_at: string
          email: string | null
          id: string
          posting_guidelines: Json | null
          selected_platforms: Json | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          brand_guidelines?: Json | null
          created_at?: string
          email?: string | null
          id: string
          posting_guidelines?: Json | null
          selected_platforms?: Json | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          brand_guidelines?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          posting_guidelines?: Json | null
          selected_platforms?: Json | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      slide_images: {
        Row: {
          content_platform_id: string
          created_at: string | null
          id: string
          image_url: string
          position: number
        }
        Insert: {
          content_platform_id: string
          created_at?: string | null
          id?: string
          image_url: string
          position?: number
        }
        Update: {
          content_platform_id?: string
          created_at?: string | null
          id?: string
          image_url?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "slide_images_content_platform_id_fkey"
            columns: ["content_platform_id"]
            isOneToOne: false
            referencedRelation: "content_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_images: {
        Row: {
          content_platform_id: string
          id: string
          image_url: string
          uploaded_at: string | null
        }
        Insert: {
          content_platform_id: string
          id?: string
          image_url: string
          uploaded_at?: string | null
        }
        Update: {
          content_platform_id?: string
          id?: string
          image_url?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_images_content_platform_id_fkey"
            columns: ["content_platform_id"]
            isOneToOne: false
            referencedRelation: "content_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credentials: {
        Row: {
          access_token: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string
          credential_type: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          service: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          credential_type: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          service: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          credential_type?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          service?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wordpress_posts: {
        Row: {
          content: string
          content_platform_id: string
          created_at: string
          description: string | null
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          content_platform_id: string
          created_at?: string
          description?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_platform_id?: string
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wordpress_posts_content_platform_id_fkey"
            columns: ["content_platform_id"]
            isOneToOne: false
            referencedRelation: "content_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_status:
        | "pending"
        | "generated"
        | "edited"
        | "scheduled"
        | "published"
      platform_type: "instagram" | "linkedin" | "twitter" | "wordpress"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_status: [
        "pending",
        "generated",
        "edited",
        "scheduled",
        "published",
      ],
      platform_type: ["instagram", "linkedin", "twitter", "wordpress"],
    },
  },
} as const
