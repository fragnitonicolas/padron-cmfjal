import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './index.css'

const root = createRoot(document.getElementById('root')!)

function renderErrorFatal(mensaje: string) {
  root.render(
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
        <h1 className="mb-2 font-institucional text-lg font-semibold text-red-800">
          No se pudo iniciar la aplicación
        </h1>
        <p className="text-sm text-brand-600">{mensaje}</p>
        <p className="mt-3 text-xs text-brand-400">
          Verificá que las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configuradas
          (en Netlify: Site settings → Environment variables) y que el sitio se haya vuelto a desplegar después
          de agregarlas.
        </p>
      </div>
    </div>,
  )
}

// Import dinámico: si algún módulo falla al cargarse (p. ej. src/lib/supabase.ts
// lanza una excepción por faltar variables de entorno), el error ocurre en
// tiempo de evaluación del módulo, antes de que exista un árbol de React — un
// <ErrorBoundary> normal no lo captura. Este try/catch sí.
async function iniciar() {
  try {
    const [{ BrowserRouter }, { AuthProvider }, { default: App }] = await Promise.all([
      import('react-router-dom'),
      import('@/lib/auth'),
      import('./App'),
    ])
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </StrictMode>,
    )
  } catch (error) {
    renderErrorFatal(error instanceof Error ? error.message : 'Error desconocido al iniciar la aplicación.')
  }
}

iniciar()
