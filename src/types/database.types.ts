export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      afiliados: {
        Row: {
          apellido: string
          apellido_y_nombre_original: string
          cargo_id: string | null
          cargo_texto: string | null
          categoria: Database["public"]["Enums"]["categoria_afiliado"] | null
          created_at: string
          created_by: string | null
          cuil: string | null
          dni: string | null
          domicilio: string | null
          email: string | null
          estado: Database["public"]["Enums"]["estado_afiliado"]
          fecha_alta: string | null
          fecha_baja: string | null
          fecha_nacimiento: string | null
          id: string
          motivo_baja: string | null
          nombres: string | null
          nro_legajo: number | null
          observaciones: string | null
          organismo_id: string | null
          telefono: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          apellido: string
          apellido_y_nombre_original: string
          cargo_id?: string | null
          cargo_texto?: string | null
          categoria?: Database["public"]["Enums"]["categoria_afiliado"] | null
          created_at?: string
          created_by?: string | null
          cuil?: string | null
          dni?: string | null
          domicilio?: string | null
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_afiliado"]
          fecha_alta?: string | null
          fecha_baja?: string | null
          fecha_nacimiento?: string | null
          id?: string
          motivo_baja?: string | null
          nombres?: string | null
          nro_legajo?: number | null
          observaciones?: string | null
          organismo_id?: string | null
          telefono?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          apellido?: string
          apellido_y_nombre_original?: string
          cargo_id?: string | null
          cargo_texto?: string | null
          categoria?: Database["public"]["Enums"]["categoria_afiliado"] | null
          created_at?: string
          created_by?: string | null
          cuil?: string | null
          dni?: string | null
          domicilio?: string | null
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_afiliado"]
          fecha_alta?: string | null
          fecha_baja?: string | null
          fecha_nacimiento?: string | null
          id?: string
          motivo_baja?: string | null
          nombres?: string | null
          nro_legajo?: number | null
          observaciones?: string | null
          organismo_id?: string | null
          telefono?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "afiliados_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afiliados_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afiliados_organismo_id_fkey"
            columns: ["organismo_id"]
            isOneToOne: false
            referencedRelation: "organismos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afiliados_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          accion: Database["public"]["Enums"]["accion_auditoria"]
          creado_en: string
          id: number
          motivo: string | null
          registro_id: string
          tabla: string
          usuario_email: string | null
          usuario_id: string | null
          valores_anteriores: Json | null
          valores_nuevos: Json | null
        }
        Insert: {
          accion: Database["public"]["Enums"]["accion_auditoria"]
          creado_en?: string
          id?: never
          motivo?: string | null
          registro_id: string
          tabla: string
          usuario_email?: string | null
          usuario_id?: string | null
          valores_anteriores?: Json | null
          valores_nuevos?: Json | null
        }
        Update: {
          accion?: Database["public"]["Enums"]["accion_auditoria"]
          creado_en?: string
          id?: never
          motivo?: string | null
          registro_id?: string
          tabla?: string
          usuario_email?: string | null
          usuario_id?: string | null
          valores_anteriores?: Json | null
          valores_nuevos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_alias: {
        Row: {
          alias_texto: string
          cargo_id: string
          created_at: string
          id: string
        }
        Insert: {
          alias_texto: string
          cargo_id: string
          created_at?: string
          id?: string
        }
        Update: {
          alias_texto?: string
          cargo_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargo_alias_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          jerarquia_sugerida: string | null
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          jerarquia_sugerida?: string | null
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          jerarquia_sugerida?: string | null
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracion: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          clave: string
          descripcion: string | null
          valor: Json
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          clave: string
          descripcion?: string | null
          valor: Json
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          clave?: string
          descripcion?: string | null
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      importacion_filas: {
        Row: {
          afiliado_id: string | null
          created_at: string
          datos_originales: Json
          fila_excel: number
          id: string
          importacion_id: string
          motivo: string | null
          resultado: string
        }
        Insert: {
          afiliado_id?: string | null
          created_at?: string
          datos_originales: Json
          fila_excel: number
          id?: string
          importacion_id: string
          motivo?: string | null
          resultado: string
        }
        Update: {
          afiliado_id?: string | null
          created_at?: string
          datos_originales?: Json
          fila_excel?: number
          id?: string
          importacion_id?: string
          motivo?: string | null
          resultado?: string
        }
        Relationships: [
          {
            foreignKeyName: "importacion_filas_afiliado_id_fkey"
            columns: ["afiliado_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "importacion_filas_importacion_id_fkey"
            columns: ["importacion_id"]
            isOneToOne: false
            referencedRelation: "importaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      importaciones: {
        Row: {
          actualizados: number
          duplicados_omitidos: number
          estado: string
          fecha: string
          id: string
          insertados: number
          nombre_archivo: string
          rechazados: number
          resumen: Json | null
          total_filas: number
          usuario_id: string | null
        }
        Insert: {
          actualizados?: number
          duplicados_omitidos?: number
          estado?: string
          fecha?: string
          id?: string
          insertados?: number
          nombre_archivo: string
          rechazados?: number
          resumen?: Json | null
          total_filas?: number
          usuario_id?: string | null
        }
        Update: {
          actualizados?: number
          duplicados_omitidos?: number
          estado?: string
          fecha?: string
          id?: string
          insertados?: number
          nombre_archivo?: string
          rechazados?: number
          resumen?: Json | null
          total_filas?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "importaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organismo_alias: {
        Row: {
          alias_texto: string
          created_at: string
          id: string
          organismo_id: string
        }
        Insert: {
          alias_texto: string
          created_at?: string
          id?: string
          organismo_id: string
        }
        Update: {
          alias_texto?: string
          created_at?: string
          id?: string
          organismo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organismo_alias_organismo_id_fkey"
            columns: ["organismo_id"]
            isOneToOne: false
            referencedRelation: "organismos"
            referencedColumns: ["id"]
          },
        ]
      }
      organismos: {
        Row: {
          activo: boolean
          created_at: string
          fuero: string | null
          id: string
          localidad: string | null
          nombre: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          fuero?: string | null
          id?: string
          localidad?: string | null
          nombre: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          fuero?: string | null
          id?: string
          localidad?: string | null
          nombre?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre_completo: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id: string
          nombre_completo: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre_completo?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_afiliado: {
        Args: { p_cambios: Json; p_id: string; p_motivo: string }
        Returns: {
          apellido: string
          apellido_y_nombre_original: string
          cargo_id: string | null
          cargo_texto: string | null
          categoria: Database["public"]["Enums"]["categoria_afiliado"] | null
          created_at: string
          created_by: string | null
          cuil: string | null
          dni: string | null
          domicilio: string | null
          email: string | null
          estado: Database["public"]["Enums"]["estado_afiliado"]
          fecha_alta: string | null
          fecha_baja: string | null
          fecha_nacimiento: string | null
          id: string
          motivo_baja: string | null
          nombres: string | null
          nro_legajo: number | null
          observaciones: string | null
          organismo_id: string | null
          telefono: string | null
          updated_at: string
          updated_by: string | null
        }
      }
      es_admin: { Args: never; Returns: boolean }
      esta_autenticado_activo: { Args: never; Returns: boolean }
      mi_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      puede_editar: { Args: never; Returns: boolean }
    }
    Enums: {
      accion_auditoria: "INSERT" | "UPDATE"
      categoria_afiliado: "magistrado" | "funcionario" | "jubilado" | "otra"
      estado_afiliado: "activo" | "licencia" | "baja" | "fallecido"
      rol_usuario: "admin" | "editor" | "lector"
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
      accion_auditoria: ["INSERT", "UPDATE"],
      categoria_afiliado: ["magistrado", "funcionario", "jubilado", "otra"],
      estado_afiliado: ["activo", "licencia", "baja", "fallecido"],
      rol_usuario: ["admin", "editor", "lector"],
    },
  },
} as const
