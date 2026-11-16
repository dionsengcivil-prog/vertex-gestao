import { useState } from 'react'
import { useObra } from '../lib/ObraContext.jsx'
import { PERFIS, TELAS, barraInferior, menuDoPerfil, podeAcessar, telaInicial } from '../lib/perfis.js'
import { dataBR } from '../lib/datas.js'
import { tomDaSituacao } from '../lib/formato.js'
import { Estado, Icon, Marca, Tag } from '../components/index.jsx'
import Aguardando from './Aguardando.jsx'
import { Painel } from '../screens/painel.jsx'
import { Avanco } from '../screens/avanco.jsx'
import { Pavimento } from '../screens/pavimento.jsx'
import { Programacao } from '../screens/programacao.jsx'
import { Diario } from '../screens/diario.jsx'
import { DiarioDia } from '../screens/diarioDia.jsx'
import { Medicao } from '../screens/medicao.jsx'
import { Contrato } from '../screens/contrato.jsx'
import { MedicaoDetalhe } from '../screens/medicaoDetalhe.jsx'
import { Estrutura } from '../screens/estrutura.jsx'
import { Usuarios } from '../screens/usuarios.jsx'
import { Perfil } from '../screens/perfil.jsx'
import { Notas } from '../screens/notas.jsx'
import { Nota } from '../screens/nota.jsx'
import { Mais } from '../screens/mais.jsx'
import { EmBreve } from '../screens/embreve.jsx'

// Uma shell só para os oito perfis: o que muda entre eles é o menu, que vem de
// lib/perfis.js. Telas de detalhe pertencem a um item de menu (o "pai").
const PAI = { pavimento: 'avanco', diarioDia: 'diario', contrato: 'medicao', medicaoDetalhe: 'medicao', nota: 'notas' }

function SeletorDeObra() {
  const { obras, obra, trocarObra } = useObra()
  const [aberto, setAberto] = useState(false)
  const temLista = obras.length > 1

  return (
    <header className="topo">
      <div className="topo-linha">
        <span className="simbolo so-cel" role="img" aria-label="Vertex" />
        <div className="obra">
          <b>{obra.nome}</b>
          <small>{obra.codigo} · {obra.cliente}</small>
        </div>
        {temLista && (
          <button className="btn-topo" aria-label="Trocar obra" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
            Trocar ▾
          </button>
        )}
      </div>
      {aberto && (
        <div className="menu-obra">
          <span className="rot">Suas obras · {obras.length}</span>
          {obras.map((o) => (
            <button key={o.id} className={`op-obra ${o.id === obra.id ? 'on' : ''}`} onClick={() => { setAberto(false); trocarObra(o.id) }}>
              <span className="cod">{o.codigo}</span>
              <span className="tx">
                <b>{o.nome}</b>
                <small>{o.cliente} · {o.endereco}</small>
                <small>Início {dataBR(o.data_inicio, true)} · meta {dataBR(o.data_meta_entrega, true)}</small>
              </span>
              <Tag tom={tomDaSituacao(o.situacao)}>{o.situacao}</Tag>
            </button>
          ))}
        </div>
      )}
    </header>
  )
}

// As telas da obra em uso. É remontada inteira (key) quando a obra muda, então
// nenhuma lista ou filtro da obra anterior sobrevive à troca.
function Telas({ profile, aoSair }) {
  const role = profile.role
  const [rota, setRota] = useState({ tela: telaInicial(role), params: {} })
  const goto = (tela, params = {}) => { setRota({ tela, params }); window.scrollTo(0, 0) }

  const itemAtivo = PAI[rota.tela] || rota.tela
  const barra = barraInferior(role)
  const naBarra = barra.itens.includes(itemAtivo) ? itemAtivo : 'mais'

  const props = { goto, params: rota.params, profile }
  let corpo
  if (rota.tela !== 'mais' && !podeAcessar(role, itemAtivo)) {
    corpo = <div className="corpo"><div className="estado erro">Seu perfil não tem acesso a esta área.</div></div>
  } else if (TELAS[rota.tela]?.onda === 2) {
    corpo = <EmBreve tela={rota.tela} />
  } else {
    switch (rota.tela) {
      case 'painel': corpo = <Painel {...props} />; break
      case 'avanco': corpo = <Avanco {...props} />; break
      case 'pavimento': corpo = <Pavimento {...props} />; break
      case 'programacao': corpo = <Programacao {...props} />; break
      case 'diario': corpo = <Diario {...props} />; break
      case 'diarioDia': corpo = <DiarioDia {...props} />; break
      case 'medicao': corpo = <Medicao {...props} />; break
      case 'contrato': corpo = <Contrato {...props} />; break
      case 'medicaoDetalhe': corpo = <MedicaoDetalhe {...props} />; break
      case 'notas': corpo = <Notas {...props} />; break
      case 'nota': corpo = <Nota {...props} />; break
      case 'estrutura': corpo = <Estrutura {...props} />; break
      case 'usuarios': corpo = <Usuarios {...props} />; break
      case 'mais': corpo = <Mais itens={barra.extras} goto={goto} />; break
      default: corpo = <Perfil {...props} aoSair={aoSair} />
    }
  }

  const botao = (tela, curto) => (
    <button key={tela} className={(curto ? naBarra : itemAtivo) === tela ? 'on' : ''} onClick={() => goto(tela)}>
      <Icon nome={tela === 'mais' ? 'mais' : TELAS[tela].icone} />
      <span>{tela === 'mais' ? 'Mais' : (curto && TELAS[tela].curto) || TELAS[tela].nome}</span>
    </button>
  )

  return (
    <>
      <aside className="side">
        <div className="marca"><Marca /></div>
        <nav>{menuDoPerfil(role).map((tela) => botao(tela, false))}</nav>
        <div className="quem"><b>{profile.nome}</b>{PERFIS[role]}</div>
      </aside>
      <div className="main">
        <SeletorDeObra />
        {corpo}
      </div>
      <nav className="nav-inf">
        {barra.itens.map((tela) => botao(tela, true))}
        {barra.extras.length > 0 && botao('mais', true)}
      </nav>
    </>
  )
}

export default function AppShell({ profile, aoSair }) {
  const { obraId, obra, carregando, erro } = useObra()

  if (!carregando && !erro && !obra) return <Aguardando aoSair={aoSair} />

  return (
    <div className="app">
      <Estado carregando={carregando} erro={erro}>
        <Telas key={obraId} profile={profile} aoSair={aoSair} />
      </Estado>
    </div>
  )
}
