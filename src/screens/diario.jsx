import { useState } from 'react'
import { abrirDiarioDeHoje, hoje, listarDiarios } from '../lib/dados.js'
import { useDados } from '../lib/useDados.js'
import { pode } from '../lib/perfis.js'
import { dataBR } from '../lib/datas.js'
import { Cartao, Chips, Estado, Tag, Vazio, useAviso } from '../components/index.jsx'

export const tomDoDiario = (status) => ({ 'Revisado': 'ok', 'Enviado': 'warn' }[status] || '')

const FILTROS = [{ id: 'todos', nome: 'Todos' }, { id: 'Rascunho', nome: 'Rascunho' }, { id: 'Enviado', nome: 'Enviado' }, { id: 'Revisado', nome: 'Revisado' }]

// Lista dos diários de obra, o mais recente primeiro.
export function Diario({ goto, profile }) {
  const avisar = useAviso()
  const [filtro, setFiltro] = useState('todos')
  const { data, erro, carregando } = useDados(listarDiarios)
  const podeLancar = pode.lancarDiario(profile.role)

  if (carregando || erro) return <div className="corpo"><Estado carregando={carregando} erro={erro} /></div>

  const lista = data.filter((d) => filtro === 'todos' || d.status === filtro)
  const deHoje = data.find((d) => d.data === hoje())
  // Abre o diário de hoje; se ainda não existe, cria em Rascunho.
  const novo = async () => {
    const { data: diario, erro: falhou } = await abrirDiarioDeHoje()
    if (falhou) avisar(falhou)
    else goto('diarioDia', { diarioId: diario.id })
  }

  if (data.length === 0) {
    return (
      <div className="corpo">
        <Vazio icone="diario" titulo="Nenhum diário lançado" texto="O diário do dia registra clima, efetivo, serviços e fotos de cada torre."
          acao={podeLancar ? '+ Novo diário' : null} aoAgir={novo} />
      </div>
    )
  }

  return (
    <div className="corpo">
      {podeLancar && <button className="btn pri" onClick={novo}>{deHoje ? 'Abrir o diário de hoje' : '+ Novo diário'}</button>}
      <Chips opcoes={FILTROS} valor={filtro} aoMudar={setFiltro} />
      <Cartao rotulo={`Diários · ${lista.length}`}>
        {lista.length === 0 && <div className="linha-vazia">Nenhum diário com este status.</div>}
        {lista.map((d) => (
          <button key={d.id} className="lin" onClick={() => goto('diarioDia', { diarioId: d.id })}>
            <span className="tx">
              <span className="t1">{dataBR(d.data, true)}</span>
              <span className="t2">{d.clima_manha} / {d.clima_tarde} · efetivo {d.efetivo_total} · {d.total_fotos} fotos</span>
            </span>
            <Tag tom={tomDoDiario(d.status)}>{d.status}</Tag>
          </button>
        ))}
      </Cartao>
    </div>
  )
}
