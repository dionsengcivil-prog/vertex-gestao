import { useState } from 'react'
import { listarUsuarios, salvarUsuario } from '../lib/dados.js'
import { useDados } from '../lib/useDados.js'
import { PERFIS } from '../lib/perfis.js'
import { Cartao, Estado, Formulario, Tag } from '../components/index.jsx'

// Os perfis que o gerente pode dar ("Aguardando liberação" não se escolhe).
const PERFIS_PARA_ESCOLHER = Object.entries(PERFIS).filter(([id]) => id !== 'pendente').map(([id, nome]) => ({ id, nome }))
const SIM_NAO = [{ id: 'sim', nome: 'Sim' }, { id: 'nao', nome: 'Não (não consegue entrar)' }]

// Quem tem conta, com qual perfil e em quais obras. Só o gerente chega aqui.
export function Usuarios() {
  const [pessoa, setPessoa] = useState(null)
  const { data, erro, carregando, recarregar } = useDados(listarUsuarios)

  if (carregando || erro) return <div className="corpo"><Estado carregando={carregando} erro={erro} /></div>

  // Quem aguarda liberação aparece primeiro.
  const pessoas = [...data.pessoas].sort((a, b) => (a.role === 'pendente' ? -1 : 0) - (b.role === 'pendente' ? -1 : 0))
  const codigos = (ids) => data.obras.filter((o) => ids.includes(o.id)).map((o) => o.codigo).join(', ')

  return (
    <div className="corpo">
      <Cartao rotulo={`Pessoas · ${pessoas.length}`}>
        {pessoas.length === 0 && <div className="linha-vazia">Ninguém se cadastrou ainda.</div>}
        {pessoas.map((p) => {
          const pendente = p.role === 'pendente'
          return (
            <div key={p.id} className={`lin ${pendente ? 'alerta' : ''}`}>
              <span className="tx">
                <span className="t1">{p.nome}</span>
                <span className="t2">{p.email} · {codigos(p.obra_ids) || 'sem obra'}{p.ativo ? '' : ' · desativado'}</span>
              </span>
              <span className="botoes">
                {!pendente && <Tag>{PERFIS[p.role]}</Tag>}
                <button className={`mini ${pendente ? 'ok' : ''}`} onClick={() => setPessoa(p)}>{pendente ? 'Liberar' : 'Editar'}</button>
              </span>
            </div>
          )
        })}
      </Cartao>

      {pessoa && (
        <Formulario titulo={`${pessoa.role === 'pendente' ? 'Liberar' : 'Editar'} · ${pessoa.nome}`}
          inicial={{ role: pessoa.role === 'pendente' ? '' : pessoa.role, obra_ids: pessoa.obra_ids, ativo: pessoa.ativo ? 'sim' : 'nao' }}
          campos={[
            { nome: 'role', rotulo: 'Perfil', tipo: 'lista', opcoes: PERFIS_PARA_ESCOLHER, obrigatorio: true },
            { nome: 'obra_ids', rotulo: 'Obras em que trabalha', tipo: 'marcar', opcoes: data.obras.map((o) => ({ id: o.id, nome: `${o.codigo} · ${o.nome}` })), obrigatorio: true },
            { nome: 'ativo', rotulo: 'Pode entrar no sistema', tipo: 'lista', opcoes: SIM_NAO, obrigatorio: true },
          ]}
          aoSalvar={(v) => salvarUsuario(pessoa.id, { role: v.role, obra_ids: v.obra_ids, ativo: v.ativo === 'sim' })}
          aoFechar={() => { setPessoa(null); recarregar() }} />
      )}
    </div>
  )
}
