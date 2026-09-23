import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Spinner } from '@/components/ui/Basicos'
import type { Enums } from '@/types/database.types'

export function ProtectedRoute({ children, rolesPermitidos }: { children: ReactNode; rolesPermitidos?: Enums<'rol_usuario'>[] }) {
  const { session, perfil, cargando } = useAuth()

  if (cargando) return <Spinner className="min-h-screen" />

  if (!session) return <Navigate to="/ingresar" replace />

  if (!perfil || !perfil.activo) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="max-w-sm text-brand-700">
          Tu usuario no tiene un perfil activo en el sistema. Contactá a un administrador del Colegio.
        </p>
      </div>
    )
  }

  if (rolesPermitidos && !rolesPermitidos.includes(perfil.rol)) {
    return <Navigate to="/padron" replace />
  }

  return <>{children}</>
}
