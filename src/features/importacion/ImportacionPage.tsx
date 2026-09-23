import { useMemo, useState, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { leerExcelPadron, type FilaExcelOrigen } from '@/features/importacion/excelParser'
import {
  aplicarImportacion,
  cargarAfiliadosExistentes,
  cargarCatalogosImportacion,
  construirPreview,
  type ItemPreview,
  type ResultadoAplicacion,
} from '@/features/importacion/proceso'
import { normalizarTexto } from '@/lib/validaciones'
import { Boton } from '@/components/ui/Boton'
import { Alerta, Spinner, Tarjeta } from '@/components/ui/Basicos'

const ETIQUETA_ACCION: Record<ItemPreview['accion'], string> = {
  nuevo: 'Alta nueva',
  actualizar: 'Actualización',
  sin_cambios: 'Sin cambios',
  rechazado: 'Rechazado',
}

const COLOR_ACCION: Record<ItemPreview['accion'], string> = {
  nuevo: 'bg-emerald-100 text-emerald-800',
  actualizar: 'bg-amber-100 text-amber-800',
  sin_cambios: 'bg-zinc-100 text-zinc-600',
  rechazado: 'bg-red-100 text-red-800',
}

const NUEVO = '__nuevo__'

export function ImportacionPage() {
  const { session, perfil } = useAuth()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [filasOrigen, setFilasOrigen] = useState<FilaExcelOrigen[]>([])
  const [items, setItems] = useState<ItemPreview[]>([])
  const [organismosDisponibles, setOrganismosDisponibles] = useState<{ id: string; nombre: string }[]>([])
  const [cargosDisponibles, setCargosDisponibles] = useState<{ id: string; nombre: string }[]>([])
  const [resolucionOrg, setResolucionOrg] = useState<Record<number, string>>({})
  const [resolucionCargo, setResolucionCargo] = useState<Record<number, string>>({})
  const [cargando, setCargando] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoAplicacion | null>(null)

  const resumen = useMemo(() => {
    const conteo = { nuevo: 0, actualizar: 0, sin_cambios: 0, rechazado: 0 }
    for (const i of items) conteo[i.accion]++
    return conteo
  }, [items])

  async function alSeleccionarArchivo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivo(file)
    setResultado(null)
    setError(null)
    setCargando(true)
    try {
      const filas = await leerExcelPadron(file)
      const [catalogos, existentes] = await Promise.all([cargarCatalogosImportacion(), cargarAfiliadosExistentes()])
      setOrganismosDisponibles(catalogos.organismos)
      setCargosDisponibles(catalogos.cargos)
      setFilasOrigen(filas)
      setItems(construirPreview(filas, catalogos, existentes))
      setResolucionOrg({})
      setResolucionCargo({})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el archivo')
    } finally {
      setCargando(false)
    }
  }

  async function confirmarImportacion() {
    if (!session || !perfil || !archivo) return
    setAplicando(true)
    setError(null)
    try {
      const itemsResueltos = await Promise.all(
        items.map(async (item) => {
          let organismoId = item.organismoId
          const eleccionOrg = resolucionOrg[item.filaExcel]
          if (!organismoId && eleccionOrg) {
            if (eleccionOrg === NUEVO && item.organismoTextoOriginal.trim()) {
              organismoId = await crearOrganismoNuevo(item.organismoTextoOriginal.trim())
            } else if (eleccionOrg !== NUEVO) {
              organismoId = eleccionOrg
              await vincularAlias('organismo_alias', 'organismo_id', organismoId, item.organismoTextoOriginal)
            }
          }
          let cargoId = item.cargoId
          const eleccionCargo = resolucionCargo[item.filaExcel]
          if (!cargoId && eleccionCargo) {
            if (eleccionCargo === NUEVO && item.cargoTextoOriginal.trim()) {
              cargoId = await crearCargoNuevo(item.cargoTextoOriginal.trim())
            } else if (eleccionCargo !== NUEVO) {
              cargoId = eleccionCargo
              await vincularAlias('cargo_alias', 'cargo_id', cargoId, item.cargoTextoOriginal)
            }
          }
          const cambiosActualizados = { ...item.cambios }
          if (organismoId && organismoId !== item.organismoId) cambiosActualizados.organismo_id = organismoId
          if (cargoId && cargoId !== item.cargoId) cambiosActualizados.cargo_id = cargoId
          return { ...item, organismoId, cargoId, cambios: cambiosActualizados }
        }),
      )

      const res = await aplicarImportacion(archivo.name, itemsResueltos, perfil.id)
      setResultado(res)
      setItems([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error al aplicar la importación')
    } finally {
      setAplicando(false)
    }
  }

  async function crearOrganismoNuevo(nombre: string) {
    const { data, error } = await supabase.from('organismos').insert({ nombre }).select('id').single()
    if (error) throw error
    await supabase.from('organismo_alias').insert({ organismo_id: data.id, alias_texto: normalizarTexto(nombre) })
    setOrganismosDisponibles((prev) => [...prev, { id: data.id, nombre }])
    return data.id as string
  }

  async function crearCargoNuevo(nombre: string) {
    const { data, error } = await supabase.from('cargos').insert({ nombre }).select('id').single()
    if (error) throw error
    await supabase.from('cargo_alias').insert({ cargo_id: data.id, alias_texto: normalizarTexto(nombre) })
    setCargosDisponibles((prev) => [...prev, { id: data.id, nombre }])
    return data.id as string
  }

  async function vincularAlias(tabla: 'organismo_alias' | 'cargo_alias', columna: 'organismo_id' | 'cargo_id', id: string, aliasOriginal: string) {
    if (!aliasOriginal.trim()) return
    await supabase.from(tabla).insert({ [columna]: id, alias_texto: normalizarTexto(aliasOriginal) } as never)
  }

  const filasPendientesDeMapeo = items.filter(
    (i) =>
      i.accion !== 'rechazado' &&
      ((i.organismoTextoOriginal.trim() && !i.organismoId && !resolucionOrg[i.filaExcel]) ||
        (i.cargoTextoOriginal.trim() && !i.cargoId && !resolucionCargo[i.filaExcel])),
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-institucional text-2xl font-semibold text-brand-900">Importación de padrón desde Excel</h1>
        <p className="text-sm text-brand-500">
          Sirve tanto para la carga inicial como para actualizaciones incrementales futuras. Se muestra una vista
          previa con el resultado esperado fila por fila antes de aplicar cualquier cambio.
        </p>
      </div>

      <Tarjeta>
        <input
          type="file"
          accept=".xlsx"
          onChange={alSeleccionarArchivo}
          className="block text-sm text-brand-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
        />
        <p className="mt-2 text-xs text-brand-400">
          Columnas esperadas en la primera fila: NRO, DNI, LEGAJO, APELLIDO Y NOMBRE, ORGANISMO, CARGO.
        </p>
      </Tarjeta>

      {cargando && <Spinner />}
      {error && <Alerta tipo="error">{error}</Alerta>}

      {resultado && (
        <Alerta tipo="exito">
          Importación completada: {resultado.insertados} altas, {resultado.actualizados} actualizaciones,{' '}
          {resultado.duplicadosOmitidos} sin cambios, {resultado.rechazados} rechazadas.
        </Alerta>
      )}

      {items.length > 0 && (
        <>
          <Tarjeta className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-semibold text-emerald-700">{resumen.nuevo}</p>
              <p className="text-xs text-brand-500">Altas nuevas</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-amber-700">{resumen.actualizar}</p>
              <p className="text-xs text-brand-500">Actualizaciones</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-500">{resumen.sin_cambios}</p>
              <p className="text-xs text-brand-500">Sin cambios</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-700">{resumen.rechazado}</p>
              <p className="text-xs text-brand-500">Rechazadas</p>
            </div>
          </Tarjeta>

          {filasPendientesDeMapeo > 0 && (
            <Alerta tipo="advertencia">
              {filasPendientesDeMapeo} fila(s) tienen un organismo o cargo que no se reconoce automáticamente. Elegí
              a qué organismo/cargo del catálogo corresponden, o creá uno nuevo, antes de confirmar.
            </Alerta>
          )}

          <Tarjeta className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-200 bg-brand-50 text-xs uppercase tracking-wide text-brand-500">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Apellido y nombre</th>
                  <th className="px-3 py-2">DNI</th>
                  <th className="px-3 py-2">Organismo</th>
                  <th className="px-3 py-2">Cargo</th>
                  <th className="px-3 py-2">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {items.map((item) => (
                  <tr key={item.filaExcel}>
                    <td className="px-3 py-2 text-brand-400">{item.filaExcel}</td>
                    <td className="px-3 py-2 text-brand-800">
                      {item.apellido}, {item.nombres}
                      {item.dniInvalido && <span className="ml-2 text-xs text-red-600">DNI inválido, se omite</span>}
                    </td>
                    <td className="px-3 py-2 text-brand-600">{item.dni ?? '—'}</td>
                    <td className="px-3 py-2">
                      {item.organismoId || !item.organismoTextoOriginal.trim() ? (
                        <span className="text-brand-600">{item.organismoTextoOriginal || '—'}</span>
                      ) : (
                        <select
                          className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs"
                          value={resolucionOrg[item.filaExcel] ?? ''}
                          onChange={(e) => setResolucionOrg((prev) => ({ ...prev, [item.filaExcel]: e.target.value }))}
                        >
                          <option value="">"{item.organismoTextoOriginal}" — elegir...</option>
                          <option value={NUEVO}>Crear organismo nuevo</option>
                          {organismosDisponibles.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.nombre}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.cargoId || !item.cargoTextoOriginal.trim() ? (
                        <span className="text-brand-600">{item.cargoTexto ?? (item.cargoTextoOriginal || '—')}</span>
                      ) : (
                        <select
                          className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs"
                          value={resolucionCargo[item.filaExcel] ?? ''}
                          onChange={(e) => setResolucionCargo((prev) => ({ ...prev, [item.filaExcel]: e.target.value }))}
                        >
                          <option value="">"{item.cargoTextoOriginal}" — elegir...</option>
                          <option value={NUEVO}>Crear cargo nuevo</option>
                          {cargosDisponibles.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_ACCION[item.accion]}`}>
                        {ETIQUETA_ACCION[item.accion]}
                      </span>
                      {item.motivoRechazo && <p className="mt-0.5 text-xs text-red-500">{item.motivoRechazo}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tarjeta>

          <div className="flex justify-end">
            <Boton onClick={confirmarImportacion} cargando={aplicando}>
              Confirmar e importar {filasOrigen.length} filas
            </Boton>
          </div>
        </>
      )}
    </div>
  )
}
