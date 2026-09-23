import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  actualizarAfiliado,
  obtenerAfiliado,
  obtenerHistorial,
  type AfiliadoConRelaciones,
} from '@/features/padron/data'
import { usePuedeEditar } from '@/lib/auth'
import { Boton } from '@/components/ui/Boton'
import { Alerta, Spinner, Tarjeta } from '@/components/ui/Basicos'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { ModalMotivo } from '@/components/ui/ModalMotivo'
import { generarConstanciaPdf } from '@/lib/constanciaPdf'
import type { Tables } from '@/types/database.types'

type FilaAuditoria = Tables<'auditoria'>

const ETIQUETAS_CAMPO: Record<string, string> = {
  apellido: 'Apellido',
  nombres: 'Nombres',
  dni: 'DNI',
  cuil: 'CUIL',
  email: 'Email',
  telefono: 'Teléfono',
  domicilio: 'Domicilio',
  categoria: 'Categoría',
  cargo_id: 'Cargo',
  organismo_id: 'Organismo',
  estado: 'Estado',
  fecha_baja: 'Fecha de baja',
  motivo_baja: 'Motivo de baja',
  observaciones: 'Observaciones',
  fecha_alta: 'Fecha de alta',
  nro_legajo: 'N° de legajo',
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-brand-400">{etiqueta}</dt>
      <dd className="text-sm text-brand-900">{valor || '—'}</dd>
    </div>
  )
}

function camposModificados(anterior: Record<string, unknown> | null, nuevo: Record<string, unknown> | null) {
  if (!anterior || !nuevo) return []
  return Object.keys(nuevo).filter((clave) => {
    if (!(clave in ETIQUETAS_CAMPO)) return false
    return JSON.stringify(anterior[clave]) !== JSON.stringify(nuevo[clave])
  })
}

export function FichaAfiliadoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const puedeEditar = usePuedeEditar()
  const [afiliado, setAfiliado] = useState<AfiliadoConRelaciones | null>(null)
  const [historial, setHistorial] = useState<FilaAuditoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalBaja, setModalBaja] = useState(false)
  const [modalReactivar, setModalReactivar] = useState(false)
  const [generandoPdf, setGenerandoPdf] = useState(false)

  async function recargar() {
    if (!id) return
    setCargando(true)
    try {
      const [af, hist] = await Promise.all([obtenerAfiliado(id), obtenerHistorial(id)])
      setAfiliado(af)
      setHistorial(hist)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el afiliado')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    recargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (cargando) return <Spinner />
  if (error) return <Alerta tipo="error">{error}</Alerta>
  if (!afiliado || !id) return null

  async function darDeBaja(motivo: string) {
    await actualizarAfiliado(id!, { estado: 'baja', fecha_baja: new Date().toISOString().slice(0, 10), motivo_baja: motivo }, motivo)
    setModalBaja(false)
    await recargar()
  }

  async function reactivar(motivo: string) {
    await actualizarAfiliado(id!, { estado: 'activo', fecha_baja: null, motivo_baja: null }, motivo)
    setModalReactivar(false)
    await recargar()
  }

  async function descargarConstancia() {
    if (!afiliado) return
    setGenerandoPdf(true)
    try {
      await generarConstanciaPdf(afiliado)
    } finally {
      setGenerandoPdf(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button onClick={() => navigate('/padron')} className="mb-1 text-sm text-brand-500 hover:underline">
            ← Volver al padrón
          </button>
          <h1 className="font-institucional text-2xl font-semibold text-brand-900">
            {afiliado.apellido}
            {afiliado.nombres ? `, ${afiliado.nombres}` : ''}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <EstadoBadge estado={afiliado.estado} />
            {afiliado.categoria && <span className="text-sm text-brand-500 capitalize">{afiliado.categoria}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" onClick={descargarConstancia} cargando={generandoPdf}>
            Constancia PDF
          </Boton>
          {puedeEditar && (
            <>
              <Link to={`/padron/${id}/editar`}>
                <Boton variante="secundario">Editar</Boton>
              </Link>
              {afiliado.estado !== 'baja' ? (
                <Boton variante="peligro" onClick={() => setModalBaja(true)}>
                  Dar de baja
                </Boton>
              ) : (
                <Boton onClick={() => setModalReactivar(true)}>Reactivar</Boton>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Tarjeta className="lg:col-span-2">
          <h2 className="mb-4 font-institucional text-base text-brand-800">Datos del afiliado</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Dato etiqueta="DNI" valor={afiliado.dni} />
            <Dato etiqueta="CUIL" valor={afiliado.cuil} />
            <Dato etiqueta="N° de legajo" valor={afiliado.nro_legajo?.toString()} />
            <Dato etiqueta="Fecha de nacimiento" valor={afiliado.fecha_nacimiento} />
            <Dato etiqueta="Email" valor={afiliado.email} />
            <Dato etiqueta="Teléfono" valor={afiliado.telefono} />
            <Dato etiqueta="Domicilio" valor={afiliado.domicilio} />
            <Dato etiqueta="Cargo" valor={afiliado.cargo_texto ?? afiliado.cargo?.nombre} />
            <Dato etiqueta="Organismo" valor={afiliado.organismo?.nombre} />
            <Dato etiqueta="Fuero" valor={afiliado.organismo?.fuero} />
            <Dato etiqueta="Fecha de alta" valor={afiliado.fecha_alta} />
            {afiliado.estado === 'baja' && (
              <>
                <Dato etiqueta="Fecha de baja" valor={afiliado.fecha_baja} />
                <Dato etiqueta="Motivo de baja" valor={afiliado.motivo_baja} />
              </>
            )}
          </dl>
          {afiliado.observaciones && (
            <div className="mt-4">
              <Dato etiqueta="Observaciones" valor={afiliado.observaciones} />
            </div>
          )}
          <p className="mt-4 text-xs text-brand-400">
            Texto original del padrón importado: «{afiliado.apellido_y_nombre_original}»
          </p>
        </Tarjeta>

        <Tarjeta>
          <h2 className="mb-4 font-institucional text-base text-brand-800">Historial de cambios</h2>
          {historial.length === 0 ? (
            <p className="text-sm text-brand-400">Sin cambios registrados.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {historial.map((h) => {
                const campos = camposModificados(
                  h.valores_anteriores as Record<string, unknown> | null,
                  h.valores_nuevos as Record<string, unknown> | null,
                )
                return (
                  <li key={h.id} className="border-b border-brand-100 pb-3 text-sm last:border-0">
                    <p className="font-medium text-brand-800">
                      {h.accion === 'INSERT' ? 'Alta del registro' : 'Modificación'}
                    </p>
                    <p className="text-xs text-brand-400">
                      {new Date(h.creado_en).toLocaleString('es-AR')} · {h.usuario_email ?? 'usuario desconocido'}
                    </p>
                    {h.motivo && <p className="mt-1 text-brand-700">Motivo: {h.motivo}</p>}
                    {campos.length > 0 && (
                      <p className="mt-1 text-xs text-brand-500">
                        Campos modificados: {campos.map((c) => ETIQUETAS_CAMPO[c] ?? c).join(', ')}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Tarjeta>
      </div>

      {modalBaja && (
        <ModalMotivo
          titulo="Dar de baja al afiliado"
          descripcion="La baja es siempre lógica: el registro se conserva con estado 'Baja' y puede reactivarse."
          etiquetaConfirmar="Dar de baja"
          variantePeligro
          onConfirmar={darDeBaja}
          onCancelar={() => setModalBaja(false)}
        />
      )}
      {modalReactivar && (
        <ModalMotivo
          titulo="Reactivar afiliado"
          etiquetaConfirmar="Reactivar"
          onConfirmar={reactivar}
          onCancelar={() => setModalReactivar(false)}
        />
      )}
    </div>
  )
}
