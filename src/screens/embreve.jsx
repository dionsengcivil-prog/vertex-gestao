import { TELAS } from '../lib/perfis.js'
import { Vazio } from '../components/index.jsx'

// Telas da Onda 2 (notas, estoque, financeiro, solicitações, resumos):
// já estão no menu, mas ainda não foram construídas.
export function EmBreve({ tela }) {
  return (
    <div className="corpo">
      <Vazio icone={TELAS[tela].icone} titulo={`${TELAS[tela].nome} chega na Onda 2`}
        texto="Esta tela já está no plano do sistema e entra depois que a Onda 1 estiver em uso no canteiro." />
    </div>
  )
}
