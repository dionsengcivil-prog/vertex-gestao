import { useState } from 'react'
import { adicionarItemDaNota, carregarNotas, conferirNota, mudarStatusDaNota, removerItemDaNota } from '../lib/dados.js'
import { useObra } from '../lib/ObraContext.jsx'
import { useDados } from '../lib/useDados.js'
import { notaEditavel } from '../lib/fluxos.js'
import { pode } from '../lib/perfis.js'
import { dataBR } from '../lib/datas.js'
import { moeda, preco, quantidade } from '../lib/formato.js'
import { Cartao, Estado, Formulario, Tag, Titulo, useAcao } from '../components/index.jsx'
import { tomDaNota } from './notas.jsx'

// Uma nota: dados, itens, conferência do recebimento e validação.
export function Nota({ goto, params, profile }) {
  const { nome } = useObra()
  const [folha, setFolha] = useState(null)
  const { data, erro, carregando, recarregar } = useDados(carregarNotas)
  const agir = useAcao(recarregar)
  const role = profile.role

  if (carregando || erro) return <div className="corpo"><Estado carregando={carregando} erro={erro} /></div>

  const nota = data.notas.find((n) => n.id === params.notaId)
  if (!nota) return <div className="corpo"><div className="estado erro">Nota não encontrada nesta obra.</div></div>

  const itens = data.itens.filter((i) => i.nota_id === nota.id)
  const insumo = (id) => data.insumos.find((x) => x.id === id) || { nome: '—', unidade: '' }
  const fornecedor = data.fornecedores.find((f) => f.id === nota.fornecedor_id)?.nome || '—'
  const editando = notaEditavel(nota) && pode.lancarNota(role)
  const podeConferir = nota.status !== 'Validada' && itens.length > 0 && pode.conferirNota(role)
  const fechar = () => { setFolha(null); recarregar() }

  // Um campo por item, já preenchido com a quantidade da nota: o almoxarife só
  // muda o que chegou diferente.
  const camposDaConferencia = [
    ...itens.map((i) => ({
      nome: i.id, tipo: 'numero', obrigatorio: true,
      rotulo: `${insumo(i.insumo_id).nome} — recebido (${insumo(i.insumo_id).unidade})`,
      ajuda: `Na nota: ${quantidade(i.quantidade, insumo(i.insumo_id).unidade)}`,
    })),
    { nome: 'observacao', rotulo: 'Observação da conferência', tipo: 'longo', ajuda: 'Obrigatória se alguma quantidade chegou diferente.' },
  ]
  const inicialDaConferencia = {
    ...Object.fromEntries(itens.map((i) => [i.id, i.quantidade_recebida ?? i.quantidade])),
    observacao: nota.observacao_conferencia || '',
  }

  return (
    <div className="corpo">
      <Titulo texto={`NF ${nota.numero}`} aoVoltar={() => goto('notas')}>
        <Tag tom={tomDaNota(nota.status)}>{nota.status}</Tag>
      </Titulo>

      <Cartao rotulo="Dados da nota">
        <div className="lin"><span className="tx"><span className="t2">Fornecedor</span><span className="t1">{fornecedor}</span></span></div>
        <div className="lin"><span className="tx"><span className="t2">Emissão</span><span className="t1">{dataBR(nota.data_emissao, true)}</span></span></div>
        <div className="lin"><span className="tx"><span className="t2">Fase de destino</span><span className="t1">{nome('fase', nota.fase_id)}</span></span></div>
        {nota.anexo_url && <div className="card-b"><img src={nota.anexo_url} alt={`Foto da nota ${nota.numero}`} style={{ maxWidth: '100%', borderRadius: 8 }} /></div>}
      </Cartao>

      <Cartao rotulo={`Itens · ${itens.length}`} lado={editando && <button className="link" onClick={() => setFolha('item')}>+ Adicionar item</button>}>
        {itens.length === 0 && <div className="linha-vazia">Adicione pelo menos um item.</div>}
        {itens.map((i) => {
          const ins = insumo(i.insumo_id)
          const diferente = i.quantidade_recebida != null && i.quantidade_recebida !== i.quantidade
          return (
            <div key={i.id} className={`lin ${diferente ? 'alerta' : ''}`}>
              <span className="tx">
                <span className="t1">{ins.nome}</span>
                <span className="t2">
                  {quantidade(i.quantidade, ins.unidade)} × {preco(i.valor_unitario)}
                  {i.quantidade_recebida != null && (diferente
                    ? <b> · recebido {quantidade(i.quantidade_recebida, ins.unidade)}</b>
                    : ` · recebido ${quantidade(i.quantidade_recebida, ins.unidade)}`)}
                </span>
              </span>
              <span className="botoes">
                <span className="val">{moeda(i.quantidade * i.valor_unitario)}</span>
                {editando && <button className="mini bad" aria-label={`Remover ${ins.nome}`} onClick={() => agir(() => removerItemDaNota(nota.id, i.id))}>×</button>}
              </span>
            </div>
          )
        })}
        <div className="total"><span className="rot">Total da nota</span><b>{moeda(nota.valor_total)}</b></div>
      </Cartao>

      <Cartao rotulo="Andamento">
        <div className="lin"><span className="tx"><span className="t2">Lançada por</span><span className="t1">{nome('pessoa', nota.lancada_por_id)}</span></span></div>
        <div className={`lin ${nota.status === 'Divergente' ? 'alerta' : ''}`}>
          <span className="tx">
            <span className="t2">Recebimento conferido</span>
            <span className="t1">{nota.conferida_em ? `${dataBR(nota.conferida_em, true)} · ${nome('pessoa', nota.conferida_por_id)}` : 'Ainda não conferido'}</span>
            {nota.observacao_conferencia && <span className="t2"><b>{nota.observacao_conferencia}</b></span>}
          </span>
        </div>
        <div className="lin">
          <span className="tx">
            <span className="t2">Validada</span>
            <span className="t1">{nota.validada_em ? `${dataBR(nota.validada_em, true)} · ${nome('pessoa', nota.validada_por_id)}` : 'Ainda não validada'}</span>
          </span>
        </div>
      </Cartao>

      <div className="acoes">
        {nota.status === 'Lançada' && pode.lancarNota(role) && (
          <button className="btn sec" onClick={() => agir(() => mudarStatusDaNota(nota.id, 'aguardar'), 'Nota marcada como aguardando material.')}>Aguardando material</button>
        )}
        {podeConferir && (
          <button className="btn pri" onClick={() => setFolha('conferir')}>{nota.conferida_em ? 'Conferir de novo' : 'Conferir recebimento'}</button>
        )}
        {nota.status === 'Recebida conferida' && pode.validarNota(role) && (
          <button className="btn ok" onClick={() => agir(() => mudarStatusDaNota(nota.id, 'validar'), 'Nota validada.')}>Validar</button>
        )}
      </div>

      {folha === 'item' && (
        <Formulario titulo="Item da nota" rotuloSalvar="Adicionar"
          campos={[
            { nome: 'insumo_id', rotulo: 'Insumo', tipo: 'lista', opcoes: data.insumos },
            { nome: 'novo_insumo', rotulo: 'Ou um insumo novo', tipo: 'texto', se: (v) => !v.insumo_id, ajuda: 'Escreva o nome se ele não estiver na lista.' },
            { nome: 'unidade', rotulo: 'Unidade do insumo novo', tipo: 'texto', se: (v) => !v.insumo_id && Boolean(v.novo_insumo), ajuda: 'kg, saco, m³, un…' },
            { nome: 'quantidade', rotulo: 'Quantidade', tipo: 'numero', obrigatorio: true },
            { nome: 'valor_unitario', rotulo: 'Valor unitário (R$)', tipo: 'numero', obrigatorio: true },
          ]}
          aoSalvar={(v) => adicionarItemDaNota(nota.id, v)} aoFechar={fechar} />
      )}
      {folha === 'conferir' && (
        <Formulario titulo={`Conferir recebimento · NF ${nota.numero}`} rotuloSalvar="Confirmar conferência"
          campos={camposDaConferencia} inicial={inicialDaConferencia}
          aoSalvar={(v) => conferirNota(nota.id, v, v.observacao || '')} aoFechar={fechar} />
      )}
    </div>
  )
}
