import type { ReactNode } from 'react'
import clsx from 'clsx'

export function Tarjeta({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-lg border border-brand-200 bg-white p-5 shadow-sm', className)}>{children}</div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center justify-center py-10', className)}>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
    </div>
  )
}

export function EstadoVacio({ titulo, descripcion, accion }: { titulo: string; descripcion?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-brand-300 py-12 text-center">
      <p className="font-institucional text-lg text-brand-800">{titulo}</p>
      {descripcion && <p className="max-w-sm text-sm text-brand-500">{descripcion}</p>}
      {accion}
    </div>
  )
}

export function Alerta({ tipo = 'info', children }: { tipo?: 'info' | 'error' | 'exito' | 'advertencia'; children: ReactNode }) {
  const estilos = {
    info: 'bg-brand-50 text-brand-800 border-brand-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    exito: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    advertencia: 'bg-amber-50 text-amber-800 border-amber-200',
  }[tipo]
  return <div className={clsx('rounded-md border px-4 py-3 text-sm', estilos)} role="status">{children}</div>
}
