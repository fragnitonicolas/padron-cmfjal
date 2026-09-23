import type { Enums } from '@/types/database.types'

const ESTILOS: Record<Enums<'estado_afiliado'>, string> = {
  activo: 'bg-emerald-100 text-emerald-800',
  licencia: 'bg-amber-100 text-amber-800',
  baja: 'bg-zinc-200 text-zinc-700',
  fallecido: 'bg-zinc-300 text-zinc-800',
}

const ETIQUETAS: Record<Enums<'estado_afiliado'>, string> = {
  activo: 'Activo',
  licencia: 'Licencia',
  baja: 'Baja',
  fallecido: 'Fallecido',
}

export function EstadoBadge({ estado }: { estado: Enums<'estado_afiliado'> }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS[estado]}`}>
      {ETIQUETAS[estado]}
    </span>
  )
}

const ETIQUETAS_ROL: Record<Enums<'rol_usuario'>, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  lector: 'Solo lectura',
}

export function RolBadge({ rol }: { rol: Enums<'rol_usuario'> }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800">
      {ETIQUETAS_ROL[rol]}
    </span>
  )
}
