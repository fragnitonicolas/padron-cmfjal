import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Boton } from '@/components/ui/Boton'
import { CampoTexto } from '@/components/ui/Campo'
import { Alerta } from '@/components/ui/Basicos'

export function ModalCambiarPassword({ onCerrar }: { onCerrar: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setEnviando(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setEnviando(false)
    if (error) {
      setError('No se pudo actualizar la contraseña.')
      return
    }
    setExito(true)
  }

  return (
    <Modal titulo="Cambiar mi contraseña" onCerrar={onCerrar}>
      {exito ? (
        <div className="flex flex-col gap-4">
          <Alerta tipo="exito">Contraseña actualizada correctamente.</Alerta>
          <Boton onClick={onCerrar}>Cerrar</Boton>
        </div>
      ) : (
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <CampoTexto
            etiqueta="Nueva contraseña"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            ayuda="Mínimo 8 caracteres."
          />
          <CampoTexto
            etiqueta="Confirmar contraseña"
            type="password"
            required
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
          />
          {error && <Alerta tipo="error">{error}</Alerta>}
          <div className="flex justify-end gap-2">
            <Boton type="button" variante="secundario" onClick={onCerrar}>
              Cancelar
            </Boton>
            <Boton type="submit" cargando={enviando}>
              Guardar
            </Boton>
          </div>
        </form>
      )}
    </Modal>
  )
}
