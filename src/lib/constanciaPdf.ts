import { jsPDF } from 'jspdf'
import type { AfiliadoConRelaciones } from '@/features/padron/data'
import logoUrl from '@/assets/logo.jpg'

async function cargarLogoBase64(): Promise<string> {
  const respuesta = await fetch(logoUrl)
  const blob = await respuesta.blob()
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onloadend = () => resolve(lector.result as string)
    lector.onerror = reject
    lector.readAsDataURL(blob)
  })
}

export async function generarConstanciaPdf(afiliado: AfiliadoConRelaciones) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const anchoPagina = doc.internal.pageSize.getWidth()

  try {
    const logo = await cargarLogoBase64()
    doc.addImage(logo, 'JPEG', anchoPagina / 2 - 15, 15, 30, 30)
  } catch {
    // Si no se puede cargar el logo, se continúa sin él.
  }

  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.text('Colegio de la Magistratura y la Función Judicial', anchoPagina / 2, 55, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('times', 'normal')
  doc.text('Departamento Judicial Avellaneda - Lanús', anchoPagina / 2, 62, { align: 'center' })

  doc.setDrawColor(180)
  doc.line(20, 70, anchoPagina - 20, 70)

  doc.setFont('times', 'bold')
  doc.setFontSize(13)
  doc.text('CONSTANCIA DE AFILIACIÓN', anchoPagina / 2, 82, { align: 'center' })

  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  const nombreCompleto = `${afiliado.apellido}${afiliado.nombres ? ', ' + afiliado.nombres : ''}`
  const estadoTexto: Record<string, string> = {
    activo: 'activo/a',
    licencia: 'en licencia',
    baja: 'de baja',
    fallecido: 'fallecido/a',
  }

  const parrafo = `Por medio de la presente se hace constar que ${nombreCompleto}${
    afiliado.dni ? `, DNI N° ${afiliado.dni},` : ','
  } se encuentra registrado/a en el padrón de afiliados de este Colegio, en carácter de ${estadoTexto[afiliado.estado]}${
    afiliado.cargo_texto || afiliado.cargo?.nombre ? `, con el cargo de ${afiliado.cargo_texto ?? afiliado.cargo?.nombre}` : ''
  }${afiliado.organismo?.nombre ? ` en ${afiliado.organismo.nombre}` : ''}.`

  const lineas = doc.splitTextToSize(parrafo, anchoPagina - 40)
  doc.text(lineas, 20, 100)

  const yFinal = 100 + lineas.length * 6 + 15
  doc.text(`Se extiende la presente constancia a los efectos que el interesado estime corresponder.`, 20, yFinal)

  doc.text(`Avellaneda - Lanús, ${new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}.`, 20, yFinal + 20)

  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text('Documento generado automáticamente por el sistema de Padrón de Afiliados del CMFJAL.', anchoPagina / 2, 280, {
    align: 'center',
  })

  doc.save(`constancia-${afiliado.apellido.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}
