import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listarAfiliados,
  listarTodosParaExportar,
  listarOrganismos,
  type AfiliadoConRelaciones,
  type FiltrosPadron,
} from '@/features/padron/data'
import { exportarCSV, exportarExcel } from '@/lib/exportar'
import { useDebounce } from '@/lib/hooks'
import { usePuedeEditar } from '@/lib/auth'
import { Boton } from '@/components/ui/Boton'
import { CampoSelect, CampoTexto } from '@/components/ui/Campo'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { Alerta, EstadoVacio, Spinner, Tarjeta } from '@/components/ui/Basicos'
import type { Enums, Tables } from '@/types/database.types'

type Columna = { clave: keyof AfiliadoConRelaciones | 'organismo' | 'cargo'; etiqueta: string; ordenable: boolean }

const COLUMNAS: Columna[] = [
  { clave: 'apellido', etiqueta: 'Apellido y nombre', ordenable: true },
  { clave: 'dni', etiqueta: 'DNI', ordenable: true },
  { clave: 'cargo', etiqueta: 'Cargo', ordenable: false },
  { clave: 'organismo', etiqueta: 'Organismo', ordenable: false },
  { clave: 'categoria', etiqueta: 'Categoría', ordenable: true },
  { clave: 'fecha_alta', etiqueta: 'Fecha de alta', ordenable: true },
  { clave: 'estado', etiqueta: 'Estado', ordenable: true },
]

const POR_PAGINA = 25

export function PadronPage() {
  const puedeEditar = usePuedeEditar()
  const [busquedaInput, setBusquedaInput] = useState('')
  const busqueda = useDebounce(busquedaInput, 350)
  const [estado, setEstado] = useState<Enums<'estado_afiliado'> | ''>('')
  const [categoria, setCategoria] = useState<Enums<'categoria_afiliado'> | ''>('')
  const [organismoId, setOrganismoId] = useState('')
  const [fuero, setFuero] = useState('')
  const [ordenarPor, setOrdenarPor] = useState<FiltrosPadron['ordenarPor']>('apellido')
  const [ordenAscendente, setOrdenAscendente] = useState(true)
  const [pagina, setPagina] = useState(0)

  const [datos, setDatos] = useState<AfiliadoConRelaciones[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)

  const [organismos, setOrganismos] = useState<Tables<'organismos'>[]>([])

  useEffect(() => {
    listarOrganismos().then(setOrganismos).catch(() => {})
  }, [])

  const fueros = useMemo(() => Array.from(new Set(organismos.map((o) => o.fuero).filter(Boolean))) as string[], [organismos])

  useEffect(() => {
    setPagina(0)
  }, [busqueda, estado, categoria, organismoId, fuero])

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)
    listarAfiliados({ busqueda, estado, categoria, organismoId, fuero, ordenarPor, ordenAscendente, pagina, porPagina: POR_PAGINA })
      .then(({ datos, total }) => {
        if (!vigente) return
        setDatos(datos)
        setTotal(total)
      })
      .catch((e) => vigente && setError(e instanceof Error ? e.message : 'Error al cargar el padrón'))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [busqueda, estado, categoria, organismoId, fuero, ordenarPor, ordenAscendente, pagina])

  function cambiarOrden(columna: Columna) {
    if (!columna.ordenable) return
    if (ordenarPor === columna.clave) {
      setOrdenAscendente((a) => !a)
    } else {
      setOrdenarPor(columna.clave)
      setOrdenAscendente(true)
    }
  }

  async function exportar(formato: 'csv' | 'excel') {
    setExportando(true)
    try {
      const todos = await listarTodosParaExportar({ busqueda, estado, categoria, organismoId, fuero, ordenarPor, ordenAscendente })
      const nombre = `padron-cmfjal-${new Date().toISOString().slice(0, 10)}`
      if (formato === 'csv') exportarCSV(todos, `${nombre}.csv`)
      else await exportarExcel(todos, `${nombre}.xlsx`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar')
    } finally {
      setExportando(false)
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-institucional text-2xl font-semibold text-brand-900">Padrón de Afiliados</h1>
          <p className="text-sm text-brand-500">{total} afiliado{total === 1 ? '' : 's'} encontrados</p>
        </div>
        <div className="flex gap-2">
          <Boton variante="secundario" onClick={() => exportar('csv')} cargando={exportando}>
            Exportar CSV
          </Boton>
          <Boton variante="secundario" onClick={() => exportar('excel')} cargando={exportando}>
            Exportar Excel
          </Boton>
          {puedeEditar && (
            <Link to="/padron/nuevo">
              <Boton>Nuevo afiliado</Boton>
            </Link>
          )}
        </div>
      </div>

      <Tarjeta className="flex flex-wrap items-end gap-4">
        <div className="min-w-[220px] flex-1">
          <CampoTexto
            etiqueta="Buscar"
            placeholder="Apellido, nombre o DNI..."
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
          />
        </div>
        <CampoSelect etiqueta="Estado" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}>
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="licencia">Licencia</option>
          <option value="baja">Baja</option>
          <option value="fallecido">Fallecido</option>
        </CampoSelect>
        <CampoSelect etiqueta="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value as typeof categoria)}>
          <option value="">Todas</option>
          <option value="magistrado">Magistrado</option>
          <option value="funcionario">Funcionario</option>
          <option value="jubilado">Jubilado</option>
          <option value="otra">Otra</option>
        </CampoSelect>
        <CampoSelect etiqueta="Fuero" value={fuero} onChange={(e) => setFuero(e.target.value)}>
          <option value="">Todos</option>
          {fueros.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </CampoSelect>
        <CampoSelect etiqueta="Organismo" value={organismoId} onChange={(e) => setOrganismoId(e.target.value)}>
          <option value="">Todos</option>
          {organismos.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </CampoSelect>
      </Tarjeta>

      {error && <Alerta tipo="error">{error}</Alerta>}

      <Tarjeta className="overflow-x-auto p-0">
        {cargando ? (
          <Spinner />
        ) : datos.length === 0 ? (
          <EstadoVacio titulo="No se encontraron afiliados" descripcion="Probá ajustar los filtros de búsqueda." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-200 bg-brand-50 text-xs uppercase tracking-wide text-brand-500">
              <tr>
                {COLUMNAS.map((col) => (
                  <th
                    key={col.clave}
                    onClick={() => cambiarOrden(col)}
                    className={`px-4 py-3 font-semibold ${col.ordenable ? 'cursor-pointer select-none hover:text-brand-800' : ''}`}
                    aria-sort={ordenarPor === col.clave ? (ordenAscendente ? 'ascending' : 'descending') : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.etiqueta}
                      {col.ordenable && ordenarPor === col.clave && <span>{ordenAscendente ? '▲' : '▼'}</span>}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {datos.map((a) => (
                <tr key={a.id} className="hover:bg-brand-50/60">
                  <td className="px-4 py-3">
                    <Link to={`/padron/${a.id}`} className="font-medium text-brand-800 hover:underline">
                      {a.apellido}
                      {a.nombres ? `, ${a.nombres}` : ''}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-brand-600">{a.dni ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-600">{a.cargo_texto ?? a.cargo?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-600">{a.organismo?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-600">{a.categoria ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-600">{a.fecha_alta ?? '—'}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={a.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Tarjeta>

      {!cargando && datos.length > 0 && (
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
