import { useState } from 'react'
import { alternarAvancoNaMedicao, carregarMedicoes, mudarStatusDaMedicao, salvarMedicao } from '../lib/dados.js'
import { useObra } from '../lib/ObraContext.jsx'
import { useDados } from '../lib/useDados.js'
import { medicaoEditavel, podeEntrarNaMedicao } from '../lib/fluxos.js'
import { precoDoAvanco, tomDaMedicao, valorDaMedicao, valorDoAvanco } from '../lib/medicao.js'
import { moeda, preco, quantidade } from '../lib/formato.js'
import { dataBR } from '../lib/datas.js'
import { pode } from '../lib/perfis.js'
import { Cartao, EXPORTAR_DEPOIS, Estado, Formulario, Tag, Titulo, useAcao, useAviso } from '../components/index.jsx'

// Uma medição: os avanços incluídos, o total, e aprovar ou devolver.
export function MedicaoDetalhe({ goto, params, profile }) {
  const { nome, local, unidade } = useObra()
  const avisar = useAviso()
  const [folha, setFolha] = useState(null)
  const { data, erro, carregando, recarregar } = useDados(carregarMedicoes)
  const agir = useAcao(recarregar)
  const role = profile.role

  if (carregando || erro) return <div className="corpo"><Estado carregando={carregando} erro={erro} /></div>

  const { contratos, itens, medicoes, avancos } = data
  const medicao = medicoes.find((m) => m.id === params.medicaoId)
  if (!medicao) return <div className="corpo"><div className="estado erro">Medição não encontrada nesta obra.</div></div>

  const contrato = contratos.find((c) => c.id === medicao.contrato_id)
  const incluidos = avancos.filter((a) => a.medicao_id === medicao.id)
  const total = valorDaMedicao(medicao, avancos, contratos, itens)
  const editando = medicaoEditavel(medicao) && pode.prepararMedicao(role)
  const livres = editando ? avancos.filter((a) => podeEntrarNaMedicao(a, contrato)) : []
  const fechar = () => { setFolha(null); recarregar() }

  const linhaDoAvanco = (a, botao) => (
    <div key={a.id} className="lin">
      <span className="tx">
        <span className="t1">{local(a.torre_id, a.pavimento_id)} · {nome('servico', a.servico_id)}</span>
        <span className="t2">{dataBR(a.data)} · {quantidade(a.quantidade, unidade(a.servico_id))} × {preco(precoDoAvanco(a, contratos, itens))}</span>
      </span>
      <span className="botoes"><span className="val">{moeda(valorDoAvanco(a, contratos, itens))}</span>{botao}</span>
    </div>
  )

  return (
    <div className="corpo">
      <Titulo texto={`Medição nº ${medicao.numero}`} aoVoltar={() => goto('contrato', { contratoId: contrato.id })}>
        <Tag tom={tomDaMedicao(medicao.status)}>{medicao.status}</Tag>
      </Titulo>

      <Cartao rotulo={`${nome('empreiteiro', contrato.empreiteiro_id)} · ${contrato.numero}`} lado={<span className="rot">{dataBR(medicao.periodo_inicio)} a {dataBR(medicao.periodo_fim)}</span>}>
        {medicao.motivo_devolucao && <div className="lin alerta"><span className="tx"><span className="t1">Devolvida</span><span className="t2"><b>{medicao.motivo_devolucao}</b></span></span></div>}
        {incluidos.length === 0 && (
          <div className="linha-vazia">
            {medicao.status === 'Aprovada' ? (medicao.observacao || 'Medição antiga, sem o detalhe dos avanços.') : 'Nenhum avanço incluído ainda nesta medição.'}
          </div>
        )}
        {incluidos.map((a) => linhaDoAvanco(a, editando && (
          <button className="mini bad" onClick={() => agir(() => alternarAvancoNaMedicao(medicao.id, a.id))}>Tirar</button>
        )))}
        {medicao.desconto > 0 && <div className="total"><span className="rot">Desconto{medicao.observacao ? ` · ${medicao.observacao}` : ''}</span><b>− {moeda(medicao.desconto)}</b></div>}
        <div className="total"><span className="rot">Total da medição</span><b>{moeda(total)}</b></div>
      </Cartao>

      {editando && (
        <Cartao rotulo={`Avanços conferidos ainda sem medição · ${livres.length}`}>
          {livres.length === 0 && <div className="linha-vazia">Não há avanço conferido deste empreiteiro para medir.</div>}
          {livres.map((a) => linhaDoAvanco(a, (
            <button className="mini ok" onClick={() => agir(() => alternarAvancoNaMedicao(medicao.id, a.id))}>Incluir</button>
          )))}
        </Cartao>
      )}

      <div className="acoes">
        {editando && (
          <>
            <button className="btn sec" onClick={() => setFolha('desconto')}>Desconto e observação</button>
            <button className="btn pri" onClick={() => agir(() => mudarStatusDaMedicao(medicao.id, 'enviar'), 'Medição enviada para aprovação.')}>Enviar para aprovação</button>
          </>
        )}
        {medicao.status === 'Aguardando aprovação' && pode.aprovarMedicao(role) && (
          <>
            <button className="btn bad" onClick={() => setFolha('devolver')}>Devolver</button>
            <button className="btn ok" onClick={() => agir(() => mudarStatusDaMedicao(medicao.id, 'aprovar'), 'Medição aprovada: os avanços passaram a Medido.')}>✓ Aprovar</button>
          </>
        )}
        <button className="btn sec" onClick={() => avisar(EXPORTAR_DEPOIS)}>Exportar</button>
      </div>

      {folha === 'desconto' && (
        <Formulario titulo="Desconto e observação" inicial={{ desconto: medicao.desconto, observacao: medicao.observacao || '' }}
          campos={[
            { nome: 'desconto', rotulo: 'Desconto (R$)', tipo: 'numero' },
            { nome: 'observacao', rotulo: 'Observação', tipo: 'texto', ajuda: 'Explique o desconto.' },
          ]}
          aoSalvar={(v) => salvarMedicao(medicao.id, v)} aoFechar={fechar} />
      )}
      {folha === 'devolver' && (
        <Formulario titulo="Devolver medição" rotuloSalvar="Devolver"
          campos={[{ nome: 'motivo', rotulo: 'Motivo da devolução', tipo: 'longo', obrigatorio: true }]}
          aoSalvar={(v) => mudarStatusDaMedicao(medicao.id, 'devolver', v.motivo)} aoFechar={fechar} />
      )}
    </div>
  )
}
