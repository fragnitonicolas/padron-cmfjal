import { supabase } from '@/lib/supabase'
import type { Enums, Tables } from '@/types/database.types'

export interface UsuarioConEmail extends Tables<'profiles'> {
  email: string | null
}

async function invocar<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('admin-usuarios', { body })
  if (error) throw new Error(error.message)
  const conError = data as unknown as { error?: string }
  if (conError && typeof conError === 'object' && conError.error) throw new Error(conError.error)
  return data as T
}

export async function listarUsuarios(): Promise<UsuarioConEmail[]> {
  const { usuarios } = await invocar<{ usuarios: UsuarioConEmail[] }>({ accion: 'listar' })
  return usuarios
}

export async function crearUsuario(email: string, nombre_completo: string, rol: Enums<'rol_usuario'>) {
  return invocar<{ ok: true; user_id: string }>({ accion: 'crear', email, nombre_completo, rol })
}

export async function cambiarRolUsuario(user_id: string, rol: Enums<'rol_usuario'>) {
  return invocar<{ ok: true }>({ accion: 'cambiar_rol', user_id, rol })
}

export async function setActivoUsuario(user_id: string, activo: boolean) {
  return invocar<{ ok: true }>({ accion: 'set_activo', user_id, activo })
}

export async function reenviarInvitacion(email: string) {
  return invocar<{ ok: true }>({ accion: 'reenviar_invitacion', email })
}
