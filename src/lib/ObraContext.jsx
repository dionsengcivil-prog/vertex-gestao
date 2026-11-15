import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { carregarBase, definirObraAtual, listarObrasDoUsuario } from './dados.js'

// Guarda em qual obra a pessoa está e o cadastro básico dela (fases, torres,
// pavimentos, serviços, empreiteiros). Trocar de obra troca tudo.
const ObraContext = createContext(null)

const CHAVE = 'vertex-obra'

function lerObraGuardada() {
  try { return localStorage.getItem(CHAVE) } catch (_) { return null }
}

function guardarObra(id) {
  try { localStorage.setItem(CHAVE, id) } catch (_) { /* navegador sem armazenamento: só não lembra */ }
}

const porId = (lista) => new Map(lista.map((x) => [x.id, x]))

export function ObraProvider({ profile, children }) {
  const [obras, setObras] = useState(null)
  const [obraId, setObraId] = useState(null)
  const [baseCarregada, setBaseCarregada] = useState(null)
  const [erro, setErro] = useState(null)
  const [versaoObras, setVersaoObras] = useState(0)
  const [versaoBase, setVersaoBase] = useState(0)

  // Ao entrar (e depois de criar ou editar uma obra): lista as obras da pessoa.
  // Mantém a obra em uso; na primeira vez, volta na última escolhida, se a
  // pessoa ainda tiver acesso a ela, ou abre na primeira.
  useEffect(() => {
    let vivo = true
    listarObrasDoUsuario(profile.id).then(({ data, erro: e }) => {
      if (!vivo) return
      if (e) { setErro(e); return }
      setObras(data)
      setObraId((atual) => {
        if (data.some((o) => o.id === atual)) return atual
        const guardada = lerObraGuardada()
        const inicial = data.find((o) => o.id === guardada) || data[0]
        return inicial ? inicial.id : null
      })
    })
    return () => { vivo = false }
  }, [profile.id, versaoObras])

  // Avisa a camada de dados qual é a obra e carrega o cadastro básico dela.
  // Roda também quando uma tela pede `recarregarBase` depois de gravar.
  // O cadastro é guardado junto com a obra de que veio (`daObra`).
  useEffect(() => {
    if (!obraId) return undefined
    let vivo = true
    definirObraAtual(obraId)
    guardarObra(obraId)
    carregarBase().then(({ data, erro: e }) => {
      if (!vivo) return
      if (e) { setErro(e); return }
      setBaseCarregada({ daObra: obraId, ...data })
    })
    return () => { vivo = false }
  }, [obraId, versaoBase])

  // Cadastro de outra obra não serve: na troca, as telas somem já no primeiro
  // desenho e só voltam quando o cadastro da obra nova chegar. É o que impede
  // uma tela de aparecer (ou gravar) com dado da obra anterior.
  const base = baseCarregada && baseCarregada.daObra === obraId ? baseCarregada : null

  const valor = useMemo(() => {
    const mapas = base && {
      fase: porId(base.fases), torre: porId(base.torres), pavimento: porId(base.pavimentos),
      servico: porId(base.servicos), empreiteiro: porId(base.empreiteiros), pessoa: porId(base.pessoas),
    }
    const nome = (tipo, id) => (mapas && id && mapas[tipo].get(id)?.nome) || '—'
    return {
      obras: obras || [],
      obra: (obras || []).find((o) => o.id === obraId) || null,
      obraId,
      trocarObra: setObraId,
      recarregarObras: () => setVersaoObras((v) => v + 1),
      recarregarBase: () => setVersaoBase((v) => v + 1),
      base,
      nome,
      // "Torre 1 · 14º" — o local de um lançamento, do jeito que aparece nas listas.
      local: (torreId, pavimentoId) => {
        const pav = mapas && pavimentoId ? mapas.pavimento.get(pavimentoId) : null
        return pav ? `${nome('torre', torreId)} · ${pav.ordem}º` : nome('torre', torreId)
      },
      unidade: (servicoId) => (mapas && mapas.servico.get(servicoId)?.unidade) || '',
      carregando: obras === null || (obraId !== null && base === null),
      erro,
    }
  }, [obras, obraId, base, erro])

  return <ObraContext.Provider value={valor}>{children}</ObraContext.Provider>
}

export function useObra() {
  return useContext(ObraContext)
}
