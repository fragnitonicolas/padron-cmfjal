import ExcelJS from 'exceljs'
import type { AfiliadoConRelaciones } from '@/features/padron/data'

const ETIQUETAS_ESTADO: Record<string, string> = {
  activo: 'Activo',
  licencia: 'Licencia',
  baja: 'Baja',
  fallecido: 'Fallecido',
}

function filaDesdeAfiliado(a: AfiliadoConRelaciones) {
  return {
    Legajo: a.nro_legajo ?? '',
    DNI: a.dni ?? '',
    Apellido: a.apellido,
    Nombres: a.nombres ?? '',
    CUIL: a.cuil ?? '',
    Categoria: a.categoria ?? '',
    Cargo: a.cargo_texto ?? a.cargo?.nombre ?? '',
    Organismo: a.organismo?.nombre ?? '',
    Fuero: a.organismo?.fuero ?? '',
    Localidad: a.organismo?.localidad ?? '',
    Estado: ETIQUETAS_ESTADO[a.estado] ?? a.estado,
    Email: a.email ?? '',
    Telefono: a.telefono ?? '',
    Domicilio: a.domicilio ?? '',
    FechaAlta: a.fecha_alta ?? '',
    FechaBaja: a.fecha_baja ?? '',
  }
}

function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}

export function exportarCSV(afiliados: AfiliadoConRelaciones[], nombreArchivo: string) {
  const filas = afiliados.map(filaDesdeAfiliado)
  if (filas.length === 0) {
    descargarBlob(new Blob([''], { type: 'text/csv;charset=utf-8;' }), nombreArchivo)
    return
  }
  const columnas = Object.keys(filas[0])
  const escapar = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const contenido = [columnas.join(','), ...filas.map((f) => columnas.map((c) => escapar((f as Record<string, unknown>)[c])).join(','))].join('\n')
  descargarBlob(new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8;' }), nombreArchivo)
}

export async function exportarExcel(afiliados: AfiliadoConRelaciones[], nombreArchivo: string) {
  const filas = afiliados.map(filaDesdeAfiliado)
  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet('Padrón')
  if (filas.length > 0) {
    hoja.columns = Object.keys(filas[0]).map((clave) => ({ header: clave, key: clave, width: 22 }))
    hoja.addRows(filas)
    hoja.getRow(1).font = { bold: true }
  }
  const buffer = await libro.xlsx.writeBuffer()
  descargarBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombreArchivo)
}
