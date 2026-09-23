import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface WrapperProps {
  etiqueta: string
  error?: string
  requerido?: boolean
  ayuda?: string
  children: ReactNode
  htmlFor?: string
}

function CampoWrapper({ etiqueta, error, requerido, ayuda, children, htmlFor }: WrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-brand-800">
        {etiqueta}
        {requerido && <span className="text-red-700"> *</span>}
      </label>
      {children}
      {ayuda && !error && <p className="text-xs text-brand-500">{ayuda}</p>}
      {error && (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const claseInput =
  'rounded-md border border-brand-300 bg-white px-3 py-2 text-sm text-brand-950 placeholder:text-brand-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-brand-50 disabled:text-brand-400'

interface CampoTextoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string
  error?: string
  requerido?: boolean
  ayuda?: string
}

export function CampoTexto({ etiqueta, error, requerido, ayuda, id, className, ...props }: CampoTextoProps) {
  const inputId = id ?? `campo-${etiqueta.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <CampoWrapper etiqueta={etiqueta} error={error} requerido={requerido} ayuda={ayuda} htmlFor={inputId}>
      <input
        id={inputId}
        className={clsx(claseInput, error && 'border-red-500 focus:border-red-500 focus:ring-red-500', className)}
        aria-invalid={!!error}
        {...props}
      />
    </CampoWrapper>
  )
}

interface CampoSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string
  error?: string
  requerido?: boolean
  ayuda?: string
  children: ReactNode
}

export function CampoSelect({ etiqueta, error, requerido, ayuda, id, className, children, ...props }: CampoSelectProps) {
  const selectId = id ?? `campo-${etiqueta.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <CampoWrapper etiqueta={etiqueta} error={error} requerido={requerido} ayuda={ayuda} htmlFor={selectId}>
      <select
        id={selectId}
        className={clsx(claseInput, error && 'border-red-500', className)}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
    </CampoWrapper>
  )
}

interface CampoTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta: string
  error?: string
  requerido?: boolean
  ayuda?: string
}

export function CampoTextarea({ etiqueta, error, requerido, ayuda, id, className, ...props }: CampoTextareaProps) {
  const areaId = id ?? `campo-${etiqueta.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <CampoWrapper etiqueta={etiqueta} error={error} requerido={requerido} ayuda={ayuda} htmlFor={areaId}>
      <textarea
        id={areaId}
        className={clsx(claseInput, error && 'border-red-500', className)}
        aria-invalid={!!error}
        {...props}
      />
    </CampoWrapper>
  )
}
