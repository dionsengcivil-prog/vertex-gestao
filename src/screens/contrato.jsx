import { useState } from 'react'
import { carregarMedicoes, criarMedicao, hoje, salvarItemDoContrato } from '../lib/dados.js'
import { useObra } from '../lib/ObraContext.jsx'
import { useDados } from '../lib/useDados.js'
import { estaProntoParaMedir, tomDaMedicao, valorDaMedicao } from '../lib/medicao.js'
import { moeda, preco, quantidade } from '../lib/formato.js'
import { dataBR } from '../lib/datas.js'
import { pode } from '../lib/perfis.js'
import { Cartao, Estado, Formulario, Tag, Titulo } from '../components/index.jsx'

// Um contrato: os serviços contratados por torre e as medições dele.
export function Contrato({ goto, params, profile }) {
  const { base, nome, unidade } = useObra()
  const [folha, setFolha] = useState(null)
  const { data, erro, carregando, recarregar } = useDados(carregarMedicoes)
  const role = profile.role

  if (carregando || erro) return <div className="corpo"><Estado carregando={carregando} erro={erro} /></div>

  const { contratos, itens, medicoes, avancos } = data
  const contrato = contratos.find((c) => c.id === params.contratoId)
  if (!contrato) return <div className="corpo"><div className="estado erro">Contrato não encontrado nesta obra.</div></div>

  const itensDoContrato = itens.filter((i) => i.contrato_id === contrato.id)
  const medicoesDoContrato = medicoes.filter((m) => m.contrato_id === contrato.id).sort((a, b) => b.numero - a.numero)
  const prontoDoItem = (item) =>
    avancos
      .filter((a) => a.empreiteiro_id === contrato.empreiteiro_id && a.servico_id === item.servico_id && a.torre_id === item.torre_id && estaProntoParaMedir(a))
      .reduce((s, a) => s + a.quantidade, 0)

  // A medição nova já abre no detalhe, para incluir os avanços.
  const criar = async (valores) => {
    const resultado = await criarMedicao(contrato.id, valores)
    if (!resultado.erro) goto('medicaoDetalhe', { medicaoId: resultado.data.id })
    return resultado
  }

  return (
    <div className="corpo">
      <Titulo texto={nome('empreiteiro', contrato.empreiteiro_id)} aoVoltar={() => goto('medicao')}>
        <Tag tom={contrato.status === 'Ativo' ? 'ok' : ''}>{contrato.numero} · {contrato.status}</Tag>
      </Titulo>

      <Cartao rotulo="Itens do contrato" lado={pode.alterarEstrutura(role) && <button className="link" onClick={() => setFolha('item')}>+ Novo item</button>}>
        {itensDoContrato.length === 0 && <div className="linha-vazia">Nenhum serviço neste contrato. Sem item, nenhum avanço deste empreiteiro pode ser lançado.</div>}
        {itensDoContrato.map((item) => {
          const un = unidade(item.servico_id)
          const pronto = prontoDoItem(item)
          return (
            <div key={item.id} className="lin">
              <span className="tx">
                <span className="t1">{nome('servico', item.servico_id)} · {nome('torre', item.torre_id)}</span>
                <span className="t2">{preco(item.preco_unitario)}/{un} · contratado {quantidade(item.quantidade_contratada, un)}</span>
              </span>
              {pronto > 0 ? <Tag tom="info">{quantidade(pronto, un)} a medir</Tag> : <Tag>sem avanço</Tag>}
            </div>
          )
        })}
      </Cartao>

      <Cartao rotulo="Medições" lado={pode.prepararMedicao(role) && <button className="link" onClick={() => setFolha('medicao')}>+ Nova medição</button>}>
        {medicoesDoContrato.length === 0 && <div className="linha-vazia">Nenhuma medição ainda.</div>}
        {medicoesDoContrato.map((m) => (
          <button key={m.id} className={`lin ${m.status === 'Devolvida' ? 'alerta' : ''}`} onClick={() => goto('medicaoDetalhe', { medicaoId: m.id })}>
            <span className="tx">
              <span className="t1">Medição nº {m.numero} · {moeda(valorDaMedicao(m, avancos, contratos, itens))}</span>
              <span className="t2">{dataBR(m.periodo_inicio)} a {dataBR(m.periodo_fim)}{m.motivo_devolucao ? <b> · {m.motivo_devolucao}</b> : ''}</span>
            </span>
            <Tag tom={tomDaMedicao(m.status)}>{m.status}</Tag>
          </button>
        ))}
      </Cartao>

      {folha === 'item' && (
        <Formulario titulo="Novo item do contrato"
          campos={[
            { nome: 'servico_id', rotulo: 'Serviço', tipo: 'lista', opcoes: base.servicos, obrigatorio: true },
            { nome: 'torre_id', rotulo: 'Torre', tipo: 'lista', opcoes: base.torres, obrigatorio: true, ajuda: 'Um item por serviço por torre.' },
            { nome: 'preco_unitario', rotulo: 'Preço unitário (R$)', tipo: 'numero', obrigatorio: true },
            { nome: 'quantidade_contratada', rotulo: 'Quantidade contratada', tipo: 'numero', obrigatorio: true },
          ]}
          aoSalvar={(v) => salvarItemDoContrato(contrato.id, v)} aoFechar={() => { setFolha(null); recarregar() }} />
      )}
      {folha === 'medicao' && (
        <Formulario titulo="Nova medição" rotuloSalvar="Criar e incluir avanços" inicial={{ periodo_fim: hoje() }}
          campos={[
            { nome: 'periodo_inicio', rotulo: 'Início do período', tipo: 'data', obrigatorio: true },
            { nome: 'periodo_fim', rotulo: 'Fim do período', tipo: 'data', obrigatorio: true },
          ]}
          aoSalvar={criar} aoFechar={() => setFolha(null)} />
      )}
    </div>
  )
}
