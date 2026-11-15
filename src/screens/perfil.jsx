import { useObra } from '../lib/ObraContext.jsx'
import { PERFIS } from '../lib/perfis.js'
import { Cartao, Tag } from '../components/index.jsx'

export function Perfil({ profile, aoSair }) {
  const { obras } = useObra()

  return (
    <div className="corpo">
      <Cartao rotulo="Meu perfil">
        <div className="lin"><span className="tx"><span className="t2">Nome</span><span className="t1">{profile.nome}</span></span></div>
        <div className="lin"><span className="tx"><span className="t2">E-mail</span><span className="t1">{profile.email}</span></span></div>
        <div className="lin"><span className="tx"><span className="t2">Perfil</span></span><Tag tom="info">{PERFIS[profile.role]}</Tag></div>
        <div className="lin"><span className="tx"><span className="t2">Obras</span><span className="t1">{obras.map((o) => `${o.codigo} ${o.nome}`).join(' · ')}</span></span></div>
      </Cartao>
      <button className="btn sec" onClick={aoSair}>Sair</button>
    </div>
  )
}
