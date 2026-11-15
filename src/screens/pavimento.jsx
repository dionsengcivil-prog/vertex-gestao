import { useState } from 'react'
import { atualizarCiclo, carregarPavimento, excluirAvanco, hoje, mudarStatusDoAvanco, salvarAvanco } from '../lib/dados.js'
import { useObra } from '../lib/ObraContext.jsx'
import { useDados } from '../lib/useDados.js'
import { ETAPAS_CICLO, tomDaEtapa } from '../lib/ciclo.js'
import { avancoEditavel } from '../lib/fluxos.js'
import { tomDoAvanco } from '../lib/medicao.js'
import { pode } from '../lib/perfis.js'
import { dataBR } from '../lib/datas.js'
import { quantidade } from '../lib/formato.js'
import { CONFIRMAR_EXCLUSAO, Cartao, Estado, Formulario, Icon, Tag, Titulo, useAcao } from '../components/index.jsx'

function Data({ rotulo, prevista, real }) {
  return (
    <div className="data">
      <span className="rot">{rotulo}</span>
      <b>{real ? dataBR(real) : '—'}</b>
      <small>prev. {dataBR(prevista)}</small>
    </div>
  )
}

export function Pavimento({ goto, params, profile }) {
  const { base, nome, unidade, recarregarBase } = useObra()
  const [folha, setFolha] = useState(null)
  const { data, erro, carregando, recarregar } = useDados(() => carregarPavimento(params.pavimentoId), [params.pavimentoId])
  const agir = useAcao(recarregar)
  const pavimento = base.pavimentos.find((p) => p.id === params.pavimentoId)
  const role = profile.role

  if (!pavimento) return <div className="corpo"><div className="estado erro">Pavimento não encontrado nesta obra.</div></div>

  const camposDoAvanco = [
    { nome: 'servico_id', rotulo: 'Serviço', tipo: 'lista', opcoes: base.servicos, obrigatorio: true },
    { nome: 'empreiteiro_id', rotulo: 'Empreiteiro', tipo: 'lista', opcoes: base.empreiteiros, obrigatorio: true },
    { nome: 'quantidade', rotulo: 'Quantidade', tipo: 'numero', obrigatorio: true, ajuda: 'Na unidade do serviço (m², m³, kg…).' },
    { nome: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true },
    { nome: 'observacao', rotulo: 'Observação', tipo: 'texto' },
  ]
  const camposDoCiclo = [
    { nome: 'etapa_ciclo', rotulo: 'Etapa do ciclo', tipo: 'lista', opcoes: ETAPAS_CICLO.map((e) => ({ id: e, nome: e })), obrigatorio: true },
    { nome: 'data_real_pilares', rotulo: 'Pilares e escada — data real', tipo: 'data' },
    { nome: 'data_real_laje', rotulo: 'Laje — data real', tipo: 'data' },
    { nome: 'data_real_concretagem', rotulo: 'Concretagem — data real', tipo: 'data' },
    ...(pode.editarDatasPrevistas(role) ? [
      { nome: 'data_prevista_pilares', rotulo: 'Pilares e escada — data prevista', tipo: 'data' },
      { nome: 'data_prevista_laje', rotulo: 'Laje — data prevista', tipo: 'data' },
      { nome: 'data_prevista_concretagem', rotulo: 'Concretagem — data prevista', tipo: 'data' },
    ] : []),
  ]

  return (
    <div className="corpo">
      <Titulo texto={`${nome('torre', pavimento.torre_id)} · ${pavimento.nome}`} aoVoltar={() => goto('avanco', { torreId: pavimento.torre_id })}>
        <Tag tom={tomDaEtapa(pavimento)}>{pavimento.etapa_ciclo}</Tag>
      </Titulo>

      <Cartao rotulo="Ciclo de laje" lado={pode.lancarAvanco(role) && <button className="link" onClick={() => setFolha('ciclo')}>Atualizar ciclo</button>}>
        <div className="card-b">
          <div className="datas">
            <Data rotulo="Pilares" prevista={pavimento.data_prevista_pilares} real={pavimento.data_real_pilares} />
            <Data rotulo="Laje" prevista={pavimento.data_prevista_laje} real={pavimento.data_real_laje} />
            <Data rotulo="Concret." prevista={pavimento.data_prevista_concretagem} real={pavimento.data_real_concretagem} />
          </div>
        </div>
      </Cartao>

      <Cartao rotulo="Avanços do pavimento">
        <Estado carregando={carregando} erro={erro}>
          {data?.avancos.length === 0 && <div className="linha-vazia">Nenhum avanço neste pavimento.</div>}
          {data?.avancos.map((a) => (
            <div key={a.id} className="lin">
              <span className="tx">
                <span className="t1">{nome('servico', a.servico_id)} · {quantidade(a.quantidade, unidade(a.servico_id))}</span>
                <span className="t2">{nome('empreiteiro', a.empreiteiro_id)} · {dataBR(a.data)} · lançou {nome('pessoa', a.lancado_por_id)}</span>
              </span>
              <span className="botoes">
                <Tag tom={tomDoAvanco(a.status)}>{a.status}{a.status === 'Conferido' && a.medicao_id ? ' · em medição' : ''}</Tag>
                {avancoEditavel(a) && pode.conferirAvanco(role) && (
                  <button className="mini ok" onClick={() => agir(() => mudarStatusDoAvanco(a.id, 'conferir'), 'Conferido: entrou no pronto para medir.')}>Conferir</button>
                )}
                {a.status === 'Conferido' && !a.medicao_id && pode.conferirAvanco(role) && (
                  <button className="mini" onClick={() => agir(() => mudarStatusDoAvanco(a.id, 'desfazer'))}>Desfazer</button>
                )}
                {avancoEditavel(a) && pode.lancarAvanco(role) && (
                  <button className="mini bad" onClick={() => { if (window.confirm(CONFIRMAR_EXCLUSAO)) agir(() => excluirAvanco(a.id)) }}>Excluir</button>
                )}
              </span>
            </div>
          ))}
        </Estado>
        {pode.lancarAvanco(role) && (
          <div className="card-b acoes" style={{ paddingTop: 12 }}>
            <button className="btn pri" onClick={() => setFolha('avanco')}>+ Novo avanço</button>
          </div>
        )}
      </Cartao>

      <Cartao rotulo="Fotos deste pavimento">
        <div className="card-b">
          <Estado carregando={carregando} erro={erro}>
            {data?.fotos.length === 0 && <div className="estado">Nenhuma foto do diário marcada com este pavimento.</div>}
            <div className="fotos">
              {data?.fotos.map((f) => (
                <div key={f.id} className="foto">
                  {f.url && <img src={f.url} alt={f.legenda || 'Foto do pavimento'} />}
                  {f.publicada && <Tag tom="info">Publicada</Tag>}
                  {!f.url && <span><Icon nome="foto" /><br />{f.legenda}</span>}
                </div>
              ))}
            </div>
          </Estado>
        </div>
      </Cartao>

      {folha === 'avanco' && (
        <Formulario titulo={`Novo avanço · ${pavimento.nome}`} campos={camposDoAvanco} inicial={{ data: hoje() }}
          aoSalvar={(v) => salvarAvanco({ ...v, pavimento_id: pavimento.id })} aoFechar={() => { setFolha(null); recarregar() }} />
      )}
      {folha === 'ciclo' && (
        <Formulario titulo={`Ciclo de laje · ${pavimento.nome}`} campos={camposDoCiclo} inicial={pavimento}
          aoSalvar={(v) => atualizarCiclo(pavimento.id, v)} aoFechar={() => { setFolha(null); recarregarBase() }} />
      )}
    </div>
  )
}
