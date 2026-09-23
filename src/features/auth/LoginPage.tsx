import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { resolverEmailDeUsuario } from '@/lib/validaciones'
import { Boton } from '@/components/ui/Boton'
import { CampoTexto } from '@/components/ui/Campo'
import { Alerta } from '@/components/ui/Basicos'
import logo from '@/assets/logo.jpg'

export function LoginPage() {
  const { session, cargando } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modoRecuperar, setModoRecuperar] = useState(false)
  const [mensajeRecuperar, setMensajeRecuperar] = useState<string | null>(null)

  if (!cargando && session) return <Navigate to="/padron" replace />

  async function iniciarSesion(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: resolverEmailDeUsuario(email), password })
    if (error) {
      setError('Email o contraseña incorrectos.')
      setEnviando(false)
    }
  }

  async function enviarRecuperacion(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-contrasena`,
    })
    setEnviando(false)
    if (error) {
      setError('No se pudo enviar el correo de recuperación.')
    } else {
      setMensajeRecuperar('Si el email está registrado, vas a recibir un correo con instrucciones para definir tu contraseña.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-brand-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src={logo} alt="Escudo del Colegio de la Magistratura y la Función Judicial" className="h-20 w-20 object-contain" />
          <div>
            <h1 className="font-institucional text-lg font-semibold text-brand-900">
              Colegio de la Magistratura y la Función Judicial
            </h1>
            <p className="text-xs text-brand-500">Avellaneda - Lanús · Padrón de Afiliados</p>
          </div>
        </div>

        {!modoRecuperar ? (
          <form onSubmit={iniciarSesion} className="flex flex-col gap-4">
            <CampoTexto
              etiqueta="Usuario o email"
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <CampoTexto
              etiqueta="Contraseña"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <Alerta tipo="error">{error}</Alerta>}
            <Boton type="submit" cargando={enviando} className="w-full">
              Ingresar
            </Boton>
            <button
              type="button"
              onClick={() => {
                setModoRecuperar(true)
                setError(null)
              }}
              className="text-center text-sm text-brand-600 underline-offset-2 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : (
          <form onSubmit={enviarRecuperacion} className="flex flex-col gap-4">
            <p className="text-sm text-brand-600">
              Ingresá tu email institucional y te enviaremos un enlace para definir tu contraseña.
            </p>
            <CampoTexto etiqueta="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            {error && <Alerta tipo="error">{error}</Alerta>}
            {mensajeRecuperar && <Alerta tipo="exito">{mensajeRecuperar}</Alerta>}
            <Boton type="submit" cargando={enviando} className="w-full">
              Enviar enlace
            </Boton>
            <button
              type="button"
              onClick={() => setModoRecuperar(false)}
              className="text-center text-sm text-brand-600 underline-offset-2 hover:underline"
            >
              Volver a ingresar
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-brand-400">
          El acceso es exclusivo para usuarios creados por un administrador del Colegio.
        </p>
      </div>
    </div>
  )
}
