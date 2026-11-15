import { listarUsuariosDeExemplo } from '../lib/dados.js'
import { PERFIS } from '../lib/perfis.js'
import { useDados } from '../lib/useDados.js'
import { Estado, Icon, Marca } from '../components/index.jsx'

// Entrada de mentira: escolhe-se com qual perfil de exemplo entrar, para ver o
// que cada um enxerga. O login com e-mail e senha vem na etapa do banco.
export default function Login({ aoEntrar }) {
  const { data, erro, carregando } = useDados(listarUsuariosDeExemplo)

  return (
    <div className="entrada">
      <div className="card">
        <h1><Marca /></h1>
        <p>Dados de exemplo. Escolha com qual perfil quer entrar para ver o que cada um enxerga.</p>
        <Estado carregando={carregando} erro={erro}>
          {(data || []).map((pessoa) => (
            <button key={pessoa.id} className="item-mais" onClick={() => aoEntrar(pessoa)}>
              <Icon nome="perfil" />
              <span className="tx">
                <span className="t1">{PERFIS[pessoa.role]}</span>
                <span className="t2">{pessoa.email}</span>
              </span>
              <Icon nome="seta" />
            </button>
          ))}
        </Estado>
      </div>
    </div>
  )
}
