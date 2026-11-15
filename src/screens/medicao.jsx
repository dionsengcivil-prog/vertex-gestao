import { useState } from 'react'
import { carregarMedicoes, hoje, salvarContrato } from '../lib/dados.js'
import { useObra } from '../lib/ObraContext.jsx'
import { useDados } from '../lib/useDados.js'
import { resumoDoContrato, tomDaMedicao, valorDaMedicao } from '../lib/medicao.js'
import { moeda, milhares } from '../lib/formato.js'
import { pode } from '../lib/perfis.js'
import { Barra, Cartao, EXPORTAR_DEPOIS, Estado, Formulario, Kpi, Tag, Vazio, useAviso } from '../components/index.jsx'

// Lista de contratos, o de maior valor pronto para medir primeiro.
export function Medicao({ goto, profile }) {
  const { base, nome } = useObra()
  const avisar = useAviso()
  const [folha, setFolha] = useState(false)
  const { data, erro, carregando, recarregar } = useDados(carregarMedicoes)
  const podeCriar = pode.alterarEstrutura(profile.role)

  if (carregando || erro) return <div className="corpo"><Estado carregando={carregando} erro={erro} /></div>

  const { contratos, itens, medicoes, avancos } = data
  const linhas = contratos
    .map((contrato) => {
      const doContrato = medicoes.filter((m) => m.contrato_id === contrato.id).sort((a, b) => b.numero - a.numero)
      return { contrato, resumo: resumoDoContrato(contrato, itens, medicoes, avancos, contratos), ultima: doContrato[0] || null }
    })
    .sort((a, b) => b.resumo.pronto - a.resumo.pronto)

  const aguardando = medicoes.filter((m) => m.status === 'Aguardando aprovação')
  const devolvidas = medicoes.filter((m) => m.status === 'Devolvida')
  const totalPronto = linhas.reduce((s, l) => s + l.resumo.pronto, 0)
  const totalAguardando = aguardando.reduce((s, m) => s + valorDaMedicao(m, avancos, contratos, itens), 0)

  const formulario = folha && (
    <Formulario titulo="Novo contrato" inicial={{ data_inicio: hoje() }}
      campos={[
        { nome: 'empreiteiro_id', rotulo: 'Empreiteiro', tipo: 'lista', opcoes: base.empreiteiros, obrigatorio: true, ajuda: 'Não está na lista? Cadastre em Estrutura → Empreiteiros.' },
        { nome: 'numero', rotulo: 'Número do contrato', tipo: 'texto', obrigatorio: true },
        { nome: 'data_inicio', rotulo: 'Data de início', tipo: 'data', obrigatorio: true },
      ]}
      aoSalvar={salvarContrato} aoFechar={() => { setFolha(false); recarregar() }} />
  )

  if (contratos.length === 0) {
    return (
      <div className="corpo">
        <Vazio icone="medicao" titulo="Nenhum contrato cadastrado" texto="Cadastre o contrato de cada empreiteiro, com o preço de cada serviço por torre."
          acao={podeCriar ? '+ Novo contrato' : null} aoAgir={() => setFolha(true)} />
        {formulario}
      </div>
    )
  }

  return (
    <div className="corpo">
      <div className="kpis">
        <Kpi rotulo="A medir" numero={milhares(totalPronto)} sub="R$ mil · conferido" />
        <Kpi tom="acc" rotulo="Aprovar" numero={aguardando.length} sub={aguardando.length ? moeda(totalAguardando) : 'nada pendente'} />
        <Kpi tom={devolvidas.length ? 'red' : 'grn'} rotulo="Devolvidas" numero={devolvidas.length} sub={devolvidas.length ? 'aguardam correção' : 'em dia'} subRuim={devolvidas.length > 0} />
      </div>

      {podeCriar && <button className="btn sec" onClick={() => setFolha(true)}>+ Novo contrato</button>}

      <Cartao rotulo={`Contratos · ${contratos.length}`} lado={<button className="link" onClick={() => avisar(EXPORTAR_DEPOIS)}>Exportar</button>}>
        {linhas.map(({ contrato, resumo, ultima }) => (
          <button key={contrato.id} className="ct" onClick={() => goto('contrato', { contratoId: contrato.id })}>
            <div className="ct-h">
              <span><b>{nome('empreiteiro', contrato.empreiteiro_id)}</b><span className="rot">{contrato.numero}</span></span>
              {ultima ? <Tag tom={tomDaMedicao(ultima.status)}>nº {ultima.numero} · {ultima.status}</Tag> : <Tag>sem medição</Tag>}
            </div>
            <div className="nums">
              <div className="dest"><span className="rot">Pronto p/ medir</span><b>{moeda(resumo.pronto)}</b></div>
              <div><span className="rot">Contratado</span><b>{moeda(resumo.contratado)}</b></div>
              <div><span className="rot">Medido acum.</span><b>{moeda(resumo.medido)}</b></div>
              <div><span className="rot">Saldo</span><b>{moeda(resumo.saldo)}</b></div>
            </div>
            <Barra percentual={resumo.percentual} />
            <div style={{ height: 12 }} />
          </button>
        ))}
      </Cartao>
      {formulario}
    </div>
  )
}
