import { useState } from 'react'
import { carregarObraAtual, hoje, salvarEmpreiteiro, salvarFase, salvarObra, salvarServico, salvarTorre } from '../lib/dados.js'
import { useObra } from '../lib/ObraContext.jsx'
import { useDados } from '../lib/useDados.js'
import { SITUACOES_DA_OBRA } from '../lib/fluxos.js'
import { dataBR } from '../lib/datas.js'
import { tomDaSituacao } from '../lib/formato.js'
import { Cartao, Chips, Estado, Formulario, Tag, useAviso } from '../components/index.jsx'

const ABAS = [
  { id: 'obra', nome: 'Obra' },
  { id: 'torres', nome: 'Fases e torres' },
  { id: 'servicos', nome: 'Serviços' },
  { id: 'empreiteiros', nome: 'Empreiteiros' },
]
const lista = (textos) => textos.map((t) => ({ id: t, nome: t }))

const CAMPOS_DA_OBRA = [
  { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
  { nome: 'codigo', rotulo: 'Código / apelido', tipo: 'texto', obrigatorio: true, ajuda: 'Curto, como RM-01. Aparece no seletor de obra.' },
  { nome: 'grupo', rotulo: 'Grupo de contrato', tipo: 'texto', ajuda: 'Obras com o mesmo nome de grupo ficam juntas. Em branco, usa o nome da obra.' },
  { nome: 'cliente', rotulo: 'Cliente', tipo: 'texto' },
  { nome: 'endereco', rotulo: 'Endereço', tipo: 'texto' },
  { nome: 'data_inicio', rotulo: 'Data de início', tipo: 'data', obrigatorio: true },
  { nome: 'data_meta_entrega', rotulo: 'Data-meta de entrega', tipo: 'data' },
  { nome: 'situacao', rotulo: 'Situação', tipo: 'lista', opcoes: lista(SITUACOES_DA_OBRA), obrigatorio: true },
]

// O cadastro da obra em uso, e a porta para abrir uma obra nova. Só o gerente chega aqui.
export function Estrutura() {
  const { base, recarregarBase, recarregarObras, trocarObra } = useObra()
  const avisar = useAviso()
  const [aba, setAba] = useState('obra')
  const [folha, setFolha] = useState(null)
  const { data, erro, carregando, recarregar } = useDados(carregarObraAtual)
  const campo = (rotulo, valor) => (
    <div className="lin"><span className="tx"><span className="t2">{rotulo}</span><span className="t1">{valor || '—'}</span></span></div>
  )
  const novo = (tipo, extra = {}) => <button className="link" onClick={() => setFolha({ tipo, ...extra })}>+ Novo</button>
  const fecharCadastro = () => { setFolha(null); recarregarBase() }

  // Obra nova: entra na lista do seletor e o app já troca para ela.
  const criarObra = async (valores) => {
    const resultado = await salvarObra(valores)
    if (!resultado.erro) {
      recarregarObras()
      trocarObra(resultado.data.id)
      avisar(`Obra ${resultado.data.codigo} criada. Você já está nela.`)
    }
    return resultado
  }

  return (
    <div className="corpo">
      <Chips opcoes={ABAS} valor={aba} aoMudar={setAba} />

      {aba === 'obra' && (
        <>
          <Cartao rotulo="Dados da obra" lado={data && <button className="link" onClick={() => setFolha({ tipo: 'obra' })}>Editar</button>}>
            <Estado carregando={carregando} erro={erro}>
              {data && (
                <>
                  {campo('Nome', data.obra.nome)}
                  {campo('Código / apelido', data.obra.codigo)}
                  {campo('Grupo de contrato', data.grupo?.nome)}
                  {campo('Cliente', data.obra.cliente)}
                  {campo('Endereço', data.obra.endereco)}
                  {campo('Data de início', dataBR(data.obra.data_inicio, true))}
                  {campo('Data-meta de entrega', dataBR(data.obra.data_meta_entrega, true))}
                  <div className="lin"><span className="tx"><span className="t2">Situação</span></span><Tag tom={tomDaSituacao(data.obra.situacao)}>{data.obra.situacao}</Tag></div>
                </>
              )}
            </Estado>
          </Cartao>
          <button className="btn pri" onClick={() => setFolha({ tipo: 'novaObra' })}>+ Abrir uma obra nova</button>
        </>
      )}

      {aba === 'torres' && (
        <>
          {base.fases.length === 0 && <div className="card linha-vazia">Cadastre a primeira fase desta obra.</div>}
          {base.fases.map((fase) => {
            const torres = base.torres.filter((t) => t.fase_id === fase.id)
            return (
              <Cartao key={fase.id} rotulo={`${fase.nome} · centro de custo ${fase.centro_custo}`} lado={novo('torre', { fase })}>
                {torres.length === 0 && <div className="linha-vazia">Nenhuma torre nesta fase.</div>}
                {torres.map((t) => (
                  <div key={t.id} className="lin">
                    <span className="tx">
                      <span className="t1">{t.nome}</span>
                      <span className="t2">{base.pavimentos.filter((p) => p.torre_id === t.id).length} pavimentos · ciclo de {t.meta_ciclo_dias} dias · {t.meta_lajes_mes} lajes/mês</span>
                    </span>
                    <Tag>{t.tipo}</Tag>
                  </div>
                ))}
              </Cartao>
            )
          })}
          <button className="btn sec" onClick={() => setFolha({ tipo: 'fase' })}>+ Nova fase</button>
        </>
      )}

      {aba === 'servicos' && (
        <Cartao rotulo={`Serviços medíveis · ${base.servicos.length}`} lado={novo('servico')}>
          {base.servicos.length === 0 && <div className="linha-vazia">Nenhum serviço cadastrado.</div>}
          {base.servicos.map((s) => (
            <div key={s.id} className="lin"><span className="tx"><span className="t1">{s.nome}</span></span><Tag>{s.unidade}</Tag></div>
          ))}
        </Cartao>
      )}

      {aba === 'empreiteiros' && (
        <Cartao rotulo={`Empreiteiros · ${base.empreiteiros.length}`} lado={novo('empreiteiro')}>
          {base.empreiteiros.length === 0 && <div className="linha-vazia">Nenhum empreiteiro cadastrado.</div>}
          {base.empreiteiros.map((e) => (
            <div key={e.id} className="lin"><span className="tx"><span className="t1">{e.nome}</span><span className="t2">{e.cnpj || 'CNPJ não informado'}</span></span></div>
          ))}
        </Cartao>
      )}

      {folha?.tipo === 'obra' && (
        <Formulario titulo="Editar obra" campos={CAMPOS_DA_OBRA} inicial={{ ...data.obra, grupo: data.grupo?.nome || '' }}
          aoSalvar={salvarObra} aoFechar={() => { setFolha(null); recarregar(); recarregarObras() }} />
      )}
      {folha?.tipo === 'novaObra' && (
        <Formulario titulo="Abrir uma obra nova" rotuloSalvar="Criar obra" campos={CAMPOS_DA_OBRA}
          inicial={{ situacao: 'Em andamento', data_inicio: hoje() }} aoSalvar={criarObra} aoFechar={() => setFolha(null)} />
      )}
      {folha?.tipo === 'fase' && (
        <Formulario titulo="Nova fase"
          campos={[
            { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, ajuda: 'Ex.: Fase 1.' },
            { nome: 'centro_custo', rotulo: 'Centro de custo', tipo: 'texto', obrigatorio: true },
          ]}
          aoSalvar={salvarFase} aoFechar={fecharCadastro} />
      )}
      {folha?.tipo === 'torre' && (
        <Formulario titulo={`Nova torre · ${folha.fase.nome}`} inicial={{ tipo: 'Torre', meta_ciclo_dias: 7, meta_lajes_mes: 4 }}
          campos={[
            { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, ajuda: 'Ex.: Torre 3.' },
            { nome: 'tipo', rotulo: 'Tipo', tipo: 'lista', opcoes: lista(['Torre', 'Anexo', 'Garagem', 'Lazer']), obrigatorio: true },
            { nome: 'pavimentos', rotulo: 'Quantos pavimentos', tipo: 'numero', obrigatorio: true, ajuda: 'Os pavimentos são criados de 1 até este número.' },
            { nome: 'meta_ciclo_dias', rotulo: 'Meta de ciclo (dias)', tipo: 'numero' },
            { nome: 'meta_lajes_mes', rotulo: 'Meta de lajes por mês', tipo: 'numero' },
          ]}
          aoSalvar={(v) => salvarTorre({ ...v, fase_id: folha.fase.id })} aoFechar={fecharCadastro} />
      )}
      {folha?.tipo === 'servico' && (
        <Formulario titulo="Novo serviço"
          campos={[
            { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
            { nome: 'unidade', rotulo: 'Unidade', tipo: 'texto', obrigatorio: true, ajuda: 'm², m³, kg, un, vb.' },
          ]}
          aoSalvar={salvarServico} aoFechar={fecharCadastro} />
      )}
      {folha?.tipo === 'empreiteiro' && (
        <Formulario titulo="Novo empreiteiro"
          campos={[
            { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
            { nome: 'cnpj', rotulo: 'CNPJ', tipo: 'texto' },
          ]}
          aoSalvar={salvarEmpreiteiro} aoFechar={fecharCadastro} />
      )}
    </div>
  )
}
