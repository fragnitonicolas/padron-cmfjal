import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  cargando?: boolean
}

const estilos: Record<Variante, string> = {
  primario: 'bg-brand-800 text-white hover:bg-brand-700 disabled:bg-brand-300',
  secundario: 'bg-white text-brand-800 border border-brand-300 hover:bg-brand-50',
  peligro: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300',
  fantasma: 'bg-transparent text-brand-700 hover:bg-brand-100',
}

export const Boton = forwardRef<HTMLButtonElement, Props>(function Boton(
  { variante = 'primario', cargando, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || cargando}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed',
        estilos[variante],
        className,
      )}
      {...props}
    >
      {cargando && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
})
