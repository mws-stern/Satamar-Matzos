 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          apt: string | null
          city: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          first_name_hebrew: string | null
          house_number: string | null
          id: string
          last_name: string | null
          last_name_hebrew: string | null
          mobile: string | null
          name: string
          name_hebrew: string | null
          notes: string | null
          phone: string | null
          state: string | null
          street: string | null
          title_english: string | null
          title_hebrew: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          apt?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          first_name_hebrew?: string | null
          house_number?: string | null
          id?: string
          last_name?: string | null
          last_name_hebrew?: string | null
          mobile?: string | null
          name: string
          name_hebrew?: string | null
          notes?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          title_english?: string | null
          title_hebrew?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          apt?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          first_name_hebrew?: string | null
          house_number?: string | null
          id?: string
          last_name?: string | null
          last_name_hebrew?: string | null
          mobile?: string | null
          name?: string
          name_hebrew?: string | null
          notes?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          title_english?: string | null
          title_hebrew?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string | null
          email_type: string
          error_message: string | null
          id: string
          order_id: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_entries: {
        Row: {
          amount: number | null
          created_at: string | null
          date: string | null
          id: string
          notes: string | null
          product_id: string | null
          product_name: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          due_date: string | null
          id: string
          invoice_number: string
          order_id: string | null
          paid: boolean | null
          paid_at: string | null
          payment_status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          order_id?: string | null
          paid?: boolean | null
          paid_at?: string | null
          payment_status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          order_id?: string | null
          paid?: boolean | null
          paid_at?: string | null
          payment_status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          discount: number | null
          discount_type: string | null
          final_price: number | null
          id: string
          order_id: string | null
          price_per_lb: number | null
          product_id: string | null
          product_name: string | null
          product_name_hebrew: string | null
          quantity: number | null
          total_price: number | null
        }
        Insert: {
          discount?: number | null
          discount_type?: string | null
          final_price?: number | null
          id?: string
          order_id?: string | null
          price_per_lb?: number | null
          product_id?: string | null
          product_name?: string | null
          product_name_hebrew?: string | null
          quantity?: number | null
          total_price?: number | null
        }
        Update: {
          discount?: number | null
          discount_type?: string | null
          final_price?: number | null
          id?: string
          order_id?: string | null
          price_per_lb?: number | null
          product_id?: string | null
          product_name?: string | null
          product_name_hebrew?: string | null
          quantity?: number | null
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          delivery_date: string | null
          discount: number | null
          discount_type: string | null
          id: string
          inventory_deducted: boolean | null
          notes: string | null
          order_number: string
          order_time: string | null
          payment_status: string | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          delivery_date?: string | null
          discount?: number | null
          discount_type?: string | null
          id?: string
          inventory_deducted?: boolean | null
          notes?: string | null
          order_number: string
          order_time?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          delivery_date?: string | null
          discount?: number | null
          discount_type?: string | null
          id?: string
          inventory_deducted?: boolean | null
          notes?: string | null
          order_number?: string
          order_time?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          confirmed: boolean | null
          confirmed_at: string | null
          created_at: string | null
          credit_card_details: Json | null
          credit_card_last4: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          order_id: string | null
          payment_date: string | null
          payment_method: string | null
        }
        Insert: {
          amount: number
          confirmed?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          credit_card_details?: Json | null
          credit_card_last4?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
        }
        Update: {
          amount?: number
          confirmed?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          credit_card_details?: Json | null
          credit_card_last4?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          due_date: string
          notes: string | null
          completed: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          due_date: string
          notes?: string | null
          completed?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          due_date?: string
          notes?: string | null
          completed?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          current_inventory: number | null
          description: string | null
          id: string
          in_stock: boolean | null
          min_order: number | null
          name: string
          name_hebrew: string | null
          price_per_lb: number | null
          sell_by_half_lb: boolean | null
          price_per_half_lb: number | null
        }
        Insert: {
          category?: string | null
          current_inventory?: number | null
          description?: string | null
          id?: string
          in_stock?: boolean | null
          min_order?: number | null
          name: string
          name_hebrew?: string | null
          price_per_lb?: number | null
          sell_by_half_lb?: boolean | null
          price_per_half_lb?: number | null
        }
        Update: {
          category?: string | null
          current_inventory?: number | null
          description?: string | null
          id?: string
          in_stock?: boolean | null
          min_order?: number | null
          name?: string
          name_hebrew?: string | null
          price_per_lb?: number | null
          sell_by_half_lb?: boolean | null
          price_per_half_lb?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string | null
          company_name: string | null
          company_name_hebrew: string | null
          currency: string | null
          email: string | null
          id: string
          phone: string | null
          tax_rate: number | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          company_name_hebrew?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          tax_rate?: number | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          company_name_hebrew?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          tax_rate?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
