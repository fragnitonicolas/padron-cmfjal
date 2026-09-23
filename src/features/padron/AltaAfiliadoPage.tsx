import { useNavigate } from 'react-router-dom'
import { AfiliadoFormulario, type ValoresFormulario } from '@/features/padron/AfiliadoFormulario'
import { crearAfiliado, mapearFormularioAPayload } from '@/features/padron/data'

export function AltaAfiliadoPage() {
  const navigate = useNavigate()

  async function guardar(valores: ValoresFormulario) {
    const payload = mapearFormularioAPayload(valores)
    const creado = await crearAfiliado(payload)
    navigate(`/padron/${creado.id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-institucional text-2xl font-semibold text-brand-900">Alta de afiliado</h1>
        <p className="text-sm text-brand-500">Completá los datos disponibles. Solo apellido es obligatorio.</p>
      </div>
      <div className="max-w-3xl rounded-lg border border-brand-200 bg-white p-6 shadow-sm">
        <AfiliadoFormulario onGuardar={guardar} etiquetaGuardar="Dar de alta" />
      </div>
    </div>
  )
}
