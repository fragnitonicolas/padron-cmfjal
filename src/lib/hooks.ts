import { useEffect, useState } from 'react'

export function useDebounce<T>(valor: T, demoraMs = 300): T {
  const [valorDebounced, setValorDebounced] = useState(valor)
  useEffect(() => {
    const timeout = setTimeout(() => setValorDebounced(valor), demoraMs)
    return () => clearTimeout(timeout)
  }, [valor, demoraMs])
  return valorDebounced
}
