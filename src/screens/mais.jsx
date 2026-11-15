import { TELAS } from '../lib/perfis.js'
import { Cartao, Icon, Tag } from '../components/index.jsx'

// No celular, as telas que não cabem na barra inferior.
export function Mais({ itens, goto }) {
  return (
    <div className="corpo">
      <Cartao rotulo="Mais telas">
        {itens.map((tela) => (
          <button key={tela} className="item-mais" onClick={() => goto(tela)}>
            <Icon nome={TELAS[tela].icone} />
            {TELAS[tela].nome}
            {TELAS[tela].onda === 2 && <Tag>Em breve</Tag>}
          </button>
        ))}
      </Cartao>
    </div>
  )
}
