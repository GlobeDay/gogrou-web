/**
 * Auto-generated from Supabase. Zahrnuje gpc_* definitions tables + gpc_class_schema view.
 * Regenerate: supabase gen types typescript --project-id wmvpcpkphhpyiiqsqvmh > database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      gpc_class_definitions: {
        Row: {
          code: string; created_at: string; display_order: number | null;
          id: string; label_cs: string | null; label_en: string | null;
          level: number | null; metadata: Json; parent_code: string | null;
        }
        Insert: {
          code: string; created_at?: string; display_order?: number | null;
          id?: string; label_cs?: string | null; label_en?: string | null;
          level?: number | null; metadata?: Json; parent_code?: string | null;
        }
        Update: Partial<Database["public"]["Tables"]["gpc_class_definitions"]["Insert"]>
        Relationships: []
      }
      gpc_class_params: {
        Row: {
          class_code: string; display_order: number | null;
          param_code: string; required: boolean; template_source: string | null;
        }
        Insert: {
          class_code: string; display_order?: number | null;
          param_code: string; required?: boolean; template_source?: string | null;
        }
        Update: Partial<Database["public"]["Tables"]["gpc_class_params"]["Insert"]>
        Relationships: []
      }
      gpc_param_definitions: {
        Row: {
          created_at: string; data_type: string | null;
          description_cs: string | null; description_en: string | null;
          enum_values: string[] | null; id: string;
          label_cs: string | null; label_en: string | null;
          param_code: string; section: string | null;
          source: string | null; unit: string | null;
        }
        Insert: {
          created_at?: string; data_type?: string | null;
          description_cs?: string | null; description_en?: string | null;
          enum_values?: string[] | null; id?: string;
          label_cs?: string | null; label_en?: string | null;
          param_code: string; section?: string | null;
          source?: string | null; unit?: string | null;
        }
        Update: Partial<Database["public"]["Tables"]["gpc_param_definitions"]["Insert"]>
        Relationships: []
      }
      gss_user_tenants: {
        Row: {
          user_id: string; tenant_id: string;
          role: "viewer" | "operator" | "supervisor" | "admin";
          created_at: string;
        }
        Insert: {
          user_id: string; tenant_id: string;
          role?: "viewer" | "operator" | "supervisor" | "admin";
          created_at?: string;
        }
        Update: Partial<Database["public"]["Tables"]["gss_user_tenants"]["Insert"]>
        Relationships: []
      }
      gpc_products: {
        Row: {
          attachments: Json; created_at: string; external_refs: Json;
          gid: string; gtin: string | null; id: string;
          manufacturer: string | null; match_key_type: string | null;
          match_key_value: string | null; name: string; params: Json;
          status: Database["public"]["Enums"]["entity_status"];
          type: string; updated_at: string;
        }
        Insert: {
          attachments?: Json; created_at?: string; external_refs?: Json;
          gid: string; gtin?: string | null; id?: string;
          manufacturer?: string | null; match_key_type?: string | null;
          match_key_value?: string | null; name: string; params?: Json;
          status?: Database["public"]["Enums"]["entity_status"];
          type: string; updated_at?: string;
        }
        Update: Partial<Database["public"]["Tables"]["gpc_products"]["Insert"]>
        Relationships: []
      }
      gss_items: {
        Row: {
          created_at: string; gpc_product_id: string; id: string;
          max_qty: number | null; min_qty: number | null;
          notes: string | null; reorder_point: number | null;
          status: Database["public"]["Enums"]["entity_status"];
          tenant_id: string; updated_at: string;
        }
        Insert: {
          created_at?: string; gpc_product_id: string; id?: string;
          max_qty?: number | null; min_qty?: number | null;
          notes?: string | null; reorder_point?: number | null;
          status?: Database["public"]["Enums"]["entity_status"];
          tenant_id: string; updated_at?: string;
        }
        Update: Partial<Database["public"]["Tables"]["gss_items"]["Insert"]>
        Relationships: []
      }
      gss_locations: {
        Row: {
          code: string; created_at: string; id: string;
          name: string; parent_id: string | null; tenant_id: string;
        }
        Insert: {
          code: string; created_at?: string; id?: string;
          name: string; parent_id?: string | null; tenant_id: string;
        }
        Update: Partial<Database["public"]["Tables"]["gss_locations"]["Insert"]>
        Relationships: []
      }
      gss_movements: {
        Row: {
          created_by: string | null; from_location_id: string | null;
          id: string; item_id: string | null;
          movement: Database["public"]["Enums"]["movement_type"];
          occurred_at: string; payload: Json; piece_id: string | null;
          quantity: number | null; tenant_id: string;
          to_location_id: string | null;
        }
        Insert: {
          created_by?: string | null; from_location_id?: string | null;
          id?: string; item_id?: string | null;
          movement: Database["public"]["Enums"]["movement_type"];
          occurred_at?: string; payload?: Json; piece_id?: string | null;
          quantity?: number | null; tenant_id: string;
          to_location_id?: string | null;
        }
        Update: Partial<Database["public"]["Tables"]["gss_movements"]["Insert"]>
        Relationships: []
      }
      gss_pieces: {
        Row: {
          created_at: string; current_location_id: string | null;
          dm_code: string; id: string; item_id: string;
          lifecycle: Json;
          status: Database["public"]["Enums"]["piece_status"];
          tenant_id: string; updated_at: string;
        }
        Insert: {
          created_at?: string; current_location_id?: string | null;
          dm_code: string; id?: string; item_id: string;
          lifecycle?: Json;
          status?: Database["public"]["Enums"]["piece_status"];
          tenant_id: string; updated_at?: string;
        }
        Update: Partial<Database["public"]["Tables"]["gss_pieces"]["Insert"]>
        Relationships: []
      }
      gss_tenants: {
        Row: { created_at: string; id: string; name: string; prefix: string; }
        Insert: { created_at?: string; id?: string; name: string; prefix: string; }
        Update: Partial<Database["public"]["Tables"]["gss_tenants"]["Insert"]>
        Relationships: []
      }
    }
    Views: {
      gpc_class_schema: {
        Row: {
          class_code: string | null;
          class_label_cs: string | null;
          class_label_en: string | null;
          data_type: string | null;
          display_order: number | null;
          enum_values: string[] | null;
          param_code: string | null;
          param_label_cs: string | null;
          param_label_en: string | null;
          required: boolean | null;
          section: string | null;
          unit: string | null;
        }
        Relationships: []
      }
    }
    Functions: {
      gpc_search: {
        Args: {
          p_filters?: Json; p_limit?: number; p_offset?: number;
          p_sort?: Json; p_status?: string; p_text?: string; p_type: string;
        }
        Returns: {
          external_refs: Json; gid: string; id: string;
          manufacturer: string; name: string; params: Json;
          status: string; total_count: number; type: string;
        }[]
      }
    }
    Enums: {
      entity_status: "active" | "phasing_out" | "discontinued"
      movement_type: "receive" | "issue" | "transfer" | "service_out" | "service_in" | "scrap" | "adjust"
      piece_status: "new" | "in_stock" | "in_preset" | "in_machine" | "in_production" | "in_service" | "scrapped"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
