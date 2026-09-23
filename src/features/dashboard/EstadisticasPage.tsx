import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarTodosParaExportar, type AfiliadoConRelaciones } from '@/features/padron/data'
import { Alerta, Spinner, Tarjeta } from '@/components/ui/Basicos'
import { exportarCSV } from '@/lib/exportar'
import { Boton } from '@/components/ui/Boton'
import { usePuedeEditar } from '@/lib/auth'

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function contarPor<T extends string>(afiliados: AfiliadoConRelaciones[], obtenerClave: (a: AfiliadoConRelaciones) => T | null | undefined) {
  const conteo = new Map<string, number>()
  for (const a of afiliados) {
    const clave = obtenerClave(a) ?? 'Sin especificar'
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1)
  }
  return Array.from(conteo.entries()).sort((a, b) => b[1] - a[1])
}

function BarraConteo({ datos, total }: { datos: [string, number][]; total: number }) {
  return (
    <ul className="flex flex-col gap-2">
      {datos.map(([etiqueta, cantidad]) => (
        <li key={etiqueta} className="text-sm">
          <div className="mb-0.5 flex justify-between text-brand-700">
            <span className="capitalize">{etiqueta}</span>
            <span className="tabular-nums text-brand-500">{cantidad}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-brand-100">
            <div
              className="h-1.5 rounded-full bg-brand-600"
              style={{ width: `${total > 0 ? (cantidad / total) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function EstadisticasPage() {
  const puedeEditar = usePuedeEditar()
  const [afiliados, setAfiliados] = useState<AfiliadoConRelaciones[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarTodosParaExportar({})
      .then(setAfiliados)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron cargar las estadísticas'))
      .finally(() => setCargando(false))
  }, [])

  const activos = useMemo(() => afiliados.filter((a) => a.estado === 'activo'), [afiliados])

  const porEstado = useMemo(() => contarPor(afiliados, (a) => a.estado), [afiliados])
  const porCategoria = useMemo(() => contarPor(activos, (a) => a.categoria), [activos])
  const porFuero = useMemo(() => contarPor(activos, (a) => a.organismo?.fuero), [activos])
  const porOrganismo = useMemo(() => contarPor(activos, (a) => a.organismo?.nombre).slice(0, 10), [activos])

  const cumpleañosDelMes = useMemo(() => {
    const mesActual = new Date().getMonth()
    return activos
      .filter((a) => a.fecha_nacimiento && new Date(a.fecha_nacimiento + 'T00:00:00').getMonth() === mesActual)
      .sort(
        (a, b) =>
          new Date(a.fecha_nacimiento! + 'T00:00:00').getDate() - new Date(b.fecha_nacimiento! + 'T00:00:00').getDate(),
      )
  }, [activos])

  const conDatosDeContactoFaltantes = useMemo(
    () => activos.filter((a) => !a.email && !a.telefono).length,
    [activos],
  )

  if (cargando) return <Spinner />
  if (error) return <Alerta tipo="error">{error}</Alerta>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-institucional text-2xl font-semibold text-brand-900">Estadísticas del padrón</h1>
        <p className="text-sm text-brand-500">{afiliados.length} registros totales · {activos.length} activos</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Tarjeta>
          <h2 className="mb-3 font-institucional text-base text-brand-800">Por estado</h2>
          <BarraConteo datos={porEstado} total={afiliados.length} />
        </Tarjeta>
        <Tarjeta>
          <h2 className="mb-3 font-institucional text-base text-brand-800">Activos por categoría</h2>
          <BarraConteo datos={porCategoria} total={activos.length} />
        </Tarjeta>
        <Tarjeta>
          <h2 className="mb-3 font-institucional text-base text-brand-800">Activos por fuero</h2>
          <BarraConteo datos={porFuero} total={activos.length} />
        </Tarjeta>
        <Tarjeta className="md:col-span-2">
          <h2 className="mb-3 font-institucional text-base text-brand-800">Organismos con más afiliados activos</h2>
          <BarraConteo datos={porOrganismo} total={activos.length} />
        </Tarjeta>
        <Tarjeta>
          <h2 className="mb-3 font-institucional text-base text-brand-800">Calidad de datos de contacto</h2>
          <p className="text-sm text-brand-600">
            <strong className="text-2xl text-brand-900">{conDatosDeContactoFaltantes}</strong> afiliados activos sin
            email ni teléfono cargados.
          </p>
          {puedeEditar && (
            <Link to="/calidad-de-datos" className="mt-2 inline-block text-sm text-brand-600 underline-offset-2 hover:underline">
              Ver panel de calidad de datos →
            </Link>
          )}
        </Tarjeta>
      </div>

      <Tarjeta>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-institucional text-base text-brand-800">
            Cumpleaños de {MESES[new Date().getMonth()]}
          </h2>
          {cumpleañosDelMes.length > 0 && (
            <Boton
              variante="secundario"
              onClick={() => exportarCSV(cumpleañosDelMes, `cumpleanos-${MESES[new Date().getMonth()]}.csv`)}
            >
              Exportar lista
            </Boton>
          )}
        </div>
        {cumpleañosDelMes.length === 0 ? (
          <p className="text-sm text-brand-400">No hay fechas de nacimiento cargadas para afiliados activos este mes.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cumpleañosDelMes.map((a) => (
              <li key={a.id} className="flex justify-between rounded-md border border-brand-100 px-3 py-2 text-sm">
                <Link to={`/padron/${a.id}`} className="text-brand-800 hover:underline">
                  {a.apellido}, {a.nombres}
                </Link>
                <span className="text-brand-400">
                  {new Date(a.fecha_nacimiento! + 'T00:00:00').getDate()}/{new Date().getMonth() + 1}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  )
}
