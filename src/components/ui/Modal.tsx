import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ titulo, onCerrar, children, ancho = 'max-w-lg' }: { titulo: string; onCerrar: () => void; children: ReactNode; ancho?: string }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCerrar])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className={`w-full ${ancho} rounded-lg bg-white p-6 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-institucional text-lg text-brand-900">{titulo}</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-md p-1 text-brand-500 hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
