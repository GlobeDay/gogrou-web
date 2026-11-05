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
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      gpc_class_definitions: {
        Row: {
          code: string
          created_at: string
          display_order: number | null
          id: string
          label_cs: string | null
          label_en: string | null
          level: number | null
          metadata: Json
          parent_code: string | null
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number | null
          id?: string
          label_cs?: string | null
          label_en?: string | null
          level?: number | null
          metadata?: Json
          parent_code?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number | null
          id?: string
          label_cs?: string | null
          label_en?: string | null
          level?: number | null
          metadata?: Json
          parent_code?: string | null
        }
        Relationships: []
      }
      gpc_class_params: {
        Row: {
          class_code: string
          display_order: number | null
          param_code: string
          required: boolean
          template_source: string | null
        }
        Insert: {
          class_code: string
          display_order?: number | null
          param_code: string
          required?: boolean
          template_source?: string | null
        }
        Update: {
          class_code?: string
          display_order?: number | null
          param_code?: string
          required?: boolean
          template_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gpc_class_params_class_code_fkey"
            columns: ["class_code"]
            isOneToOne: false
            referencedRelation: "gpc_class_definitions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "gpc_class_params_param_code_fkey"
            columns: ["param_code"]
            isOneToOne: false
            referencedRelation: "gpc_class_schema"
            referencedColumns: ["param_code"]
          },
          {
            foreignKeyName: "gpc_class_params_param_code_fkey"
            columns: ["param_code"]
            isOneToOne: false
            referencedRelation: "gpc_param_definitions"
            referencedColumns: ["param_code"]
          },
        ]
      }
      gpc_param_definitions: {
        Row: {
          created_at: string
          data_type: string | null
          description_cs: string | null
          description_en: string | null
          enum_values: string[] | null
          id: string
          label_cs: string | null
          label_en: string | null
          param_code: string
          section: string | null
          source: string | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          data_type?: string | null
          description_cs?: string | null
          description_en?: string | null
          enum_values?: string[] | null
          id?: string
          label_cs?: string | null
          label_en?: string | null
          param_code: string
          section?: string | null
          source?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          data_type?: string | null
          description_cs?: string | null
          description_en?: string | null
          enum_values?: string[] | null
          id?: string
          label_cs?: string | null
          label_en?: string | null
          param_code?: string
          section?: string | null
          source?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      gpc_products: {
        Row: {
          attachments: Json
          created_at: string
          external_refs: Json
          gid: string
          gtin: string | null
          id: string
          manufacturer: string | null
          match_key_type: string | null
          match_key_value: string | null
          name: string
          params: Json
          status: Database["public"]["Enums"]["entity_status"]
          type: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          created_at?: string
          external_refs?: Json
          gid: string
          gtin?: string | null
          id?: string
          manufacturer?: string | null
          match_key_type?: string | null
          match_key_value?: string | null
          name: string
          params?: Json
          status?: Database["public"]["Enums"]["entity_status"]
          type: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          created_at?: string
          external_refs?: Json
          gid?: string
          gtin?: string | null
          id?: string
          manufacturer?: string | null
          match_key_type?: string | null
          match_key_value?: string | null
          name?: string
          params?: Json
          status?: Database["public"]["Enums"]["entity_status"]
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      gss_gpc_validation_requests: {
        Row: {
          attachments: Json | null
          created_at: string
          created_by: string | null
          gpc_product_id: string | null
          id: string
          item_id: string
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          gpc_product_id?: string | null
          id?: string
          item_id: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          gpc_product_id?: string | null
          id?: string
          item_id?: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gss_gpc_validation_requests_gpc_product_id_fkey"
            columns: ["gpc_product_id"]
            isOneToOne: false
            referencedRelation: "gina_top_consumed"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "gss_gpc_validation_requests_gpc_product_id_fkey"
            columns: ["gpc_product_id"]
            isOneToOne: false
            referencedRelation: "gpc_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_gpc_validation_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_service_backlog"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_gpc_validation_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_top_consumed"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_gpc_validation_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gss_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_gpc_validation_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gss_item_external_ids: {
        Row: {
          active: boolean
          created_at: string
          id: string
          item_id: string
          source: string | null
          system: string
          tenant_id: string
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          item_id: string
          source?: string | null
          system: string
          tenant_id: string
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          item_id?: string
          source?: string | null
          system?: string
          tenant_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "gss_item_external_ids_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_service_backlog"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_item_external_ids_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_top_consumed"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_item_external_ids_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gss_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_item_external_ids_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gss_items: {
        Row: {
          created_at: string
          gpc_product_id: string | null
          id: string
          local_manufacturer: string | null
          local_name: string | null
          local_params: Json | null
          local_type: string | null
          max_qty: number | null
          min_qty: number | null
          notes: string | null
          pack_size: number | null
          qty_on_hand: number
          reorder_point: number | null
          status: Database["public"]["Enums"]["entity_status"]
          supplier_primary: string | null
          supplier_secondary: string | null
          tenant_id: string
          tracking_mode: Database["public"]["Enums"]["item_tracking_mode"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          gpc_product_id?: string | null
          id?: string
          local_manufacturer?: string | null
          local_name?: string | null
          local_params?: Json | null
          local_type?: string | null
          max_qty?: number | null
          min_qty?: number | null
          notes?: string | null
          pack_size?: number | null
          qty_on_hand?: number
          reorder_point?: number | null
          status?: Database["public"]["Enums"]["entity_status"]
          supplier_primary?: string | null
          supplier_secondary?: string | null
          tenant_id: string
          tracking_mode?: Database["public"]["Enums"]["item_tracking_mode"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          gpc_product_id?: string | null
          id?: string
          local_manufacturer?: string | null
          local_name?: string | null
          local_params?: Json | null
          local_type?: string | null
          max_qty?: number | null
          min_qty?: number | null
          notes?: string | null
          pack_size?: number | null
          qty_on_hand?: number
          reorder_point?: number | null
          status?: Database["public"]["Enums"]["entity_status"]
          supplier_primary?: string | null
          supplier_secondary?: string | null
          tenant_id?: string
          tracking_mode?: Database["public"]["Enums"]["item_tracking_mode"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gss_items_gpc_product_id_fkey"
            columns: ["gpc_product_id"]
            isOneToOne: false
            referencedRelation: "gina_top_consumed"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "gss_items_gpc_product_id_fkey"
            columns: ["gpc_product_id"]
            isOneToOne: false
            referencedRelation: "gpc_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gss_locations: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gss_locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "gss_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gss_movements: {
        Row: {
          created_by: string | null
          from_location_id: string | null
          id: string
          item_id: string | null
          movement: Database["public"]["Enums"]["movement_type"]
          occurred_at: string
          payload: Json
          piece_id: string | null
          quantity: number | null
          tenant_id: string
          to_location_id: string | null
        }
        Insert: {
          created_by?: string | null
          from_location_id?: string | null
          id?: string
          item_id?: string | null
          movement: Database["public"]["Enums"]["movement_type"]
          occurred_at?: string
          payload?: Json
          piece_id?: string | null
          quantity?: number | null
          tenant_id: string
          to_location_id?: string | null
        }
        Update: {
          created_by?: string | null
          from_location_id?: string | null
          id?: string
          item_id?: string | null
          movement?: Database["public"]["Enums"]["movement_type"]
          occurred_at?: string
          payload?: Json
          piece_id?: string | null
          quantity?: number | null
          tenant_id?: string
          to_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gss_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "gss_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_service_backlog"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_top_consumed"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gss_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_movements_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "gina_service_backlog"
            referencedColumns: ["piece_id"]
          },
          {
            foreignKeyName: "gss_movements_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "gss_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "gss_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      gss_order_lines: {
        Row: {
          created_at: string
          id: string
          item_id: string
          note: string | null
          order_id: string
          qty_ordered: number
          qty_received: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          note?: string | null
          order_id: string
          qty_ordered: number
          qty_received?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          note?: string | null
          order_id?: string
          qty_ordered?: number
          qty_received?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gss_order_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_service_backlog"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_order_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_top_consumed"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_order_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gss_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "gss_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_order_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gss_orders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          order_no: string
          status: Database["public"]["Enums"]["gss_order_status"]
          supplier: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_no: string
          status?: Database["public"]["Enums"]["gss_order_status"]
          supplier?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_no?: string
          status?: Database["public"]["Enums"]["gss_order_status"]
          supplier?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gss_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gss_piece_service_events: {
        Row: {
          created_at: string
          created_by: string | null
          cycle_no: number | null
          diameter_mm: number | null
          event_date: string | null
          id: string
          l1_mm: number | null
          l2_mm: number | null
          notes: string | null
          partner: string | null
          performer: string | null
          piece_id: string
          shipment_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cycle_no?: number | null
          diameter_mm?: number | null
          event_date?: string | null
          id?: string
          l1_mm?: number | null
          l2_mm?: number | null
          notes?: string | null
          partner?: string | null
          performer?: string | null
          piece_id: string
          shipment_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cycle_no?: number | null
          diameter_mm?: number | null
          event_date?: string | null
          id?: string
          l1_mm?: number | null
          l2_mm?: number | null
          notes?: string | null
          partner?: string | null
          performer?: string | null
          piece_id?: string
          shipment_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gss_piece_service_events_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "gina_service_backlog"
            referencedColumns: ["piece_id"]
          },
          {
            foreignKeyName: "gss_piece_service_events_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "gss_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_piece_service_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "gss_service_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_piece_service_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gss_pieces: {
        Row: {
          condition: Database["public"]["Enums"]["piece_condition"]
          created_at: string
          current_location_id: string | null
          dm_code: string
          id: string
          item_id: string
          lifecycle: Json
          qid: string | null
          status: Database["public"]["Enums"]["piece_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          condition?: Database["public"]["Enums"]["piece_condition"]
          created_at?: string
          current_location_id?: string | null
          dm_code: string
          id?: string
          item_id: string
          lifecycle?: Json
          qid?: string | null
          status?: Database["public"]["Enums"]["piece_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          condition?: Database["public"]["Enums"]["piece_condition"]
          created_at?: string
          current_location_id?: string | null
          dm_code?: string
          id?: string
          item_id?: string
          lifecycle?: Json
          qid?: string | null
          status?: Database["public"]["Enums"]["piece_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gss_pieces_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "gss_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_pieces_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_service_backlog"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_pieces_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_top_consumed"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_pieces_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gss_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_pieces_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gss_service_shipment_lines: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          note: string | null
          piece_id: string | null
          qty: number
          result: string | null
          shipment_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          note?: string | null
          piece_id?: string | null
          qty?: number
          result?: string | null
          shipment_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          note?: string | null
          piece_id?: string | null
          qty?: number
          result?: string | null
          shipment_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gss_service_shipment_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_service_backlog"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_service_shipment_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_top_consumed"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_service_shipment_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gss_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_service_shipment_lines_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "gina_service_backlog"
            referencedColumns: ["piece_id"]
          },
          {
            foreignKeyName: "gss_service_shipment_lines_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "gss_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_service_shipment_lines_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "gss_service_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_service_shipment_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gss_service_shipments: {
        Row: {
          created_at: string
          created_by: string | null
          customer: string | null
          direction: Database["public"]["Enums"]["shipment_direction"]
          id: string
          note: string | null
          number: string
          order_ref: string | null
          partner: string | null
          return_of: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer?: string | null
          direction?: Database["public"]["Enums"]["shipment_direction"]
          id?: string
          note?: string | null
          number: string
          order_ref?: string | null
          partner?: string | null
          return_of?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer?: string | null
          direction?: Database["public"]["Enums"]["shipment_direction"]
          id?: string
          note?: string | null
          number?: string
          order_ref?: string | null
          partner?: string | null
          return_of?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gss_service_shipments_return_of_fkey"
            columns: ["return_of"]
            isOneToOne: false
            referencedRelation: "gss_service_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_service_shipments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gss_tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          prefix: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          prefix: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          prefix?: string
        }
        Relationships: []
      }
      gss_user_tenants: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gss_user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      gina_lifecycle_summary: {
        Row: {
          at_max_cycles: number | null
          avg_cycles_done: number | null
          item_id: string | null
          near_max_cycles: number | null
          product_gid: string | null
          product_name: string | null
          tenant_id: string | null
          total_pieces: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gss_pieces_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_service_backlog"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_pieces_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gina_top_consumed"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "gss_pieces_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gss_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gss_pieces_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gina_movement_velocity: {
        Row: {
          cnt: number | null
          day: string | null
          movement: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gss_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gina_service_backlog: {
        Row: {
          cycles_done: number | null
          dm_code: string | null
          item_id: string | null
          location_code: string | null
          max_cycles: number | null
          piece_id: string | null
          product_gid: string | null
          product_name: string | null
          product_type: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gss_pieces_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gina_top_consumed: {
        Row: {
          consumed_count: number | null
          item_id: string | null
          last_consumed_at: string | null
          product_gid: string | null
          product_id: string | null
          product_name: string | null
          product_type: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gss_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "gss_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gpc_class_schema: {
        Row: {
          class_code: string | null
          class_label_cs: string | null
          class_label_en: string | null
          data_type: string | null
          display_order: number | null
          enum_values: string[] | null
          param_code: string | null
          param_label_cs: string | null
          param_label_en: string | null
          required: boolean | null
          section: string | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gpc_class_params_class_code_fkey"
            columns: ["class_code"]
            isOneToOne: false
            referencedRelation: "gpc_class_definitions"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Functions: {
      gpc_search: {
        Args: {
          p_filters?: Json
          p_limit?: number
          p_offset?: number
          p_sort?: Json
          p_status?: string
          p_text?: string
          p_type: string
        }
        Returns: {
          external_refs: Json
          gid: string
          id: string
          manufacturer: string
          name: string
          params: Json
          status: string
          total_count: number
          type: string
        }[]
      }
      gss_user_is_global_admin: { Args: never; Returns: boolean }
      gss_user_role_in: {
        Args: { p_tenant: string }
        Returns: Database["public"]["Enums"]["tenant_role"]
      }
      gss_user_tenant_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      entity_status: "active" | "phasing_out" | "discontinued"
      gss_order_status:
        | "draft"
        | "ordered"
        | "partially_received"
        | "received"
        | "cancelled"
      item_tracking_mode: "quantity" | "dm"
      movement_type:
        | "receive"
        | "issue"
        | "transfer"
        | "service_out"
        | "service_in"
        | "scrap"
        | "adjust"
      piece_condition: "new" | "resharpened_new" | "used"
      piece_status:
        | "new"
        | "in_stock"
        | "in_preset"
        | "in_machine"
        | "in_production"
        | "awaiting_decision"
        | "in_service"
        | "scrapped"
      shipment_direction: "to_service" | "return"
      tenant_role: "viewer" | "operator" | "supervisor" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      entity_status: ["active", "phasing_out", "discontinued"],
      gss_order_status: [
        "draft",
        "ordered",
        "partially_received",
        "received",
        "cancelled",
      ],
      item_tracking_mode: ["quantity", "dm"],
      movement_type: [
        "receive",
        "issue",
        "transfer",
        "service_out",
        "service_in",
        "scrap",
        "adjust",
      ],
      piece_condition: ["new", "resharpened_new", "used"],
      piece_status: [
        "new",
        "in_stock",
        "in_preset",
        "in_machine",
        "in_production",
        "awaiting_decision",
        "in_service",
        "scrapped",
      ],
      shipment_direction: ["to_service", "return"],
      tenant_role: ["viewer", "operator", "supervisor", "admin"],
    },
  },
} as const
