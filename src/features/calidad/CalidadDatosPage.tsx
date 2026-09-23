import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarTodosParaExportar, type AfiliadoConRelaciones } from '@/features/padron/data'
import { nombresSimilares, normalizarTexto } from '@/lib/validaciones'
import { Alerta, Spinner, Tarjeta } from '@/components/ui/Basicos'

interface ParDuplicado {
  a: AfiliadoConRelaciones
  b: AfiliadoConRelaciones
  motivo: string
}

function detectarDuplicados(afiliados: AfiliadoConRelaciones[]): ParDuplicado[] {
  const pares: ParDuplicado[] = []
  for (let i = 0; i < afiliados.length; i++) {
    for (let j = i + 1; j < afiliados.length; j++) {
      const a = afiliados[i]
      const b = afiliados[j]
      if (a.dni && b.dni && normalizarTexto(a.dni) === normalizarTexto(b.dni)) {
        pares.push({ a, b, motivo: 'Mismo DNI' })
        continue
      }
      const nombreA = `${a.apellido} ${a.nombres ?? ''}`.trim()
      const nombreB = `${b.apellido} ${b.nombres ?? ''}`.trim()
      if (nombresSimilares(nombreA, nombreB)) {
        pares.push({ a, b, motivo: 'Nombre muy similar' })
      }
    }
  }
  return pares
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-md border border-brand-100 px-4 py-3">
      <p className="text-2xl font-semibold text-brand-900">{valor}</p>
      <p className="text-xs text-brand-500">{etiqueta}</p>
    </div>
  )
}

export function CalidadDatosPage() {
  const [afiliados, setAfiliados] = useState<AfiliadoConRelaciones[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarTodosParaExportar({})
      .then(setAfiliados)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar la información'))
      .finally(() => setCargando(false))
  }, [])

  const duplicados = useMemo(() => detectarDuplicados(afiliados), [afiliados])

  const faltantes = useMemo(
    () => ({
      dni: afiliados.filter((a) => !a.dni).length,
      email: afiliados.filter((a) => !a.email).length,
      telefono: afiliados.filter((a) => !a.telefono).length,
      organismo: afiliados.filter((a) => !a.organismo_id).length,
      cargo: afiliados.filter((a) => !a.cargo_id).length,
      categoria: afiliados.filter((a) => !a.categoria).length,
      fechaNacimiento: afiliados.filter((a) => !a.fecha_nacimiento).length,
    }),
    [afiliados],
  )

  if (cargando) return <Spinner />
  if (error) return <Alerta tipo="error">{error}</Alerta>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-institucional text-2xl font-semibold text-brand-900">Calidad de datos</h1>
        <p className="text-sm text-brand-500">
          Detección automática de posibles duplicados y campos incompletos sobre {afiliados.length} registros.
        </p>
      </div>

      <Alerta tipo="info">
        Gran parte de estos campos no estaban presentes en el Excel de origen (solo incluía NRO, DNI, LEGAJO, APELLIDO Y
        NOMBRE, ORGANISMO y CARGO). Completalos progresivamente desde la ficha de cada afiliado.
      </Alerta>

      <Tarjeta>
        <h2 className="mb-4 font-institucional text-base text-brand-800">Campos incompletos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metrica etiqueta="Sin DNI" valor={faltantes.dni} />
          <Metrica etiqueta="Sin email" valor={faltantes.email} />
          <Metrica etiqueta="Sin teléfono" valor={faltantes.telefono} />
          <Metrica etiqueta="Sin organismo" valor={faltantes.organismo} />
          <Metrica etiqueta="Sin cargo" valor={faltantes.cargo} />
          <Metrica etiqueta="Sin categoría" valor={faltantes.categoria} />
          <Metrica etiqueta="Sin fecha de nacimiento" valor={faltantes.fechaNacimiento} />
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-4 font-institucional text-base text-brand-800">
          Posibles duplicados ({duplicados.length})
        </h2>
        {duplicados.length === 0 ? (
          <p className="text-sm text-brand-400">No se detectaron posibles duplicados.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-brand-100">
            {duplicados.map((p, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <Link to={`/padron/${p.a.id}`} className="text-brand-800 hover:underline">
                    {p.a.apellido}, {p.a.nombres} {p.a.dni ? `(DNI ${p.a.dni})` : ''}
                  </Link>
                  <span className="text-brand-300">vs.</span>
                  <Link to={`/padron/${p.b.id}`} className="text-brand-800 hover:underline">
                    {p.b.apellido}, {p.b.nombres} {p.b.dni ? `(DNI ${p.b.dni})` : ''}
                  </Link>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  {p.motivo}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  )
}
