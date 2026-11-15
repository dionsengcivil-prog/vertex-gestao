import { useState } from 'react'
import {
  adicionarEfetivo, adicionarFoto, adicionarServicoDoDia, alternarPublicacaoDaFoto, carregarDiario,
  mudarStatusDoDiario, removerDoDiario, salvarDiario,
} from '../lib/dados.js'
import { useObra } from '../lib/ObraContext.jsx'
import { useDados } from '../lib/useDados.js'
import { diarioEditavel } from '../lib/fluxos.js'
import { pode } from '../lib/perfis.js'
import { dataBR } from '../lib/datas.js'
import { Cartao, Estado, Formulario, Icon, Tag, Titulo, useAcao } from '../components/index.jsx'
import { tomDoDiario } from './diario.jsx'

const CLIMAS = ['Sol', 'Nublado', 'Chuva fraca', 'Chuva forte'].map((c) => ({ id: c, nome: c }))

// O diário de um dia: clima, efetivo, serviços, fotos e ocorrências.
export function DiarioDia({ goto, params, profile }) {
  const { base, nome, local } = useObra()
  const [folha, setFolha] = useState(null)
  const { data, erro, carregando, recarregar } = useDados(() => carregarDiario(params.diarioId), [params.diarioId])
  const agir = useAcao(recarregar)
  const role = profile.role

  if (carregando || erro) return <div className="corpo"><Estado carregando={carregando} erro={erro} /></div>

  const { diario, efetivos, servicos, fotos } = data
  const total = efetivos.reduce((s, e) => s + e.quantidade, 0)
  const editando = diarioEditavel(diario) && pode.lancarDiario(role)
  const fechar = () => { setFolha(null); recarregar() }
  const tirar = (tabela, id) => <button className="mini bad" aria-label="Remover" onClick={() => agir(() => removerDoDiario(diario.id, tabela, id))}>×</button>
  const mais = (tipo) => editando && <button className="link" onClick={() => setFolha(tipo)}>+ Adicionar</button>

  const pavimentosDaTorre = (v) => base.pavimentos.filter((p) => p.torre_id === v.torre_id).sort((a, b) => b.ordem - a.ordem)
  const campos = {
    clima: [
      { nome: 'clima_manha', rotulo: 'Clima da manhã', tipo: 'lista', opcoes: CLIMAS, obrigatorio: true },
      { nome: 'clima_tarde', rotulo: 'Clima da tarde', tipo: 'lista', opcoes: CLIMAS, obrigatorio: true },
      { nome: 'ocorrencias', rotulo: 'Ocorrências', tipo: 'longo' },
    ],
    efetivo: [
      { nome: 'empreiteiro_id', rotulo: 'Empreiteiro', tipo: 'lista', opcoes: base.empreiteiros, obrigatorio: true },
      { nome: 'torre_id', rotulo: 'Torre', tipo: 'lista', opcoes: base.torres, obrigatorio: true },
      { nome: 'quantidade', rotulo: 'Quantas pessoas', tipo: 'numero', obrigatorio: true },
    ],
    servico: [
      { nome: 'torre_id', rotulo: 'Torre', tipo: 'lista', opcoes: base.torres, obrigatorio: true },
      { nome: 'pavimento_id', rotulo: 'Pavimento', tipo: 'lista', opcoes: pavimentosDaTorre },
      { nome: 'servico_id', rotulo: 'Serviço', tipo: 'lista', opcoes: base.servicos, obrigatorio: true },
      { nome: 'empreiteiro_id', rotulo: 'Empreiteiro', tipo: 'lista', opcoes: base.empreiteiros },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'texto' },
    ],
    foto: [
      { nome: 'url', rotulo: 'Foto', tipo: 'foto', ajuda: 'No celular abre a câmera. Por enquanto a foto fica só neste aparelho, até recarregar.' },
      { nome: 'torre_id', rotulo: 'Torre', tipo: 'lista', opcoes: base.torres, obrigatorio: true },
      { nome: 'pavimento_id', rotulo: 'Pavimento', tipo: 'lista', opcoes: pavimentosDaTorre },
      { nome: 'servico_id', rotulo: 'Serviço', tipo: 'lista', opcoes: base.servicos },
      { nome: 'legenda', rotulo: 'Legenda', tipo: 'texto' },
    ],
  }
  const gravar = {
    clima: (v) => salvarDiario(diario.id, v),
    efetivo: (v) => adicionarEfetivo(diario.id, v),
    servico: (v) => adicionarServicoDoDia(diario.id, v),
    foto: (v) => adicionarFoto(diario.id, v),
  }
  const titulos = { clima: 'Clima e ocorrências', efetivo: 'Efetivo', servico: 'Serviço do dia', foto: 'Nova foto' }

  return (
    <div className="corpo">
      <Titulo texto={`Diário de ${dataBR(diario.data, true)}`} aoVoltar={() => goto('diario')}>
        <Tag tom={tomDoDiario(diario.status)}>{diario.status}</Tag>
      </Titulo>

      <Cartao rotulo="Clima" lado={editando && <button className="link" onClick={() => setFolha('clima')}>Editar</button>}>
        <div className="card-b">
          <div className="datas" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="data"><span className="rot">Manhã</span><b>{diario.clima_manha}</b></div>
            <div className="data"><span className="rot">Tarde</span><b>{diario.clima_tarde}</b></div>
          </div>
        </div>
      </Cartao>

      <div className="duas">
        <Cartao rotulo={`Efetivo · ${total}`} lado={mais('efetivo')}>
          {efetivos.length === 0 && <div className="linha-vazia">Adicione o efetivo de cada empreiteiro.</div>}
          {efetivos.map((e) => (
            <div key={e.id} className="lin">
              <span className="tx"><span className="t1">{nome('empreiteiro', e.empreiteiro_id)}</span><span className="t2">{nome('torre', e.torre_id)}</span></span>
              <span className="botoes"><span className="val">{e.quantidade}</span>{editando && tirar('diario_efetivos', e.id)}</span>
            </div>
          ))}
        </Cartao>

        <Cartao rotulo="Serviços do dia" lado={mais('servico')}>
          {servicos.length === 0 && <div className="linha-vazia">Nenhum serviço registrado neste dia.</div>}
          {servicos.map((s) => (
            <div key={s.id} className="lin">
              <span className="tx">
                <span className="t1">{local(s.torre_id, s.pavimento_id)} · {nome('servico', s.servico_id)}</span>
                <span className="t2">{nome('empreiteiro', s.empreiteiro_id)}{s.descricao ? ` · ${s.descricao}` : ''}</span>
              </span>
              {editando && tirar('diario_servicos', s.id)}
            </div>
          ))}
        </Cartao>
      </div>

      <Cartao rotulo={`Fotos · ${fotos.length}`} lado={mais('foto')}>
        <div className="card-b">
          {fotos.length === 0 && <div className="estado">Nenhuma foto neste diário.</div>}
          <div className="fotos">
            {fotos.map((f) => (
              <div key={f.id} className="foto">
                {f.url && <img src={f.url} alt={f.legenda || 'Foto do diário'} />}
                {f.publicada && <Tag tom="info">Publicada</Tag>}
                {!f.url && <span><Icon nome="foto" /><br />{local(f.torre_id, f.pavimento_id)}<br />{f.legenda}</span>}
                {pode.publicarFoto(role) && (
                  <button className="mini" onClick={() => agir(() => alternarPublicacaoDaFoto(f.id))}>{f.publicada ? 'Despublicar' : 'Publicar'}</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Cartao>

      <Cartao rotulo="Ocorrências" lado={editando && <button className="link" onClick={() => setFolha('clima')}>Editar</button>}>
        <div className="linha-vazia" style={{ color: diario.ocorrencias ? 'var(--ink)' : undefined }}>
          {diario.ocorrencias || 'Nenhuma ocorrência registrada.'}
        </div>
      </Cartao>

      <div className="acoes">
        {editando && (
          <button className="btn pri" onClick={() => agir(() => mudarStatusDoDiario(diario.id, 'enviar'), 'Diário enviado para revisão.')}>Enviar</button>
        )}
        {diario.status === 'Enviado' && pode.revisarDiario(role) && (
          <>
            <button className="btn bad" onClick={() => agir(() => mudarStatusDoDiario(diario.id, 'devolver'), 'Diário devolvido para rascunho.')}>Devolver</button>
            <button className="btn ok" onClick={() => agir(() => mudarStatusDoDiario(diario.id, 'revisar'), 'Diário revisado e travado.')}>Revisar</button>
          </>
        )}
      </div>

      {folha && (
        <Formulario titulo={titulos[folha]} campos={campos[folha]} inicial={folha === 'clima' ? diario : {}}
          rotuloSalvar={folha === 'clima' ? 'Salvar' : 'Adicionar'} aoSalvar={gravar[folha]} aoFechar={fechar} />
      )}
    </div>
  )
}
