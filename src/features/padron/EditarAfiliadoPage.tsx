import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AfiliadoFormulario, type ValoresFormulario } from '@/features/padron/AfiliadoFormulario'
import { actualizarAfiliado, mapearFormularioAPayload, obtenerAfiliado, type AfiliadoConRelaciones } from '@/features/padron/data'
import { ModalMotivo } from '@/components/ui/ModalMotivo'
import { Spinner, Alerta } from '@/components/ui/Basicos'

export function EditarAfiliadoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [afiliado, setAfiliado] = useState<AfiliadoConRelaciones | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cambiosPendientes, setCambiosPendientes] = useState<ReturnType<typeof mapearFormularioAPayload> | null>(null)

  useEffect(() => {
    if (!id) return
    obtenerAfiliado(id)
      .then(setAfiliado)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el afiliado'))
      .finally(() => setCargando(false))
  }, [id])

  if (cargando) return <Spinner />
  if (error) return <Alerta tipo="error">{error}</Alerta>
  if (!afiliado) return null

  async function prepararGuardado(valores: ValoresFormulario) {
    setCambiosPendientes(mapearFormularioAPayload(valores))
  }

  async function confirmarConMotivo(motivo: string) {
    if (!id || !cambiosPendientes) return
    await actualizarAfiliado(id, cambiosPendientes, motivo)
    navigate(`/padron/${id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-institucional text-2xl font-semibold text-brand-900">
          Editar afiliado — {afiliado.apellido}
          {afiliado.nombres ? `, ${afiliado.nombres}` : ''}
        </h1>
        <p className="text-sm text-brand-500">Todo cambio queda registrado en el historial de auditoría con el motivo indicado.</p>
      </div>
      <div className="max-w-3xl rounded-lg border border-brand-200 bg-white p-6 shadow-sm">
        <AfiliadoFormulario
          afiliadoIdActual={afiliado.id}
          valoresIniciales={{
            apellido: afiliado.apellido,
            nombres: afiliado.nombres ?? '',
            dni: afiliado.dni ?? '',
            cuil: afiliado.cuil ?? '',
            fecha_nacimiento: afiliado.fecha_nacimiento ?? '',
            email: afiliado.email ?? '',
            telefono: afiliado.telefono ?? '',
            domicilio: afiliado.domicilio ?? '',
            categoria: afiliado.categoria ?? '',
            cargo_id: afiliado.cargo_id ?? '',
            organismo_id: afiliado.organismo_id ?? '',
            fecha_alta: afiliado.fecha_alta ?? '',
            observaciones: afiliado.observaciones ?? '',
            nro_legajo: afiliado.nro_legajo?.toString() ?? '',
          }}
          onGuardar={prepararGuardado}
          etiquetaGuardar="Guardar cambios"
        />
      </div>

      {cambiosPendientes && (
        <ModalMotivo
          titulo="Motivo de la modificación"
          descripcion="Indicá por qué se modifica este registro. Quedará en el historial del afiliado."
          etiquetaConfirmar="Guardar cambios"
          onConfirmar={confirmarConMotivo}
          onCancelar={() => setCambiosPendientes(null)}
        />
      )}
    </div>
  )
}
