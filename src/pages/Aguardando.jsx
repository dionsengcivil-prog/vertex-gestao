import { Icon } from '../components/index.jsx'

// O que vê quem se cadastrou e ainda não foi liberado pelo gerente.
export default function Aguardando({ aoSair }) {
  return (
    <div className="entrada">
      <div className="card vazio">
        <div className="ic"><Icon nome="relogio" /></div>
        <h2>Conta aguardando liberação do administrador</h2>
        <p>Assim que o gerente da obra liberar o seu acesso, as telas aparecem aqui.</p>
        <button className="btn sec" onClick={aoSair}>Sair</button>
      </div>
    </div>
  )
}
