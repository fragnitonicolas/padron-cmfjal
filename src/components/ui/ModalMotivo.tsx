import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Boton } from '@/components/ui/Boton'
import { CampoTextarea } from '@/components/ui/Campo'

interface Props {
  titulo: string
  descripcion?: string
  etiquetaConfirmar?: string
  variantePeligro?: boolean
  onConfirmar: (motivo: string) => Promise<void> | void
  onCancelar: () => void
}

/** Modal genérico para pedir el motivo obligatorio de una modificación o baja. */
export function ModalMotivo({ titulo, descripcion, etiquetaConfirmar = 'Confirmar', variantePeligro, onConfirmar, onCancelar }: Props) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmar() {
    if (motivo.trim().length < 5) {
      setError('Ingresá un motivo de al menos 5 caracteres.')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      await onConfirmar(motivo.trim())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.')
      setEnviando(false)
    }
  }

  return (
    <Modal titulo={titulo} onCerrar={onCancelar}>
      <div className="flex flex-col gap-4">
        {descripcion && <p className="text-sm text-brand-600">{descripcion}</p>}
        <CampoTextarea
          etiqueta="Motivo del cambio"
          requerido
          rows={3}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          error={error ?? undefined}
          placeholder="Ej: corrección de domicilio informada por el afiliado"
        />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </Boton>
          <Boton variante={variantePeligro ? 'peligro' : 'primario'} onClick={confirmar} cargando={enviando}>
            {etiquetaConfirmar}
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
