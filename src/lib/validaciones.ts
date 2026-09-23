export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function validarDni(dni: string): boolean {
  return /^[0-9]{7,8}$/.test(dni.trim())
}

export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Valida un CUIL/CUIT de 11 dígitos con dígito verificador (módulo 11). */
export function validarCuil(cuil: string): boolean {
  const digitos = soloDigitos(cuil)
  if (digitos.length !== 11) return false
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const suma = multiplicadores.reduce((acc, mult, i) => acc + mult * Number(digitos[i]), 0)
  let verificador = 11 - (suma % 11)
  if (verificador === 11) verificador = 0
  if (verificador === 10) return false
  return verificador === Number(digitos[10])
}

export function formatearCuil(cuil: string): string {
  const d = soloDigitos(cuil)
  if (d.length !== 11) return cuil
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`
}

export function validarEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
}

/** Validación laxa de teléfono argentino: 8 a 15 dígitos, admite +, espacios, guiones y paréntesis. */
export function validarTelefono(telefono: string): boolean {
  const limpio = telefono.trim()
  if (!/^[+()\d\s-]+$/.test(limpio)) return false
  const digitos = soloDigitos(limpio)
  return digitos.length >= 8 && digitos.length <= 15
}

/** Distancia de Levenshtein, usada para detectar posibles duplicados por nombre similar. */
export function distanciaLevenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const fila = new Array(n + 1)
  for (let j = 0; j <= n; j++) fila[j] = j
  for (let i = 1; i <= m; i++) {
    let anterior = fila[0]
    fila[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = fila[j]
      fila[j] = a[i - 1] === b[j - 1] ? anterior : 1 + Math.min(anterior, fila[j], fila[j - 1])
      anterior = temp
    }
  }
  return fila[n]
}

/** true si dos nombres normalizados son "suficientemente similares" como para sospechar duplicado. */
export function nombresSimilares(a: string, b: string): boolean {
  const na = normalizarTexto(a)
  const nb = normalizarTexto(b)
  if (na === nb) return true
  const distancia = distanciaLevenshtein(na, nb)
  const largoMax = Math.max(na.length, nb.length)
  if (largoMax === 0) return false
  return distancia / largoMax <= 0.15
}

const PARTICULAS_APELLIDO = new Set(['DE', 'DEL', 'DI', 'DA', 'DAS', 'DOS', 'LA', 'LAS', 'LOS', 'VAN', 'VON'])

function esParticulaApellido(token: string): boolean {
  return PARTICULAS_APELLIDO.has(token.toUpperCase()) || token.length === 1
}

/**
 * Separa heurísticamente "APELLIDO Y NOMBRE" en apellido/nombres cuando no hay
 * separador confiable en el origen (ver README: limitación conocida del padrón).
 * Convención: el apellido es el primer token, más las partículas iniciales
 * (DE, DEL, DI, DA, VAN, VON...) y el token que las sigue (para cubrir
 * apellidos compuestos como "DE LA FUENTE" o "DI FRANCESCA"); el resto son
 * los nombres. Siempre se deja al menos un token como nombre cuando hay más
 * de uno disponible.
 */
export function separarApellidoNombre(apellidoYNombre: string): { apellido: string; nombres: string } {
  const partes = apellidoYNombre.trim().split(/\s+/)
  if (partes.length <= 1) {
    return { apellido: apellidoYNombre.trim(), nombres: '' }
  }
  let i = 0
  while (i < partes.length - 1 && esParticulaApellido(partes[i])) i++
  const finApellido = Math.min(i, partes.length - 2)
  return {
    apellido: partes.slice(0, finApellido + 1).join(' '),
    nombres: partes.slice(finApellido + 1).join(' '),
  }
}

export function tituloDesde(texto: string): string {
  return texto
    .toLowerCase()
    .split(' ')
    .map((p) => (p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ')
}
