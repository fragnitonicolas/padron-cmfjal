import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Alerta, EstadoVacio, Spinner, Tarjeta } from '@/components/ui/Basicos'
import { CampoSelect, CampoTexto } from '@/components/ui/Campo'
import { Boton } from '@/components/ui/Boton'
import type { Tables } from '@/types/database.types'

type FilaAuditoria = Tables<'auditoria'>

const POR_PAGINA = 30

export function AuditoriaPage() {
  const [filas, setFilas] = useState<FilaAuditoria[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagina, setPagina] = useState(0)
  const [tabla, setTabla] = useState('')
  const [busquedaEmail, setBusquedaEmail] = useState('')

  useEffect(() => {
    setPagina(0)
  }, [tabla, busquedaEmail])

  useEffect(() => {
    let vigente = true
    setCargando(true)
    let query = supabase.from('auditoria').select('*', { count: 'exact' }).order('creado_en', { ascending: false })
    if (tabla) query = query.eq('tabla', tabla)
    if (busquedaEmail.trim()) query = query.ilike('usuario_email', `%${busquedaEmail.trim()}%`)
    query = query.range(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA - 1)

    Promise.resolve(query)
      .then(({ data, error, count }) => {
        if (!vigente) return
        if (error) {
          setError(error.message)
          return
        }
        setFilas(data ?? [])
        setTotal(count ?? 0)
      })
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [tabla, busquedaEmail, pagina])

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-institucional text-2xl font-semibold text-brand-900">Auditoría</h1>
        <p className="text-sm text-brand-500">
          Registro inmutable de todas las altas y modificaciones del sistema ({total} eventos).
        </p>
      </div>

      <Tarjeta className="flex flex-wrap items-end gap-4">
        <CampoSelect etiqueta="Tabla" value={tabla} onChange={(e) => setTabla(e.target.value)}>
          <option value="">Todas</option>
          <option value="afiliados">Afiliados</option>
          <option value="profiles">Usuarios</option>
        </CampoSelect>
        <div className="min-w-[220px]">
          <CampoTexto etiqueta="Email del usuario" value={busquedaEmail} onChange={(e) => setBusquedaEmail(e.target.value)} />
        </div>
      </Tarjeta>

      {error && <Alerta tipo="error">{error}</Alerta>}

      <Tarjeta className="overflow-x-auto p-0">
        {cargando ? (
          <Spinner />
        ) : filas.length === 0 ? (
          <EstadoVacio titulo="Sin eventos" descripcion="No hay registros de auditoría para los filtros seleccionados." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-200 bg-brand-50 text-xs uppercase tracking-wide text-brand-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Tabla</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {filas.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3 text-brand-600">{new Date(f.creado_en).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-brand-600">{f.usuario_email ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-600">{f.tabla}</td>
                  <td className="px-4 py-3 text-brand-600">{f.accion === 'INSERT' ? 'Alta' : 'Modificación'}</td>
                  <td className="px-4 py-3 text-brand-600">{f.motivo ?? '—'}</td>
                  <td className="px-4 py-3">
                    {f.tabla === 'afiliados' ? (
                      <Link to={`/padron/${f.registro_id}`} className="text-brand-700 hover:underline">
                        Ver ficha
                      </Link>
                    ) : (
                      <span className="text-brand-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Tarjeta>

      {!cargando && filas.length > 0 && (
        <div className="flex items-center justify-between text-sm text-brand-600">
          <span>
            Página {pagina + 1} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <Boton variante="secundario" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
              Anterior
            </Boton>
            <Boton variante="secundario" disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
              Siguiente
            </Boton>
          </div>
        </div>
      )}
    </div>
  )
}
