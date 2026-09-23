import { supabase } from '@/lib/supabase'
import { normalizarTexto, separarApellidoNombre, tituloDesde, validarDni } from '@/lib/validaciones'
import type { FilaExcelOrigen } from '@/features/importacion/excelParser'
import type { Json } from '@/types/database.types'

export interface ItemPreview {
  filaExcel: number
  apellido: string
  nombres: string
  apellidoYNombreOriginal: string
  dni: string | null
  dniInvalido: boolean
  legajo: number | null
  organismoTextoOriginal: string
  organismoId: string | null
  cargoTextoOriginal: string
  cargoId: string | null
  cargoTexto: string | null
  afiliadoExistenteId: string | null
  accion: 'nuevo' | 'actualizar' | 'sin_cambios' | 'rechazado'
  motivoRechazo?: string
  cambios?: Record<string, unknown>
}

interface CatalogosImportacion {
  organismoAliasAId: Map<string, string>
  cargoAliasAId: Map<string, string>
  organismos: { id: string; nombre: string }[]
  cargos: { id: string; nombre: string }[]
}

export async function cargarCatalogosImportacion(): Promise<CatalogosImportacion> {
  const [{ data: aliasOrg }, { data: aliasCargo }, { data: organismos }, { data: cargos }] = await Promise.all([
    supabase.from('organismo_alias').select('alias_texto, organismo_id'),
    supabase.from('cargo_alias').select('alias_texto, cargo_id'),
    supabase.from('organismos').select('id, nombre').eq('activo', true).order('nombre'),
    supabase.from('cargos').select('id, nombre').eq('activo', true).order('nombre'),
  ])
  return {
    organismoAliasAId: new Map((aliasOrg ?? []).map((a) => [normalizarTexto(a.alias_texto), a.organismo_id])),
    cargoAliasAId: new Map((aliasCargo ?? []).map((a) => [normalizarTexto(a.alias_texto), a.cargo_id])),
    organismos: organismos ?? [],
    cargos: cargos ?? [],
  }
}

interface AfiliadoExistenteLiviano {
  id: string
  nro_legajo: number | null
  dni: string | null
  apellido: string
  nombres: string | null
  organismo_id: string | null
  cargo_id: string | null
  cargo_texto: string | null
}

export async function cargarAfiliadosExistentes(): Promise<AfiliadoExistenteLiviano[]> {
  const { data, error } = await supabase
    .from('afiliados')
    .select('id, nro_legajo, dni, apellido, nombres, organismo_id, cargo_id, cargo_texto')
  if (error) throw error
  return data ?? []
}

export function construirPreview(
  filas: FilaExcelOrigen[],
  catalogos: CatalogosImportacion,
  existentes: AfiliadoExistenteLiviano[],
): ItemPreview[] {
  const porLegajo = new Map(existentes.filter((e) => e.nro_legajo != null).map((e) => [e.nro_legajo, e]))
  const porDni = new Map(existentes.filter((e) => e.dni).map((e) => [normalizarTexto(e.dni!), e]))

  return filas.map((fila) => {
    if (!fila.apellidoYNombre.trim()) {
      return {
        filaExcel: fila.filaExcel,
        apellido: '',
        nombres: '',
        apellidoYNombreOriginal: fila.apellidoYNombre,
        dni: null,
        dniInvalido: false,
        legajo: null,
        organismoTextoOriginal: fila.organismo,
        organismoId: null,
        cargoTextoOriginal: fila.cargo,
        cargoId: null,
        cargoTexto: null,
        afiliadoExistenteId: null,
        accion: 'rechazado',
        motivoRechazo: 'Falta "Apellido y nombre"',
      }
    }

    const { apellido, nombres } = separarApellidoNombre(fila.apellidoYNombre)
    const dniLimpio = fila.dni.trim() || null
    const dniInvalido = !!dniLimpio && !validarDni(dniLimpio)
    const legajoNum = fila.legajo.trim() ? Number(fila.legajo.trim()) : null

    const organismoId = fila.organismo.trim()
      ? catalogos.organismoAliasAId.get(normalizarTexto(fila.organismo)) ?? null
      : null
    const cargoId = fila.cargo.trim() ? catalogos.cargoAliasAId.get(normalizarTexto(fila.cargo)) ?? null : null
    const cargoTexto = fila.cargo.trim() ? tituloDesde(fila.cargo.trim()) : null

    const existente =
      (legajoNum != null && porLegajo.get(legajoNum)) ||
      (dniLimpio && !dniInvalido && porDni.get(normalizarTexto(dniLimpio))) ||
      undefined

    if (!existente) {
      return {
        filaExcel: fila.filaExcel,
        apellido,
        nombres,
        apellidoYNombreOriginal: fila.apellidoYNombre,
        dni: dniInvalido ? null : dniLimpio,
        dniInvalido,
        legajo: legajoNum,
        organismoTextoOriginal: fila.organismo,
        organismoId,
        cargoTextoOriginal: fila.cargo,
        cargoId,
        cargoTexto,
        afiliadoExistenteId: null,
        accion: 'nuevo',
      }
    }

    const cambios: Record<string, unknown> = {}
    if (apellido !== existente.apellido) cambios.apellido = apellido
    if ((nombres || null) !== (existente.nombres || null)) cambios.nombres = nombres || null
    if (organismoId && organismoId !== existente.organismo_id) cambios.organismo_id = organismoId
    if (cargoId && cargoId !== existente.cargo_id) cambios.cargo_id = cargoId
    if (cargoTexto && cargoTexto !== existente.cargo_texto) cambios.cargo_texto = cargoTexto

    return {
      filaExcel: fila.filaExcel,
      apellido,
      nombres,
      apellidoYNombreOriginal: fila.apellidoYNombre,
      dni: dniInvalido ? null : dniLimpio,
      dniInvalido,
      legajo: legajoNum,
      organismoTextoOriginal: fila.organismo,
      organismoId,
      cargoTextoOriginal: fila.cargo,
      cargoId,
      cargoTexto,
      afiliadoExistenteId: existente.id,
      accion: Object.keys(cambios).length > 0 ? 'actualizar' : 'sin_cambios',
      cambios,
    }
  })
}

export interface ResultadoAplicacion {
  insertados: number
  actualizados: number
  rechazados: number
  duplicadosOmitidos: number
}

export async function aplicarImportacion(
  nombreArchivo: string,
  items: ItemPreview[],
  usuarioId: string,
): Promise<ResultadoAplicacion> {
  const resultado: ResultadoAplicacion = { insertados: 0, actualizados: 0, rechazados: 0, duplicadosOmitidos: 0 }

  const { data: importacion, error: errorImport } = await supabase
    .from('importaciones')
    .insert({ nombre_archivo: nombreArchivo, usuario_id: usuarioId, total_filas: items.length, estado: 'procesando' })
    .select()
    .single()
  if (errorImport) throw errorImport

  const filasRegistro: {
    importacion_id: string
    fila_excel: number
    datos_originales: Json
    resultado: string
    motivo?: string
    afiliado_id?: string
  }[] = []

  for (const item of items) {
    if (item.accion === 'rechazado') {
      resultado.rechazados++
      filasRegistro.push({
        importacion_id: importacion.id,
        fila_excel: item.filaExcel,
        datos_originales: { ...item } as unknown as Json,
        resultado: 'rechazado',
        motivo: item.motivoRechazo,
      })
      continue
    }
    if (item.accion === 'sin_cambios') {
      resultado.duplicadosOmitidos++
      filasRegistro.push({
        importacion_id: importacion.id,
        fila_excel: item.filaExcel,
        datos_originales: { ...item } as unknown as Json,
        resultado: 'sin_cambios',
        afiliado_id: item.afiliadoExistenteId ?? undefined,
      })
      continue
    }
    if (item.accion === 'nuevo') {
      const { data, error } = await supabase
        .from('afiliados')
        .insert({
          apellido: item.apellido,
          nombres: item.nombres || null,
          apellido_y_nombre_original: item.apellidoYNombreOriginal,
          dni: item.dni,
          nro_legajo: item.legajo,
          organismo_id: item.organismoId,
          cargo_id: item.cargoId,
          cargo_texto: item.cargoTexto,
          created_by: usuarioId,
        })
        .select('id')
        .single()
      if (error) {
        resultado.rechazados++
        filasRegistro.push({
          importacion_id: importacion.id,
          fila_excel: item.filaExcel,
          datos_originales: { ...item } as unknown as Json,
          resultado: 'rechazado',
          motivo: error.message,
        })
        continue
      }
      resultado.insertados++
      filasRegistro.push({
        importacion_id: importacion.id,
        fila_excel: item.filaExcel,
        datos_originales: { ...item } as unknown as Json,
        resultado: 'insertado',
        afiliado_id: data.id,
      })
      continue
    }
    if (item.accion === 'actualizar' && item.afiliadoExistenteId) {
      const { error } = await supabase.rpc('actualizar_afiliado', {
        p_id: item.afiliadoExistenteId,
        p_cambios: item.cambios as never,
        p_motivo: `Actualización por importación de padrón (archivo: ${nombreArchivo})`,
      })
      if (error) {
        resultado.rechazados++
        filasRegistro.push({
          importacion_id: importacion.id,
          fila_excel: item.filaExcel,
          datos_originales: { ...item } as unknown as Json,
          resultado: 'rechazado',
          motivo: error.message,
        })
        continue
      }
      resultado.actualizados++
      filasRegistro.push({
        importacion_id: importacion.id,
        fila_excel: item.filaExcel,
        datos_originales: { ...item } as unknown as Json,
        resultado: 'actualizado',
        afiliado_id: item.afiliadoExistenteId,
      })
    }
  }

  await supabase.from('importacion_filas').insert(filasRegistro)
  await supabase
    .from('importaciones')
    .update({
      insertados: resultado.insertados,
      actualizados: resultado.actualizados,
      rechazados: resultado.rechazados,
      duplicados_omitidos: resultado.duplicadosOmitidos,
      estado: 'completado',
    })
    .eq('id', importacion.id)

  return resultado
}
