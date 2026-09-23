import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CampoSelect, CampoTexto, CampoTextarea } from '@/components/ui/Campo'
import { Boton } from '@/components/ui/Boton'
import { Alerta } from '@/components/ui/Basicos'
import { listarCargos, listarOrganismos, obtenerTodosLivianos, type Afiliado } from '@/features/padron/data'
import { validarCuil, validarDni, validarEmail, validarTelefono, nombresSimilares, normalizarTexto } from '@/lib/validaciones'
import type { Tables } from '@/types/database.types'

const esquema = z.object({
  apellido: z.string().trim().min(1, 'Requerido'),
  nombres: z.string().trim().optional(),
  dni: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || validarDni(v), 'DNI inválido (7 u 8 dígitos)'),
  cuil: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || validarCuil(v), 'CUIL inválido (dígito verificador incorrecto)'),
  fecha_nacimiento: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || validarEmail(v), 'Email inválido'),
  telefono: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || validarTelefono(v), 'Teléfono inválido'),
  domicilio: z.string().trim().optional(),
  categoria: z.enum(['magistrado', 'funcionario', 'jubilado', 'otra', '']).optional(),
  cargo_id: z.string().optional(),
  organismo_id: z.string().optional(),
  fecha_alta: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
  nro_legajo: z.string().trim().optional(),
})

export type ValoresFormulario = z.infer<typeof esquema>

interface Props {
  valoresIniciales?: Partial<ValoresFormulario>
  afiliadoIdActual?: string
  onGuardar: (valores: ValoresFormulario) => Promise<void>
  etiquetaGuardar?: string
}

export function AfiliadoFormulario({ valoresIniciales, afiliadoIdActual, onGuardar, etiquetaGuardar = 'Guardar' }: Props) {
  const [organismos, setOrganismos] = useState<Tables<'organismos'>[]>([])
  const [cargos, setCargos] = useState<Tables<'cargos'>[]>([])
  const [posiblesDuplicados, setPosiblesDuplicados] = useState<Pick<Afiliado, 'id' | 'apellido' | 'nombres' | 'apellido_y_nombre_original' | 'dni'>[]>([])
  const [enviando, setEnviando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [todosLivianos, setTodosLivianos] = useState<Awaited<ReturnType<typeof obtenerTodosLivianos>>>([])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ValoresFormulario>({
    resolver: zodResolver(esquema),
    defaultValues: valoresIniciales,
  })

  useEffect(() => {
    listarOrganismos().then(setOrganismos).catch(() => {})
    listarCargos().then(setCargos).catch(() => {})
    obtenerTodosLivianos().then(setTodosLivianos).catch(() => {})
  }, [])

  const apellido = watch('apellido')
  const nombres = watch('nombres')
  const dni = watch('dni')

  useEffect(() => {
    if (!apellido && !dni) {
      setPosiblesDuplicados([])
      return
    }
    const nombreCompleto = `${apellido ?? ''} ${nombres ?? ''}`.trim()
    const candidatos = todosLivianos.filter((otro) => {
      if (otro.id === afiliadoIdActual) return false
      if (dni && otro.dni && normalizarTexto(otro.dni) === normalizarTexto(dni)) return true
      const nombreOtro = `${otro.apellido} ${otro.nombres ?? ''}`.trim() || otro.apellido_y_nombre_original
      return nombreCompleto.length > 3 && nombresSimilares(nombreCompleto, nombreOtro)
    })
    setPosiblesDuplicados(candidatos)
  }, [apellido, nombres, dni, todosLivianos, afiliadoIdActual])

  async function alEnviar(valores: ValoresFormulario) {
    setEnviando(true)
    setErrorGeneral(null)
    try {
      await onGuardar(valores)
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'Ocurrió un error al guardar')
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="flex flex-col gap-6">
      {posiblesDuplicados.length > 0 && (
        <Alerta tipo="advertencia">
          Posible duplicado: ya existe{posiblesDuplicados.length > 1 ? 'n' : ''} en el padrón{' '}
          {posiblesDuplicados.map((d, i) => (
            <span key={d.id}>
              {i > 0 && ', '}
              <strong>
                {d.apellido}
                {d.nombres ? `, ${d.nombres}` : ''}
              </strong>
              {d.dni ? ` (DNI ${d.dni})` : ''}
            </span>
          ))}
          . Verificá antes de continuar para no crear un registro repetido.
        </Alerta>
      )}

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="col-span-full mb-1 font-institucional text-base text-brand-800">Datos personales</legend>
        <CampoTexto etiqueta="Apellido" requerido {...register('apellido')} error={errors.apellido?.message} />
        <CampoTexto etiqueta="Nombres" {...register('nombres')} error={errors.nombres?.message} />
        <CampoTexto etiqueta="DNI" {...register('dni')} error={errors.dni?.message} placeholder="Sin puntos" />
        <CampoTexto etiqueta="CUIL" {...register('cuil')} error={errors.cuil?.message} placeholder="20-12345678-9" />
        <CampoTexto etiqueta="Fecha de nacimiento" type="date" {...register('fecha_nacimiento')} />
        <CampoTexto etiqueta="Email" type="email" {...register('email')} error={errors.email?.message} />
        <CampoTexto etiqueta="Teléfono" {...register('telefono')} error={errors.telefono?.message} placeholder="+54 11 ..." />
        <CampoTexto etiqueta="Domicilio" {...register('domicilio')} />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="col-span-full mb-1 font-institucional text-base text-brand-800">Datos institucionales</legend>
        <CampoSelect etiqueta="Categoría" {...register('categoria')}>
          <option value="">Sin especificar</option>
          <option value="magistrado">Magistrado</option>
          <option value="funcionario">Funcionario</option>
          <option value="jubilado">Jubilado</option>
          <option value="otra">Otra</option>
        </CampoSelect>
        <CampoSelect etiqueta="Cargo" {...register('cargo_id')}>
          <option value="">Sin especificar</option>
          {cargos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </CampoSelect>
        <CampoSelect etiqueta="Organismo / dependencia" {...register('organismo_id')}>
          <option value="">Sin especificar</option>
          {organismos.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre} {o.localidad ? `(${o.localidad})` : ''}
            </option>
          ))}
        </CampoSelect>
        <CampoTexto etiqueta="N° de legajo" {...register('nro_legajo')} />
        <CampoTexto etiqueta="Fecha de alta" type="date" {...register('fecha_alta')} />
      </fieldset>

      <CampoTextarea etiqueta="Observaciones" rows={3} {...register('observaciones')} />

      {errorGeneral && <Alerta tipo="error">{errorGeneral}</Alerta>}

      <div className="flex justify-end">
        <Boton type="submit" cargando={enviando}>
          {etiquetaGuardar}
        </Boton>
      </div>
    </form>
  )
}
