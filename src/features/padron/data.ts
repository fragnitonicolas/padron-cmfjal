import { supabase } from '@/lib/supabase'
import type { Enums, Json, Tables, TablesInsert } from '@/types/database.types'

export type Afiliado = Tables<'afiliados'>
export type Organismo = Tables<'organismos'>
export type Cargo = Tables<'cargos'>

export interface AfiliadoConRelaciones extends Afiliado {
  organismo: Pick<Organismo, 'id' | 'nombre' | 'fuero' | 'localidad'> | null
  cargo: Pick<Cargo, 'id' | 'nombre' | 'jerarquia_sugerida'> | null
}

const SELECT_CON_RELACIONES =
  '*, organismo:organismos(id, nombre, fuero, localidad), cargo:cargos(id, nombre, jerarquia_sugerida)'

// Con !inner: permite filtrar afiliados por el fuero del organismo relacionado
// (un embed sin !inner solo filtraría las filas anidadas, no el padre).
const SELECT_CON_RELACIONES_FILTRO_FUERO =
  '*, organismo:organismos!inner(id, nombre, fuero, localidad), cargo:cargos(id, nombre, jerarquia_sugerida)'

export interface FiltrosPadron {
  busqueda?: string
  estado?: Enums<'estado_afiliado'> | ''
  categoria?: Enums<'categoria_afiliado'> | ''
  organismoId?: string
  fuero?: string
  ordenarPor?: keyof Afiliado | 'organismo' | 'cargo'
  ordenAscendente?: boolean
  pagina?: number
  porPagina?: number
}

export async function listarAfiliados(filtros: FiltrosPadron) {
  const {
    busqueda,
    estado,
    categoria,
    organismoId,
    fuero,
    ordenarPor = 'apellido',
    ordenAscendente = true,
    pagina = 0,
    porPagina = 25,
  } = filtros

  let query = supabase
    .from('afiliados')
    .select(fuero ? SELECT_CON_RELACIONES_FILTRO_FUERO : SELECT_CON_RELACIONES, { count: 'exact' })

  if (busqueda && busqueda.trim()) {
    const termino = busqueda.trim()
    query = query.or(
      `apellido.ilike.%${termino}%,nombres.ilike.%${termino}%,apellido_y_nombre_original.ilike.%${termino}%,dni.ilike.%${termino}%`,
    )
  }
  if (estado) query = query.eq('estado', estado)
  if (categoria) query = query.eq('categoria', categoria)
  if (organismoId) query = query.eq('organismo_id', organismoId)
  if (fuero) query = query.eq('organismo.fuero', fuero)

  const columnaOrden = ordenarPor === 'organismo' || ordenarPor === 'cargo' ? 'apellido' : ordenarPor
  query = query.order(columnaOrden, { ascending: ordenAscendente, nullsFirst: false })

  const desde = pagina * porPagina
  const hasta = desde + porPagina - 1
  query = query.range(desde, hasta)

  const { data, error, count } = await query
  if (error) throw error
  return { datos: (data ?? []) as unknown as AfiliadoConRelaciones[], total: count ?? 0 }
}

export async function listarTodosParaExportar(filtros: Omit<FiltrosPadron, 'pagina' | 'porPagina'>) {
  const { busqueda, estado, categoria, organismoId, fuero, ordenarPor = 'apellido', ordenAscendente = true } = filtros
  let query = supabase.from('afiliados').select(fuero ? SELECT_CON_RELACIONES_FILTRO_FUERO : SELECT_CON_RELACIONES)

  if (busqueda && busqueda.trim()) {
    const termino = busqueda.trim()
    query = query.or(
      `apellido.ilike.%${termino}%,nombres.ilike.%${termino}%,apellido_y_nombre_original.ilike.%${termino}%,dni.ilike.%${termino}%`,
    )
  }
  if (estado) query = query.eq('estado', estado)
  if (categoria) query = query.eq('categoria', categoria)
  if (organismoId) query = query.eq('organismo_id', organismoId)
  if (fuero) query = query.eq('organismo.fuero', fuero)

  const columnaOrden = ordenarPor === 'organismo' || ordenarPor === 'cargo' ? 'apellido' : ordenarPor
  query = query.order(columnaOrden, { ascending: ordenAscendente })

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as AfiliadoConRelaciones[]
}

export async function obtenerAfiliado(id: string) {
  const { data, error } = await supabase.from('afiliados').select(SELECT_CON_RELACIONES).eq('id', id).single()
  if (error) throw error
  return data as unknown as AfiliadoConRelaciones
}

export async function obtenerTodosLivianos() {
  const { data, error } = await supabase
    .from('afiliados')
    .select('id, dni, apellido, nombres, apellido_y_nombre_original, nro_legajo, estado')
  if (error) throw error
  return data ?? []
}

export async function crearAfiliado(payload: TablesInsert<'afiliados'>) {
  const { data, error } = await supabase.from('afiliados').insert(payload).select().single()
  if (error) throw error
  return data
}

interface ValoresFormularioAfiliado {
  apellido: string
  nombres?: string
  dni?: string
  cuil?: string
  fecha_nacimiento?: string
  email?: string
  telefono?: string
  domicilio?: string
  categoria?: Enums<'categoria_afiliado'> | ''
  cargo_id?: string
  organismo_id?: string
  fecha_alta?: string
  observaciones?: string
  nro_legajo?: string
}

/** Convierte los valores del formulario (todos strings) al payload tipado de la tabla. */
export function mapearFormularioAPayload(valores: ValoresFormularioAfiliado) {
  const cargoSeleccionado = valores.cargo_id || null
  return {
    apellido: valores.apellido.trim(),
    nombres: valores.nombres?.trim() || null,
    apellido_y_nombre_original: `${valores.apellido.trim()} ${valores.nombres?.trim() ?? ''}`.trim(),
    dni: valores.dni?.trim() || null,
    cuil: valores.cuil?.trim() || null,
    fecha_nacimiento: valores.fecha_nacimiento || null,
    email: valores.email?.trim() || null,
    telefono: valores.telefono?.trim() || null,
    domicilio: valores.domicilio?.trim() || null,
    categoria: valores.categoria || null,
    cargo_id: cargoSeleccionado,
    organismo_id: valores.organismo_id || null,
    fecha_alta: valores.fecha_alta || null,
    observaciones: valores.observaciones?.trim() || null,
    nro_legajo: valores.nro_legajo ? Number(valores.nro_legajo) : null,
  }
}

export async function actualizarAfiliado(id: string, cambios: Json, motivo: string) {
  const { data, error } = await supabase.rpc('actualizar_afiliado', {
    p_id: id,
    p_cambios: cambios,
    p_motivo: motivo,
  })
  if (error) throw error
  return data
}

export async function listarOrganismos() {
  const { data, error } = await supabase.from('organismos').select('*').eq('activo', true).order('nombre')
  if (error) throw error
  return data
}

export async function listarCargos() {
  const { data, error } = await supabase.from('cargos').select('*').eq('activo', true).order('nombre')
  if (error) throw error
  return data
}

export async function obtenerHistorial(afiliadoId: string) {
  const { data, error } = await supabase
    .from('auditoria')
    .select('*')
    .eq('tabla', 'afiliados')
    .eq('registro_id', afiliadoId)
    .order('creado_en', { ascending: false })
  if (error) throw error
  return data
}
