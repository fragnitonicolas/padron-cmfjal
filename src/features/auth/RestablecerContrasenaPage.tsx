import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Boton } from '@/components/ui/Boton'
import { CampoTexto } from '@/components/ui/Campo'
import { Alerta } from '@/components/ui/Basicos'
import logo from '@/assets/logo.jpg'

/**
 * Página a la que llega el enlace de recuperación de contraseña de Supabase
 * (o la primera invitación de un usuario nuevo). Supabase deja al usuario
 * autenticado temporalmente al abrir el enlace; acá solo pedimos la nueva
 * contraseña.
 */
export function RestablecerContrasenaPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado; solicitá uno nuevo.')
      return
    }
    navigate('/padron', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-brand-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src={logo} alt="Escudo del Colegio" className="h-16 w-16 object-contain" />
          <h1 className="font-institucional text-lg font-semibold text-brand-900">Definir contraseña</h1>
        </div>
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
          <Boton type="submit" cargando={enviando} className="w-full">
            Guardar contraseña
          </Boton>
        </form>
      </div>
    </div>
  )
}
