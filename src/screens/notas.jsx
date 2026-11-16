import { useState } from 'react'
import { carregarNotas, hoje, salvarNota } from '../lib/dados.js'
import { useObra } from '../lib/ObraContext.jsx'
import { useDados } from '../lib/useDados.js'
import { pode } from '../lib/perfis.js'
import { dataBR, diasEntre } from '../lib/datas.js'
import { moeda } from '../lib/formato.js'
import { Cartao, Chips, Estado, Formulario, Tag, Vazio } from '../components/index.jsx'

export const tomDaNota = (status) => ({ 'Validada': 'ok', 'Recebida conferida': 'info', 'Divergente': 'bad', 'Aguardando material': 'warn' }[status] || '')

const STATUS = ['Lançada', 'Aguardando material', 'Recebida conferida', 'Divergente', 'Validada']

// Lista de notas fiscais de material: a que aguarda há mais tempo primeiro.
export function Notas({ goto, profile }) {
  const { base, nome } = useObra()
  const [status, setStatus] = useState('todas')
  const [faseId, setFaseId] = useState('todas')
  const [folha, setFolha] = useState(false)
  const { data, erro, carregando } = useDados(carregarNotas)
  const podeLancar = pode.lancarNota(profile.role)

  if (carregando || erro) return <div className="corpo"><Estado carregando={carregando} erro={erro} /></div>

  const fornecedor = (id) => data.fornecedores.find((f) => f.id === id)?.nome || '—'
  // Validadas vão para o fim; entre as demais, a emissão mais antiga primeiro.
  const lista = data.notas
    .filter((n) => (status === 'todas' || n.status === status) && (faseId === 'todas' || n.fase_id === faseId))
    .sort((a, b) => (a.status === 'Validada') - (b.status === 'Validada') || (a.data_emissao < b.data_emissao ? -1 : 1))

  // A nota nova já abre no detalhe, para lançar os itens.
  const criar = async (valores) => {
    const resultado = await salvarNota(valores)
    if (!resultado.erro) goto('nota', { notaId: resultado.data.id })
    return resultado
  }
  const formulario = folha && (
    <Formulario titulo="Nova nota" rotuloSalvar="Criar e lançar os itens" inicial={{ data_emissao: hoje() }}
      campos={[
        { nome: 'fornecedor_id', rotulo: 'Fornecedor', tipo: 'lista', opcoes: data.fornecedores },
        { nome: 'novo_fornecedor', rotulo: 'Ou um fornecedor novo', tipo: 'texto', se: (v) => !v.fornecedor_id, ajuda: 'Escreva o nome se ele não estiver na lista.' },
        { nome: 'numero', rotulo: 'Número da nota', tipo: 'texto', obrigatorio: true },
        { nome: 'data_emissao', rotulo: 'Data de emissão', tipo: 'data', obrigatorio: true },
        { nome: 'fase_id', rotulo: 'Fase de destino', tipo: 'lista', opcoes: base.fases, obrigatorio: true, ajuda: 'É o centro de custo que paga a nota.' },
        { nome: 'anexo_url', rotulo: 'Foto da nota', tipo: 'foto' },
      ]}
      aoSalvar={criar} aoFechar={() => setFolha(false)} />
  )

  if (data.notas.length === 0) {
    return (
      <div className="corpo">
        <Vazio icone="notas" titulo="Nenhuma nota lançada" texto="Lance a nota quando ela chegar; o almoxarife confere o material e o administrativo valida."
          acao={podeLancar ? '+ Nova nota' : null} aoAgir={() => setFolha(true)} />
        {formulario}
      </div>
    )
  }

  return (
    <div className="corpo">
      {podeLancar && <button className="btn pri" onClick={() => setFolha(true)}>+ Nova nota</button>}
      <Chips valor={status} aoMudar={setStatus} opcoes={[{ id: 'todas', nome: 'Todas' }, ...STATUS.map((s) => ({ id: s, nome: s }))]} />
      {base.fases.length > 1 && <Chips valor={faseId} aoMudar={setFaseId} opcoes={[{ id: 'todas', nome: 'Todas as fases' }, ...base.fases]} />}

      <Cartao rotulo={`Notas · ${lista.length}`}>
        {lista.length === 0 && <div className="linha-vazia">Nenhuma nota com estes filtros.</div>}
        {lista.map((n) => {
          const dias = diasEntre(n.data_emissao, hoje())
          return (
            <button key={n.id} className={`lin ${n.status === 'Divergente' ? 'alerta' : ''}`} onClick={() => goto('nota', { notaId: n.id })}>
              <span className="tx">
                <span className="t1">{fornecedor(n.fornecedor_id)} · NF {n.numero}</span>
                <span className="t2">
                  {dataBR(n.data_emissao)} · {nome('fase', n.fase_id)}
                  {n.status !== 'Validada' && (dias === 0 ? ' · hoje' : ` · há ${dias} ${dias === 1 ? 'dia' : 'dias'}`)}
                </span>
              </span>
              <span className="botoes"><span className="val">{moeda(n.valor_total)}</span><Tag tom={tomDaNota(n.status)}>{n.status}</Tag></span>
            </button>
          )
        })}
      </Cartao>
      {formulario}
    </div>
  )
}
