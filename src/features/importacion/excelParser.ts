import ExcelJS from 'exceljs'

export interface FilaExcelOrigen {
  filaExcel: number
  nro: string
  dni: string
  legajo: string
  apellidoYNombre: string
  organismo: string
  cargo: string
}

const ALIAS_ENCABEZADO: Record<string, keyof Omit<FilaExcelOrigen, 'filaExcel'>> = {
  NRO: 'nro',
  DNI: 'dni',
  LEGAJO: 'legajo',
  'APELLIDO Y NOMBRE': 'apellidoYNombre',
  ORGANISMO: 'organismo',
  CARGO: 'cargo',
}

function valorCelda(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) return ''
  if (typeof valor === 'object') {
    if ('text' in valor && typeof valor.text === 'string') return valor.text
    if ('result' in valor) return String((valor as { result: unknown }).result ?? '')
  }
  return String(valor).trim()
}

/** Lee la primera hoja del Excel e interpreta las columnas conocidas del padrón (NRO, DNI, LEGAJO, APELLIDO Y NOMBRE, ORGANISMO, CARGO). */
export async function leerExcelPadron(archivo: File): Promise<FilaExcelOrigen[]> {
  const libro = new ExcelJS.Workbook()
  const buffer = await archivo.arrayBuffer()
  await libro.xlsx.load(buffer)
  const hoja = libro.worksheets[0]
  if (!hoja) throw new Error('El archivo no tiene hojas.')

  const encabezados: (keyof Omit<FilaExcelOrigen, 'filaExcel'> | null)[] = []
  const filaEncabezado = hoja.getRow(1)
  filaEncabezado.eachCell({ includeEmpty: true }, (celda, colNumero) => {
    const texto = valorCelda(celda.value).toUpperCase().trim()
    encabezados[colNumero] = ALIAS_ENCABEZADO[texto] ?? null
  })

  if (!encabezados.includes('apellidoYNombre')) {
    throw new Error('No se encontró la columna "APELLIDO Y NOMBRE" en la primera fila del archivo.')
  }

  const filas: FilaExcelOrigen[] = []
  hoja.eachRow({ includeEmpty: false }, (fila, numeroFila) => {
    if (numeroFila === 1) return
    const registro: Partial<FilaExcelOrigen> = { filaExcel: numeroFila }
    fila.eachCell({ includeEmpty: true }, (celda, colNumero) => {
      const campo = encabezados[colNumero]
      if (campo) registro[campo] = valorCelda(celda.value)
    })
    const tieneAlgo = Object.values(registro).some((v) => typeof v === 'string' && v.trim() !== '')
    if (!tieneAlgo) return
    filas.push({
      filaExcel: numeroFila,
      nro: registro.nro ?? '',
      dni: registro.dni ?? '',
      legajo: registro.legajo ?? '',
      apellidoYNombre: registro.apellidoYNombre ?? '',
      organismo: registro.organismo ?? '',
      cargo: registro.cargo ?? '',
    })
  })

  return filas
}
