import { carregarPainel, hoje } from '../lib/dados.js'
import { useObra } from '../lib/ObraContext.jsx'
import { useDados } from '../lib/useDados.js'
import { cicloDaTorre, diasParado, resumoDoEfetivo, tomDaRestricao, tomDoCiclo } from '../lib/ciclo.js'
import { prontoParaMedir } from '../lib/medicao.js'
import { moeda, milhares } from '../lib/formato.js'
import { dataBR } from '../lib/datas.js'
import { Barra, Cartao, Estado, Kpi, Tag } from '../components/index.jsx'

// A tela de todo dia do gerente e do planejador.
export function Painel({ goto }) {
  const { base, nome, local } = useObra()
  const { data, erro, carregando } = useDados(carregarPainel)
  const dia = hoje()

  if (carregando || erro) return <div className="corpo"><Estado carregando={carregando} erro={erro} /></div>

  const torres = base.torres.filter((t) => t.tipo === 'Torre')
  const ciclos = torres.map((torre) => ({ torre, ciclo: cicloDaTorre(torre, base.pavimentos, dia) }))
  const restricoes = [...data.restricoes].sort((a, b) => diasParado(b, dia) - diasParado(a, dia))
  const aMedir = prontoParaMedir(data.avancos, data.contratos, data.itens)
  const totalAMedir = aMedir.reduce((s, l) => s + l.total, 0)
  const efetivo = resumoDoEfetivo(data.diarios, data.efetivos, dia)
  const variacao = efetivo.totalOntem == null ? null : efetivo.totalHoje - efetivo.totalOntem
  const maisAntiga = restricoes[0]

  const semLancamento = !data.avancos.length && !data.diarios.length && !data.restricoes.length
  if (semLancamento) {
    return <div className="corpo"><div className="card linha-vazia">Ainda não há lançamentos nesta obra. Comece pelo diário de hoje.</div></div>
  }

  return (
    <div className="corpo">
      <div className="kpis">
        <Kpi tom="acc" rotulo="Efetivo" numero={efetivo.totalHoje} aoClicar={() => goto('diario')}
          sub={variacao == null ? 'sem diário anterior' : variacao === 0 ? 'igual a ontem' : `${variacao < 0 ? '▼' : '▲'} ${Math.abs(variacao)} vs ontem`}
          subRuim={variacao != null && variacao < 0} />
        <Kpi tom={restricoes.length ? 'red' : 'grn'} rotulo="Parado" numero={restricoes.length} aoClicar={() => goto('programacao', { aba: 'restricoes' })}
          sub={maisAntiga ? `mais antiga: ${diasParado(maisAntiga, dia)} dias` : 'nada parado'} subRuim={Boolean(maisAntiga)} />
        <Kpi rotulo="A medir" numero={milhares(totalAMedir)} aoClicar={() => goto('medicao')}
          sub={`R$ mil · ${aMedir.length} empr.`} />
      </div>

      <div className="duas">
        <Cartao rotulo="Ciclo de laje" lado={<button className="link" onClick={() => goto('avanco')}>Ver avanço</button>}>
          {ciclos.length === 0 && <div className="linha-vazia">Nenhuma laje em execução.</div>}
          {ciclos.map(({ torre, ciclo }) => (
            <button key={torre.id} className={`lin ${tomDoCiclo(ciclo) === 'bad' ? 'alerta' : ''}`} onClick={() => goto('avanco', { torreId: torre.id })}>
              <span className="tx">
                <span className="t1">{torre.nome}{ciclo.atual ? ` · ${ciclo.atual.ordem}º pavimento` : ''}</span>
                <span className="t2">
                  {ciclo.dia != null ? `Dia ${ciclo.dia} de ${ciclo.meta} · ` : ''}
                  {ciclo.lajesNoMes} de {ciclo.metaMes} lajes no mês
                  {ciclo.atrasoUltimo > 0 && <b> · anterior atrasou {ciclo.atrasoUltimo} {ciclo.atrasoUltimo === 1 ? 'dia' : 'dias'}</b>}
                </span>
                {ciclo.dia != null && <Barra percentual={(100 * ciclo.dia) / ciclo.meta} tom={tomDoCiclo(ciclo)} />}
              </span>
              <Tag tom={tomDoCiclo(ciclo)}>{ciclo.etapa}</Tag>
            </button>
          ))}
        </Cartao>

        <Cartao rotulo={`Parado · ${restricoes.length} ${restricoes.length === 1 ? 'restrição' : 'restrições'}`} lado={<button className="link" onClick={() => goto('programacao', { aba: 'restricoes' })}>Ver todas</button>}>
          {restricoes.length === 0 && <div className="linha-vazia">Nada parado.</div>}
          {restricoes.map((r) => (
            <button key={r.id} className={`lin ${tomDaRestricao(r, dia) === 'bad' ? 'alerta' : ''}`} onClick={() => goto('programacao', { aba: 'restricoes' })}>
              <span className="tx">
                <span className="t1">{r.descricao}</span>
                <span className="t2">
                  {local(r.torre_id, r.pavimento_id)}{r.servico_id ? ` · ${nome('servico', r.servico_id)}` : ''} · resp. {nome('pessoa', r.responsavel_id)}
                  {r.data_prometida ? ` · prometido ${dataBR(r.data_prometida)}` : ''}
                </span>
              </span>
              <Tag tom={tomDaRestricao(r, dia)}>{r.tipo} · {diasParado(r, dia)} d</Tag>
            </button>
          ))}
        </Cartao>
      </div>

      <div className="duas">
        <Cartao rotulo="Pronto para medir" lado={<button className="link" onClick={() => goto('medicao')}>Medição</button>}>
          {aMedir.length === 0 && <div className="linha-vazia">Nada pronto para medir.</div>}
          {aMedir.map((linha) => (
            <button key={linha.empreiteiro_id} className="lin" onClick={() => goto('medicao')}>
              <span className="tx">
                <span className="t1">{nome('empreiteiro', linha.empreiteiro_id)}</span>
                <span className="t2">
                  {Object.entries(linha.porTorre).map(([torreId, valor]) => `${nome('torre', torreId)} ${moeda(valor)}`).join(' · ')}
                </span>
              </span>
              <span className="val">{moeda(linha.total)}<small>{linha.avancos.length} avanço(s)</small></span>
            </button>
          ))}
        </Cartao>

        <Cartao rotulo="Efetivo · hoje e semana" lado={<button className="link" onClick={() => goto('diario')}>Diário</button>}>
          {!efetivo.temDiarioHoje && <div className="linha-vazia">Sem diário hoje.</div>}
          {efetivo.linhas.map((l) => {
            const caiu = l.empreiteiro_id === efetivo.maiorQueda
            return (
              <div key={l.empreiteiro_id} className={`efe ${caiu ? 'alerta' : ''}`}>
                <b>{nome('empreiteiro', l.empreiteiro_id)}</b>
                <span className="n">{l.hoje}</span>
                <span className={`d ${caiu ? 'bad' : ''}`}>
                  Média da semana {l.mediaAtual == null ? '—' : Math.round(l.mediaAtual)} · anterior {l.mediaAnterior == null ? '—' : Math.round(l.mediaAnterior)}
                  {caiu ? ' · maior queda' : ''}
                </span>
              </div>
            )
          })}
        </Cartao>
      </div>

      <Cartao rotulo="Saúde financeira" lado={<Tag>Onda 2</Tag>}>
        <div className="linha-vazia">Receita × comprometido × incorrido por fase e por torre chega com as notas e o orçamento, na Onda 2.</div>
      </Cartao>
    </div>
  )
}
