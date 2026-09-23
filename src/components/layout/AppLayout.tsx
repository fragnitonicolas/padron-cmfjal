import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth, usePuedeEditar } from '@/lib/auth'
import { ModalCambiarPassword } from '@/features/auth/ModalCambiarPassword'
import logo from '@/assets/logo.jpg'

const enlaceClase = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-800 text-white' : 'text-brand-100 hover:bg-brand-800/60',
  )

export function AppLayout() {
  const { perfil, cerrarSesion } = useAuth()
  const puedeEditar = usePuedeEditar()
  const esAdmin = perfil?.rol === 'admin'
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false)

  return (
    <div className="flex min-h-screen bg-brand-50">
      <aside className="flex w-64 flex-shrink-0 flex-col bg-brand-900 no-imprimir">
        <div className="flex items-center gap-3 border-b border-brand-800 px-4 py-5">
          <img src={logo} alt="Escudo del Colegio" className="h-12 w-12 rounded-full bg-white object-contain p-1" />
          <div className="leading-tight">
            <p className="font-institucional text-sm font-semibold text-white">CMFJAL</p>
            <p className="text-[11px] text-brand-300">Padrón de Afiliados</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <NavLink to="/padron" className={enlaceClase}>
            Padrón
          </NavLink>
          {puedeEditar && (
            <NavLink to="/padron/nuevo" className={enlaceClase}>
              Alta de afiliado
            </NavLink>
          )}
          {puedeEditar && (
            <NavLink to="/importacion" className={enlaceClase}>
              Importación de Excel
            </NavLink>
          )}
          <NavLink to="/estadisticas" className={enlaceClase}>
            Estadísticas
          </NavLink>
          {puedeEditar && (
            <NavLink to="/electoral" className={enlaceClase}>
              Padrón electoral
            </NavLink>
          )}
          {puedeEditar && (
            <NavLink to="/calidad-de-datos" className={enlaceClase}>
              Calidad de datos
            </NavLink>
          )}
          {puedeEditar && (
            <NavLink to="/auditoria" className={enlaceClase}>
              Auditoría
            </NavLink>
          )}
          {esAdmin && (
            <NavLink to="/usuarios" className={enlaceClase}>
              Usuarios
            </NavLink>
          )}
        </nav>
        <div className="border-t border-brand-800 p-3">
          <p className="truncate px-2 text-xs text-brand-300">{perfil?.nombre_completo}</p>
          <button
            onClick={() => setModalPasswordAbierto(true)}
            className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-brand-100 hover:bg-brand-800/60"
          >
            Cambiar contraseña
          </button>
          <button
            onClick={cerrarSesion}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-brand-100 hover:bg-brand-800/60"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      {modalPasswordAbierto && <ModalCambiarPassword onCerrar={() => setModalPasswordAbierto(false)} />}
    </div>
  )
}
