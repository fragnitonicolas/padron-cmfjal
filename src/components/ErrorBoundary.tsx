import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Evita una pantalla en blanco sin explicación ante errores de configuración o de render. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Error no controlado en la aplicación:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
          <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
            <h1 className="mb-2 font-institucional text-lg font-semibold text-red-800">
              No se pudo iniciar la aplicación
            </h1>
            <p className="text-sm text-brand-600">{this.state.error.message}</p>
            <p className="mt-3 text-xs text-brand-400">
              Si esto ocurre en producción, verificá que las variables de entorno VITE_SUPABASE_URL y
              VITE_SUPABASE_ANON_KEY estén configuradas en Netlify y que el sitio se haya vuelto a desplegar
              después de agregarlas.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
