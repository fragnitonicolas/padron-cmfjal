import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import { RestablecerContrasenaPage } from '@/features/auth/RestablecerContrasenaPage'
import { Spinner } from '@/components/ui/Basicos'

const PadronPage = lazy(() => import('@/features/padron/PadronPage').then((m) => ({ default: m.PadronPage })))
const AltaAfiliadoPage = lazy(() => import('@/features/padron/AltaAfiliadoPage').then((m) => ({ default: m.AltaAfiliadoPage })))
const EditarAfiliadoPage = lazy(() => import('@/features/padron/EditarAfiliadoPage').then((m) => ({ default: m.EditarAfiliadoPage })))
const FichaAfiliadoPage = lazy(() => import('@/features/padron/FichaAfiliadoPage').then((m) => ({ default: m.FichaAfiliadoPage })))
const ImportacionPage = lazy(() => import('@/features/importacion/ImportacionPage').then((m) => ({ default: m.ImportacionPage })))
const UsuariosPage = lazy(() => import('@/features/usuarios/UsuariosPage').then((m) => ({ default: m.UsuariosPage })))
const EstadisticasPage = lazy(() => import('@/features/dashboard/EstadisticasPage').then((m) => ({ default: m.EstadisticasPage })))
const AuditoriaPage = lazy(() => import('@/features/auditoria/AuditoriaPage').then((m) => ({ default: m.AuditoriaPage })))
const CalidadDatosPage = lazy(() => import('@/features/calidad/CalidadDatosPage').then((m) => ({ default: m.CalidadDatosPage })))

export default function App() {
  return (
    <Suspense fallback={<Spinner className="min-h-screen" />}>
      <Routes>
        <Route path="/ingresar" element={<LoginPage />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContrasenaPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/padron" replace />} />
          <Route path="/padron" element={<PadronPage />} />
          <Route path="/padron/:id" element={<FichaAfiliadoPage />} />
          <Route
            path="/padron/nuevo"
            element={
              <ProtectedRoute rolesPermitidos={['admin', 'editor']}>
                <AltaAfiliadoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/padron/:id/editar"
            element={
              <ProtectedRoute rolesPermitidos={['admin', 'editor']}>
                <EditarAfiliadoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/importacion"
            element={
              <ProtectedRoute rolesPermitidos={['admin', 'editor']}>
                <ImportacionPage />
              </ProtectedRoute>
            }
          />
          <Route path="/estadisticas" element={<EstadisticasPage />} />
          <Route
            path="/calidad-de-datos"
            element={
              <ProtectedRoute rolesPermitidos={['admin', 'editor']}>
                <CalidadDatosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auditoria"
            element={
              <ProtectedRoute rolesPermitidos={['admin', 'editor']}>
                <AuditoriaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute rolesPermitidos={['admin']}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/padron" replace />} />
      </Routes>
    </Suspense>
  )
}
