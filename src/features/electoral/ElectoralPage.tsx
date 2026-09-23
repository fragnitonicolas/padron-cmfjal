import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '@/lib/supabase'
import { listarTodosParaExportar, type AfiliadoConRelaciones } from '@/features/padron/data'
import { exportarCSV, exportarExcel } from '@/lib/exportar'
import { useAuth } from '@/lib/auth'
import { Alerta, Spinner, Tarjeta } from '@/components/ui/Basicos'
import { Boton } from '@/components/ui/Boton'
import type { Enums } from '@/types/database.types'

interface CriteriosElectorales {
  estados: Enums<'estado_afiliado'>[]
  categorias: Enums<'categoria_afiliado'>[]
}

const TODOS_ESTADOS: Enums<'estado_afiliado'>[] = ['activo', 'licencia', 'baja', 'fallecido']
const TODAS_CATEGORIAS: Enums<'categoria_afiliado'>[] = ['magistrado', 'funcionario', 'jubilado', 'otra']

export function ElectoralPage() {
  const { perfil } = useAuth()
  const esAdmin = perfil?.rol === 'admin'
  const [criterios, setCriterios] = useState<CriteriosElectorales | null>(null)
  const [afiliados, setAfiliados] = useState<AfiliadoConRelaciones[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('configuracion').select('*').eq('clave', 'criterios_padron_electoral').single(),
      listarTodosParaExportar({}),
    ])
      .then(([{ data, error }, todos]) => {
        if (error) throw error
        setCriterios(data.valor as unknown as CriteriosElectorales)
        setAfiliados(todos)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar la configuración'))
      .finally(() => setCargando(false))
  }, [])

  const padronElectoral = useMemo(() => {
    if (!criterios) return []
    return afiliados.filter((a) => {
      const estadoOk = criterios.estados.includes(a.estado)
      const categoriaOk = criterios.categorias.length === 0 || (a.categoria && criterios.categorias.includes(a.categoria))
      return estadoOk && categoriaOk
    })
  }, [afiliados, criterios])

  async function guardarCriterios() {
    if (!criterios) return
    setGuardando(true)
    setMensaje(null)
    const { error } = await supabase
      .from('configuracion')
      .update({ valor: criterios as unknown as never, actualizado_por: perfil?.id })
      .eq('clave', 'criterios_padron_electoral')
    setGuardando(false)
    if (error) {
      setError(error.message)
    } else {
      setMensaje('Criterios guardados correctamente.')
    }
  }

  function alternarEstado(estado: Enums<'estado_afiliado'>) {
    if (!criterios) return
    const activo = criterios.estados.includes(estado)
    setCriterios({
      ...criterios,
      estados: activo ? criterios.estados.filter((e) => e !== estado) : [...criterios.estados, estado],
    })
  }

  function alternarCategoria(categoria: Enums<'categoria_afiliado'>) {
    if (!criterios) return
    const activa = criterios.categorias.includes(categoria)
    setCriterios({
      ...criterios,
      categorias: activa ? criterios.categorias.filter((c) => c !== categoria) : [...criterios.categorias, categoria],
    })
  }

  function exportarPdf() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    doc.setFontSize(13)
    doc.text('Padrón Electoral — CMFJAL', 14, 15)
    doc.setFontSize(9)
    doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')} · ${padronElectoral.length} afiliados`, 14, 21)
    autoTable(doc, {
      startY: 26,
      head: [['Apellido y nombre', 'DNI', 'Cargo', 'Organismo', 'Categoría']],
      body: padronElectoral.map((a) => [
        `${a.apellido}, ${a.nombres ?? ''}`,
        a.dni ?? '',
        a.cargo_texto ?? a.cargo?.nombre ?? '',
        a.organismo?.nombre ?? '',
        a.categoria ?? '',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [31, 44, 64] },
    })
    doc.save('padron-electoral.pdf')
  }

  if (cargando) return <Spinner />
  if (error) return <Alerta tipo="error">{error}</Alerta>
  if (!criterios) return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-institucional text-2xl font-semibold text-brand-900">Padrón electoral</h1>
        <p className="text-sm text-brand-500">
          Lista generada según los criterios configurables definidos abajo. El sistema no asume reglas estatutarias:
          la definición de quién vota depende del estatuto del Colegio y debe configurarse aquí.
        </p>
      </div>

      <Tarjeta>
        <h2 className="mb-3 font-institucional text-base text-brand-800">Criterios de inclusión</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-brand-700">Estados habilitados</p>
            <div className="flex flex-col gap-1">
              {TODOS_ESTADOS.map((estado) => (
                <label key={estado} className="flex items-center gap-2 text-sm text-brand-700">
                  <input
                    type="checkbox"
                    checked={criterios.estados.includes(estado)}
                    onChange={() => alternarEstado(estado)}
                    disabled={!esAdmin}
                  />
                  <span className="capitalize">{estado}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-brand-700">Categorías incluidas (vacío = todas)</p>
            <div className="flex flex-col gap-1">
              {TODAS_CATEGORIAS.map((categoria) => (
                <label key={categoria} className="flex items-center gap-2 text-sm text-brand-700">
                  <input
                    type="checkbox"
                    checked={criterios.categorias.includes(categoria)}
                    onChange={() => alternarCategoria(categoria)}
                    disabled={!esAdmin}
                  />
                  <span className="capitalize">{categoria}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {esAdmin && (
          <div className="mt-4 flex items-center gap-3">
            <Boton onClick={guardarCriterios} cargando={guardando}>
              Guardar criterios
            </Boton>
            {mensaje && <span className="text-sm text-emerald-700">{mensaje}</span>}
          </div>
        )}
        {!esAdmin && <p className="mt-3 text-xs text-brand-400">Solo un administrador puede modificar estos criterios.</p>}
      </Tarjeta>

      <Tarjeta>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-institucional text-base text-brand-800">{padronElectoral.length} afiliados habilitados</h2>
          <div className="flex gap-2">
            <Boton variante="secundario" onClick={() => exportarCSV(padronElectoral, 'padron-electoral.csv')}>
              CSV
            </Boton>
            <Boton variante="secundario" onClick={() => exportarExcel(padronElectoral, 'padron-electoral.xlsx')}>
              Excel
            </Boton>
            <Boton variante="secundario" onClick={exportarPdf}>
              PDF
            </Boton>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white text-xs uppercase text-brand-500">
              <tr>
                <th className="py-2">Apellido y nombre</th>
                <th className="py-2">DNI</th>
                <th className="py-2">Organismo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {padronElectoral.map((a) => (
                <tr key={a.id}>
                  <td className="py-2">
                    {a.apellido}, {a.nombres}
                  </td>
                  <td className="py-2 text-brand-500">{a.dni ?? '—'}</td>
                  <td className="py-2 text-brand-500">{a.organismo?.nombre ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </div>
  )
}
