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
      action_logs: {
        Row: {
          action_type: string
          agent_name: string
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          payload: Json | null
          result_status: string
          source_event_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          agent_name: string
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          result_status?: string
          source_event_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          agent_name?: string
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          result_status?: string
          source_event_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_logs_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_logs: {
        Row: {
          action_type: string
          agent_type: string
          confidence_score: number | null
          created_at: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          output_data: Json | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          agent_type: string
          confidence_score?: number | null
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          agent_type?: string
          confidence_score?: number | null
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          data: Json | null
          description: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          severity: string | null
          tenant_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          severity?: string | null
          tenant_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          severity?: string | null
          tenant_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          briefing_type: string
          content: Json
          converted_to_tasks: boolean | null
          generated_at: string | null
          id: string
          read_at: string | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          briefing_type: string
          content?: Json
          converted_to_tasks?: boolean | null
          generated_at?: string | null
          id?: string
          read_at?: string | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          briefing_type?: string
          content?: Json
          converted_to_tasks?: boolean | null
          generated_at?: string | null
          id?: string
          read_at?: string | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      business_rules: {
        Row: {
          conditions: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          learned_from: string | null
          name: string
          priority: number | null
          rule_type: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          learned_from?: string | null
          name: string
          priority?: number | null
          rule_type: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          learned_from?: string | null
          name?: string
          priority?: number | null
          rule_type?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      command_logs: {
        Row: {
          command: string
          created_at: string
          id: string
          result: string | null
          success: boolean | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          command: string
          created_at?: string
          id?: string
          result?: string | null
          success?: boolean | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          command?: string
          created_at?: string
          id?: string
          result?: string | null
          success?: boolean | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "command_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_type: string
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          parent_id: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_type?: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          parent_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_type?: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          parent_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company_accounts: {
        Row: {
          account_type: string | null
          company_id: string | null
          created_at: string
          description: string | null
          has_tax: boolean | null
          id: string
          name: string
          sort_order: number | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          account_type?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          has_tax?: boolean | null
          id?: string
          name: string
          sort_order?: number | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          account_type?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          has_tax?: boolean | null
          id?: string
          name?: string
          sort_order?: number | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company_clients: {
        Row: {
          address: string | null
          company_id: string | null
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company_employees: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          role: string | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company_providers: {
        Row: {
          address: string | null
          category: string | null
          company_id: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          company_id?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          category?: string | null
          company_id?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_providers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_providers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string
          file_type: string | null
          file_url: string | null
          id: string
          name: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          name: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          name?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_categories: {
        Row: {
          company_id: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_links: {
        Row: {
          category_id: string | null
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          priority: string | null
          tenant_id: string | null
          url: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          priority?: string | null
          tenant_id?: string | null
          url: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          priority?: string | null
          tenant_id?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          external_id: string | null
          id: string
          payload: Json | null
          processed_at: string | null
          source: string | null
          status: string | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          external_id?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          source?: string | null
          status?: string | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          external_id?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          source?: string | null
          status?: string | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number | null
          tenant_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number | null
          tenant_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          tenant_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount: number
          category_id: string | null
          company_id: string | null
          created_at: string
          id: string
          month: number
          notes: string | null
          source_id: string | null
          tenant_id: string | null
          user_id: string
          year: number
        }
        Insert: {
          amount?: number
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          source_id?: string | null
          tenant_id?: string | null
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          source_id?: string | null
          tenant_id?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "financial_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_sources: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number | null
          tax_percentage: number | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          tax_percentage?: number | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          tax_percentage?: number | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      income_types: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          company_id: string
          config: Json | null
          created_at: string
          credentials: Json | null
          id: string
          integration_type: string
          last_sync_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          config?: Json | null
          created_at?: string
          credentials?: Json | null
          id?: string
          integration_type: string
          last_sync_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          config?: Json | null
          created_at?: string
          credentials?: Json | null
          id?: string
          integration_type?: string
          last_sync_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      master_operations: {
        Row: {
          amount: number
          auto_classified: boolean | null
          category: string | null
          classification_reason: Json | null
          company_id: string | null
          confidence_score: number | null
          counterparty: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          operation_type: string
          status: string | null
          tenant_id: string | null
          transaction_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          auto_classified?: boolean | null
          category?: string | null
          classification_reason?: Json | null
          company_id?: string | null
          confidence_score?: number | null
          counterparty?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          operation_type: string
          status?: string | null
          tenant_id?: string | null
          transaction_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          auto_classified?: boolean | null
          category?: string | null
          classification_reason?: Json | null
          company_id?: string | null
          confidence_score?: number | null
          counterparty?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          operation_type?: string
          status?: string | null
          tenant_id?: string | null
          transaction_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_operations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_operations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_sources: {
        Row: {
          created_at: string | null
          external_id: string | null
          id: string
          master_operation_id: string | null
          match_confidence: number | null
          match_type: string | null
          raw_data: Json | null
          source_type: string
        }
        Insert: {
          created_at?: string | null
          external_id?: string | null
          id?: string
          master_operation_id?: string | null
          match_confidence?: number | null
          match_type?: string | null
          raw_data?: Json | null
          source_type: string
        }
        Update: {
          created_at?: string | null
          external_id?: string | null
          id?: string
          master_operation_id?: string | null
          match_confidence?: number | null
          match_type?: string | null
          raw_data?: Json | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_sources_master_operation_id_fkey"
            columns: ["master_operation_id"]
            isOneToOne: false
            referencedRelation: "master_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action_level: string
          action_type: string
          company_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_level?: string
          action_type: string
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_level?: string
          action_type?: string
          company_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_threshold: number | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          notification_preferences: Json | null
          role_in_company: string | null
          updated_at: string
        }
        Insert: {
          approval_threshold?: number | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          notification_preferences?: Json | null
          role_in_company?: string | null
          updated_at?: string
        }
        Update: {
          approval_threshold?: number | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          notification_preferences?: Json | null
          role_in_company?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          tenant_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          tenant_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          tenant_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          automation_paused: boolean | null
          autonomy_level: string | null
          average_ticket: number | null
          business_profile: Json | null
          business_type: string | null
          cost_centers: Json | null
          created_at: string
          custom_domain: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          monthly_capacity: number | null
          name: string
          onboarding_completed: boolean | null
          owner_email: string | null
          owner_name: string | null
          phone: string | null
          primary_color: string | null
          slug: string
          target_margin: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          automation_paused?: boolean | null
          autonomy_level?: string | null
          average_ticket?: number | null
          business_profile?: Json | null
          business_type?: string | null
          cost_centers?: Json | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          monthly_capacity?: number | null
          name: string
          onboarding_completed?: boolean | null
          owner_email?: string | null
          owner_name?: string | null
          phone?: string | null
          primary_color?: string | null
          slug: string
          target_margin?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          automation_paused?: boolean | null
          autonomy_level?: string | null
          average_ticket?: number | null
          business_profile?: Json | null
          business_type?: string | null
          cost_centers?: Json | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          monthly_capacity?: number | null
          name?: string
          onboarding_completed?: boolean | null
          owner_email?: string | null
          owner_name?: string | null
          phone?: string | null
          primary_color?: string | null
          slug?: string
          target_margin?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tenants: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: { Args: never; Returns: string }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id?: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_admin: { Args: { _tenant_id: string }; Returns: boolean }
      user_belongs_to_tenant: { Args: { _tenant_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
