import { useState } from 'react'
import { hoje, listarAvancosDaTorre } from '../lib/dados.js'
import { useObra } from '../lib/ObraContext.jsx'
import { useDados } from '../lib/useDados.js'
import { atrasoDoPavimento, cicloDaTorre, situacaoDoAndar, tomDaEtapa } from '../lib/ciclo.js'
import { dataBR } from '../lib/datas.js'
import { Cartao, Chips, Estado, Kpi, Tag } from '../components/index.jsx'

const LEGENDA = [
  { id: 'feito', nome: 'concretados no prazo', cor: 'var(--ok)' },
  { id: 'tarde', nome: 'concretados com atraso', cor: 'var(--warn)' },
  { id: 'muito-tarde', nome: 'com mais de 3 dias de atraso', cor: 'var(--danger)' },
  { id: 'fazendo', nome: 'em execução', cor: 'var(--accent)' },
  { id: 'a-fazer', nome: 'a fazer', cor: 'var(--apagado)' },
]

// A torre em corte: um bloco por pavimento, o mais alto em cima. É só desenho
// (a lista ao lado é que se toca); o resumo vai escrito para leitor de tela.
function Torre({ nome, pavimentos }) {
  const situacoes = pavimentos.map((p) => ({ ordem: p.ordem, situacao: situacaoDoAndar(p) }))
  const contar = (id) => situacoes.filter((s) => s.situacao === id).length
  const linhas = LEGENDA.filter((l) => contar(l.id) > 0)
  // Torre baixa ganha andares mais altos, para não virar um risco.
  const altura = Math.max(8, Math.min(26, Math.round(250 / Math.max(1, pavimentos.length))))
  const resumo = `${nome}: ${linhas.map((l) => `${contar(l.id)} ${l.nome}`).join(', ')}.`

  return (
    <div className="card torre-card">
      <div className="torre" role="img" aria-label={resumo} style={{ '--andar': `${altura}px` }}>
        <div className="topo-torre" />
        <div className="andares">
          {situacoes.map((s) => <div key={s.ordem} className={`andar ${s.situacao}`} data-ordem={s.ordem} />)}
        </div>
        <div className="chao" />
      </div>
      <div className="legenda-torre" aria-hidden="true">
        {linhas.map((l) => (
          <div key={l.id}><i style={{ background: l.cor }} /><b>{contar(l.id)}</b>{l.nome}</div>
        ))}
      </div>
    </div>
  )
}

// Grade de pavimentos da torre escolhida, o mais alto em cima.
export function Avanco({ goto, params }) {
  const { base } = useObra()
  const [torreId, setTorreId] = useState(params.torreId || base.torres[0]?.id || null)
  const { data, erro, carregando } = useDados(() => listarAvancosDaTorre(torreId), [torreId])

  const torre = base.torres.find((t) => t.id === torreId)
  if (!torre) return <div className="corpo"><div className="card linha-vazia">Nenhuma torre cadastrada nesta obra.</div></div>

  const pavimentos = base.pavimentos.filter((p) => p.torre_id === torreId).sort((a, b) => b.ordem - a.ordem)
  const ciclo = cicloDaTorre(torre, base.pavimentos, hoje())
  const avancos = data || []
  const contar = (pavimentoId, status) => avancos.filter((a) => a.pavimento_id === pavimentoId && a.status === status).length

  return (
    <div className="corpo">
      <Chips opcoes={base.torres} valor={torreId} aoMudar={setTorreId} />

      <div className="kpis">
        <Kpi tom="grn" rotulo="Concretados" numero={ciclo.concretados} sufixo={`/ ${ciclo.total}`}
          sub={`${ciclo.total ? Math.round((100 * ciclo.concretados) / ciclo.total) : 0}% da torre`} />
        <Kpi tom="acc" rotulo="Ciclo atual" numero={ciclo.dia ?? '—'} sufixo={ciclo.dia != null ? `/ ${ciclo.meta}` : ''}
          sub={ciclo.dia != null ? `dias · ${ciclo.atual.ordem}º ${ciclo.etapa}` : 'sem laje em execução'} subRuim={ciclo.dia > ciclo.meta} />
        <Kpi rotulo="Lajes no mês" numero={ciclo.lajesNoMes} sufixo={`/ ${ciclo.metaMes}`} sub="meta do mês" />
      </div>

      <div className="com-torre">
      {pavimentos.length > 0 && <Torre nome={torre.nome} pavimentos={pavimentos} />}
      <Cartao rotulo={`Pavimentos · ${torre.nome}`} lado={<span className="rot">previsto → real</span>}>
        <Estado carregando={carregando} erro={erro}>
          {pavimentos.map((p) => {
            const atraso = atrasoDoPavimento(p)
            const lancados = contar(p.id, 'Lançado'), conferidos = contar(p.id, 'Conferido'), medidos = contar(p.id, 'Medido')
            const resumo = [lancados && `${lancados} lançado(s)`, conferidos && `${conferidos} conferido(s)`, medidos && `${medidos} medido(s)`].filter(Boolean)
            return (
              <button key={p.id} className={`pav ${ciclo.atual?.id === p.id && ciclo.dia != null ? 'atual' : ''}`} onClick={() => goto('pavimento', { pavimentoId: p.id })}>
                <span className="n">{p.ordem}<small>º</small></span>
                <span className="tx">
                  <span className="t1">
                    {p.data_real_concretagem
                      ? `${dataBR(p.data_prevista_concretagem)} → ${dataBR(p.data_real_concretagem)}`
                      : p.data_prevista_concretagem ? `Concretagem prevista ${dataBR(p.data_prevista_concretagem)}` : 'Sem data prevista'}
                  </span>
                  <span className="t2">{resumo.length ? resumo.join(' · ') : 'Sem avanço lançado'}</span>
                </span>
                <Tag tom={tomDaEtapa(p)}>{p.etapa_ciclo}{atraso > 0 ? ` +${atraso} d` : ''}</Tag>
              </button>
            )
          })}
          {pavimentos.length === 0 && <div className="linha-vazia">Nenhum pavimento cadastrado nesta torre.</div>}
        </Estado>
      </Cartao>
      </div>
    </div>
  )
}
