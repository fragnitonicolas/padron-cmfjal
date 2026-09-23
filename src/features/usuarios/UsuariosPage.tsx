import { useEffect, useState } from 'react'
import {
  cambiarRolUsuario,
  crearUsuario,
  listarUsuarios,
  reenviarInvitacion,
  setActivoUsuario,
  type UsuarioConEmail,
} from '@/features/usuarios/data'
import { useAuth } from '@/lib/auth'
import { Boton } from '@/components/ui/Boton'
import { CampoSelect, CampoTexto } from '@/components/ui/Campo'
import { Alerta, Spinner, Tarjeta } from '@/components/ui/Basicos'
import { validarEmail } from '@/lib/validaciones'
import type { Enums } from '@/types/database.types'

export function UsuariosPage() {
  const { perfil } = useAuth()
  const [usuarios, setUsuarios] = useState<UsuarioConEmail[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<Enums<'rol_usuario'>>('lector')
  const [creando, setCreando] = useState(false)

  async function recargar() {
    setCargando(true)
    try {
      setUsuarios(await listarUsuarios())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    recargar()
  }, [])

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMensaje(null)
    if (!validarEmail(email) || nombre.trim().length < 2) {
      setError('Completá un email válido y un nombre completo.')
      return
    }
    setCreando(true)
    try {
      await crearUsuario(email.trim(), nombre.trim(), rol)
      setMensaje(`Se envió una invitación a ${email}.`)
      setEmail('')
      setNombre('')
      setRol('lector')
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el usuario')
    } finally {
      setCreando(false)
    }
  }

  async function cambiarRol(u: UsuarioConEmail, nuevoRol: Enums<'rol_usuario'>) {
    setError(null)
    try {
      await cambiarRolUsuario(u.id, nuevoRol)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el rol')
    }
  }

  async function alternarActivo(u: UsuarioConEmail) {
    setError(null)
    try {
      await setActivoUsuario(u.id, !u.activo)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el usuario')
    }
  }

  async function reenviar(u: UsuarioConEmail) {
    if (!u.email) return
    setError(null)
    setMensaje(null)
    try {
      await reenviarInvitacion(u.email)
      setMensaje(`Invitación reenviada a ${u.email}.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo reenviar la invitación')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-institucional text-2xl font-semibold text-brand-900">Usuarios del sistema</h1>
        <p className="text-sm text-brand-500">
          No hay alta pública: los usuarios se crean acá y reciben un correo para definir su contraseña.
        </p>
      </div>

      <Tarjeta>
        <h2 className="mb-4 font-institucional text-base text-brand-800">Invitar nuevo usuario</h2>
        <form onSubmit={crear} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[220px]">
            <CampoTexto etiqueta="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="min-w-[220px]">
            <CampoTexto etiqueta="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <CampoSelect etiqueta="Rol" value={rol} onChange={(e) => setRol(e.target.value as Enums<'rol_usuario'>)}>
            <option value="lector">Solo lectura</option>
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </CampoSelect>
          <Boton type="submit" cargando={creando}>
            Enviar invitación
          </Boton>
        </form>
      </Tarjeta>

      {error && <Alerta tipo="error">{error}</Alerta>}
      {mensaje && <Alerta tipo="exito">{mensaje}</Alerta>}

      <Tarjeta className="overflow-x-auto p-0">
        {cargando ? (
          <Spinner />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-200 bg-brand-50 text-xs uppercase tracking-wide text-brand-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-brand-800">{u.nombre_completo}</td>
                  <td className="px-4 py-3 text-brand-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.rol}
                      onChange={(e) => cambiarRol(u, e.target.value as Enums<'rol_usuario'>)}
                      disabled={u.id === perfil?.id}
                      className="rounded-md border border-brand-200 px-2 py-1 text-sm"
                    >
                      <option value="lector">Solo lectura</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.activo ? (
                      <span className="text-emerald-700">Activo</span>
                    ) : (
                      <span className="text-zinc-500">Desactivado</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Boton variante="secundario" onClick={() => reenviar(u)} className="text-xs">
                        Reenviar invitación
                      </Boton>
                      {u.id !== perfil?.id && (
                        <Boton variante={u.activo ? 'peligro' : 'primario'} onClick={() => alternarActivo(u)} className="text-xs">
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </Boton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Tarjeta>
    </div>
  )
}
