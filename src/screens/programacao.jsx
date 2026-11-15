import { useState } from 'react'
import { carregarProgramacao, hoje, mudarStatusDaAtividade, removerRestricao, salvarAtividade, salvarRestricao } from '../lib/dados.js'
import { useObra } from '../lib/ObraContext.jsx'
import { useDados } from '../lib/useDados.js'
import { diasParado, ppc, ppcPorSemana, tomDaAtividade, tomDaRestricao } from '../lib/ciclo.js'
import { pode } from '../lib/perfis.js'
import { dataBR, segundaDaSemana, somarDias } from '../lib/datas.js'
import { Cartao, Chips, Estado, Formulario, Kpi, Tag, Vazio, useAcao } from '../components/index.jsx'

const ABAS = [{ id: 'semana', nome: 'Semana' }, { id: 'restricoes', nome: 'Restrições' }]
const lista = (textos) => textos.map((t) => ({ id: t, nome: t }))
const CAUSAS = lista(['Material', 'Mão de obra', 'Projeto', 'Equipamento', 'Clima', 'Outro'])
const TIPOS_DE_RESTRICAO = lista(['Material', 'Mão de obra', 'Projeto', 'Equipamento'])

// Programação semanal (Last Planner), restrições e PPC.
export function Programacao({ params, profile }) {
  const { base, nome, local } = useObra()
  const dia = hoje()
  const [aba, setAba] = useState(params.aba || 'semana')
  const [semana, setSemana] = useState(segundaDaSemana(dia))
  const [folha, setFolha] = useState(null)
  const { data, erro, carregando, recarregar } = useDados(carregarProgramacao)
  const agir = useAcao(recarregar)
  const role = profile.role

  if (carregando || erro) return <div className="corpo"><Estado carregando={carregando} erro={erro} /></div>

  const daSemana = data.atividades.filter((a) => a.semana_inicio === semana)
  const ppcSemana = ppc(daSemana)
  const historico = ppcPorSemana(data.atividades).slice(-8)
  const restricoes = [...data.restricoes].sort(
    (a, b) => (a.status === b.status ? diasParado(b, dia) - diasParado(a, dia) : a.status === 'Aberta' ? -1 : 1),
  )
  const abertas = restricoes.filter((r) => r.status === 'Aberta').length
  const fechar = () => { setFolha(null); recarregar() }

  // Os pavimentos oferecidos dependem da torre escolhida no próprio formulário.
  const pavimentosDaTorre = (v) =>
    base.pavimentos.filter((p) => p.torre_id === v.torre_id).sort((a, b) => b.ordem - a.ordem)
  const camposDoLocal = [
    { nome: 'torre_id', rotulo: 'Torre', tipo: 'lista', opcoes: base.torres, obrigatorio: true },
    { nome: 'pavimento_id', rotulo: 'Pavimento', tipo: 'lista', opcoes: pavimentosDaTorre },
  ]
  const camposDaAtividade = [
    ...camposDoLocal,
    { nome: 'servico_id', rotulo: 'Serviço', tipo: 'lista', opcoes: base.servicos, obrigatorio: true },
    { nome: 'empreiteiro_id', rotulo: 'Empreiteiro', tipo: 'lista', opcoes: base.empreiteiros },
  ]
  const camposDaRestricao = [
    { nome: 'tipo', rotulo: 'Tipo', tipo: 'lista', opcoes: TIPOS_DE_RESTRICAO, obrigatorio: true },
    ...camposDoLocal,
    { nome: 'servico_id', rotulo: 'Serviço', tipo: 'lista', opcoes: base.servicos },
    { nome: 'descricao', rotulo: 'O que está travando', tipo: 'texto', obrigatorio: true },
    { nome: 'responsavel_id', rotulo: 'Quem vai destravar', tipo: 'lista', opcoes: base.pessoas, obrigatorio: true },
    { nome: 'data_prometida', rotulo: 'Data prometida', tipo: 'data' },
  ]

  return (
    <div className="corpo">
      <div className="kpis">
        <Kpi tom="acc" rotulo="PPC da semana" numero={ppcSemana ?? '—'} sufixo={ppcSemana != null ? '%' : ''}
          sub={`${daSemana.filter((a) => a.status === 'Concluída').length} de ${daSemana.length} concluídas`} />
        <Kpi tom={abertas ? 'red' : 'grn'} rotulo="Restrições" numero={abertas} sub="abertas" subRuim={abertas > 0} />
        <Kpi rotulo="Semana" numero={dataBR(semana)} sub={`até ${dataBR(somarDias(semana, 6))}`} />
      </div>

      <Chips opcoes={ABAS} valor={aba} aoMudar={setAba} />

      {aba === 'semana' && (
        <>
          <div className="acoes">
            <button className="btn sec" onClick={() => setSemana(somarDias(semana, -7))}>◀ Semana anterior</button>
            <button className="btn sec" onClick={() => setSemana(somarDias(semana, 7))}>Próxima semana ▶</button>
          </div>
          {daSemana.length === 0 ? (
            <Vazio icone="programacao" titulo="Esta semana ainda está em branco"
              texto="Programe as atividades de cada torre e acompanhe aqui o PPC e o que travar pelo caminho."
              acao={pode.programarSemana(role) ? '+ Programar a primeira atividade' : null} aoAgir={() => setFolha({ tipo: 'atividade' })} />
          ) : (
            <Cartao rotulo={`Atividades · ${dataBR(semana)} a ${dataBR(somarDias(semana, 6))}`}
              lado={pode.programarSemana(role) && <button className="link" onClick={() => setFolha({ tipo: 'atividade' })}>+ Nova</button>}>
              {daSemana.map((a) => (
                <div key={a.id} className={`lin ${a.status === 'Não concluída' ? 'alerta' : ''}`}>
                  <span className="tx">
                    <span className="t1">{local(a.torre_id, a.pavimento_id)} · {nome('servico', a.servico_id)}</span>
                    <span className="t2">{nome('empreiteiro', a.empreiteiro_id)}{a.causa ? <b> · causa: {a.causa}</b> : ''}</span>
                  </span>
                  <span className="botoes">
                    <Tag tom={tomDaAtividade(a.status)}>{a.status}</Tag>
                    {pode.criarRestricao(role) && a.status !== 'Concluída' && (
                      <button className="mini ok" onClick={() => agir(() => mudarStatusDaAtividade(a.id, 'Concluída'))}>Concluída</button>
                    )}
                    {pode.criarRestricao(role) && a.status === 'Programada' && (
                      <button className="mini bad" onClick={() => setFolha({ tipo: 'causa', atividade: a })}>Não concluída</button>
                    )}
                  </span>
                </div>
              ))}
            </Cartao>
          )}
          <Cartao rotulo="PPC das últimas semanas">
            {historico.length === 0
              ? <div className="linha-vazia">Ainda não há semana programada.</div>
              : (
                <div className="ppc">
                  {historico.map((h) => (
                    <div key={h.semana}><b>{h.ppc}%</b><i style={{ height: `${h.ppc}%` }} /><span>{dataBR(h.semana)}</span></div>
                  ))}
                </div>
              )}
          </Cartao>
        </>
      )}

      {aba === 'restricoes' && (
        <Cartao rotulo={`Restrições · ${abertas} abertas`}
          lado={pode.criarRestricao(role) && <button className="link" onClick={() => setFolha({ tipo: 'restricao' })}>+ Nova</button>}>
          {restricoes.length === 0 && <div className="linha-vazia">Nenhuma restrição registrada.</div>}
          {restricoes.map((r) => (
            <div key={r.id} className={`lin ${tomDaRestricao(r, dia) === 'bad' ? 'alerta' : ''}`}>
              <span className="tx">
                <span className="t1">{r.descricao}</span>
                <span className="t2">
                  {r.tipo} · {local(r.torre_id, r.pavimento_id)}{r.servico_id ? ` · ${nome('servico', r.servico_id)}` : ''} · resp. {nome('pessoa', r.responsavel_id)}
                  {r.data_prometida ? ` · prometido ${dataBR(r.data_prometida)}` : ''}
                </span>
              </span>
              <span className="botoes">
                <Tag tom={tomDaRestricao(r, dia)}>
                  {r.status === 'Removida' ? `Removida em ${diasParado(r, dia)} d` : `Aberta há ${diasParado(r, dia)} d`}
                </Tag>
                {r.status === 'Aberta' && pode.removerRestricao(role) && (
                  <button className="mini ok" onClick={() => agir(() => removerRestricao(r.id), 'Restrição removida.')}>Remover</button>
                )}
              </span>
            </div>
          ))}
        </Cartao>
      )}

      {folha?.tipo === 'atividade' && (
        <Formulario titulo={`Nova atividade · semana de ${dataBR(semana)}`} campos={camposDaAtividade}
          aoSalvar={(v) => salvarAtividade({ ...v, semana_inicio: semana })} aoFechar={fechar} />
      )}
      {folha?.tipo === 'causa' && (
        <Formulario titulo="Por que não foi concluída?" rotuloSalvar="Marcar como não concluída"
          campos={[{ nome: 'causa', rotulo: 'Causa', tipo: 'lista', opcoes: CAUSAS, obrigatorio: true }]}
          aoSalvar={(v) => mudarStatusDaAtividade(folha.atividade.id, 'Não concluída', v.causa)} aoFechar={fechar} />
      )}
      {folha?.tipo === 'restricao' && (
        <Formulario titulo="Nova restrição" campos={camposDaRestricao} aoSalvar={salvarRestricao} aoFechar={fechar} />
      )}
    </div>
  )
}
