import { useCallback, useEffect, useState } from 'react'

// Busca dados ao abrir a tela e sempre que algo em `deps` mudar.
// Devolve os três estados que toda tela precisa (carregando, erro, dados) e
// `recarregar`, para chamar depois de gravar: ele busca de novo sem piscar
// "Carregando…", mantendo na tela o que já estava.
export function useDados(buscar, deps = []) {
  const [estado, setEstado] = useState({ data: null, erro: null, carregando: true })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    setEstado({ data: null, erro: null, carregando: true })
  }, deps)

  useEffect(() => {
    let vivo = true
    buscar().then(({ data, erro }) => {
      if (vivo) setEstado({ data, erro, carregando: false })
    })
    return () => { vivo = false }
  }, [...deps, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  return { ...estado, recarregar }
}
