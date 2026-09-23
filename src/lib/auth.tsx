import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

type Perfil = Tables<'profiles'>

interface AuthContextValue {
  session: Session | null
  perfil: Perfil | null
  cargando: boolean
  cerrarSesion: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    async function cargarPerfil(userId: string) {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (activo) setPerfil(data)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return
      setSession(data.session)
      if (data.session) {
        cargarPerfil(data.session.user.id).finally(() => activo && setCargando(false))
      } else {
        setCargando(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, nuevaSession) => {
      setSession(nuevaSession)
      if (nuevaSession) {
        cargarPerfil(nuevaSession.user.id)
      } else {
        setPerfil(null)
      }
    })

    return () => {
      activo = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, perfil, cargando, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

export function usePuedeEditar(): boolean {
  const { perfil } = useAuth()
  return perfil?.rol === 'admin' || perfil?.rol === 'editor'
}

export function esAdmin(perfil: Perfil | null): boolean {
  return perfil?.rol === 'admin'
}
