import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// ---------- Ícones (SVG, nunca emoji) ----------
const DESENHOS = {
  painel: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  avanco: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  programacao: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  medicao: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  diario: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M9 8h6M9 12h6" /></>,
  estrutura: <><path d="M4 21V6l8-3v18M12 9l8 3v9M2 21h20" /><path d="M8 9v.01M8 13v.01M8 17v.01M16 15v.01M16 18v.01" /></>,
  usuarios: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
  perfil: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  notas: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  estoque: <><path d="M3 8l9-5 9 5v8l-9 5-9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
  financeiro: <><circle cx="12" cy="12" r="9" /><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2" /></>,
  orcamento: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
  solicitacoes: <><path d="M2 17h3l2-6h8l3 3h4v3h-2" /><circle cx="8" cy="18" r="2" /><circle cx="18" cy="18" r="2" /><path d="M10 18h6M9 11V6h4" /></>,
  mais: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
  voltar: <path d="M15 5l-7 7 7 7" />,
  seta: <path d="M9 5l7 7-7 7" />,
  foto: <><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M8 6l1.5-2h5L16 6" /></>,
  relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  certo: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alerta: <><path d="M12 3.5L2.5 20h19z" /><path d="M12 10v4.5M12 17.5v.01" /></>,
}

export function Icon({ nome }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{DESENHOS[nome] || DESENHOS.mais}</svg>
}

// ---------- Marca ----------
// Mostra a logomarca se houver um arquivo `logo.svg` ou `logo.png` na pasta
// `public/`. Sem arquivo (ou se ele não abrir), cai no nome escrito.
const ARQUIVOS_DA_LOGO = ['/logo.svg', '/logo.png']

export function Marca() {
  const [tentativa, setTentativa] = useState(0)
  if (tentativa >= ARQUIVOS_DA_LOGO.length) return <><span className="selo" />VERTEX - Gestão de Obras</>
  return <img className="logo" src={ARQUIVOS_DA_LOGO[tentativa]} alt="VERTEX - Gestão de Obras" onError={() => setTentativa(tentativa + 1)} />
}

// ---------- Peças ----------

// tom: '' (neutro), 'ok' (verde), 'warn' (âmbar), 'bad' (vermelho), 'info'.
// Verde, âmbar e vermelho levam um ícone junto: o status não pode depender só
// da cor, que some no sol e para quem não distingue verde de vermelho.
const ICONE_DO_TOM = { ok: 'certo', warn: 'relogio', bad: 'alerta' }

export function Tag({ tom = '', children }) {
  return <span className={`tag ${tom}`}>{ICONE_DO_TOM[tom] && <Icon nome={ICONE_DO_TOM[tom]} />}{children}</span>
}

export function Cartao({ rotulo, lado, children }) {
  return (
    <div className="card">
      {(rotulo || lado) && <div className="card-h"><span className="rot">{rotulo}</span>{lado}</div>}
      {children}
    </div>
  )
}

export function Kpi({ rotulo, numero, sufixo, sub, tom = '', subRuim = false, aoClicar }) {
  const conteudo = (
    <>
      <span className="rot">{rotulo}</span>
      <span className="num">{numero}{sufixo && <small> {sufixo}</small>}</span>
      <span className={`sub ${subRuim ? 'bad' : ''}`}>{sub}</span>
    </>
  )
  return aoClicar
    ? <button className={`kpi ${tom}`} onClick={aoClicar}>{conteudo}</button>
    : <div className={`kpi ${tom}`}>{conteudo}</div>
}

export function Barra({ percentual, tom = '' }) {
  return <span className="barra"><i className={tom} style={{ width: `${Math.max(0, Math.min(100, percentual))}%` }} /></span>
}

export function Titulo({ texto, aoVoltar, children }) {
  return (
    <div className="titulo">
      {aoVoltar && <button className="voltar" onClick={aoVoltar} aria-label="Voltar"><Icon nome="voltar" /></button>}
      <h1>{texto}</h1>
      {children}
    </div>
  )
}

export function Chips({ opcoes, valor, aoMudar }) {
  return (
    <div className="chips">
      {opcoes.map((o) => (
        <button key={o.id} className={`chip ${o.id === valor ? 'on' : ''}`} onClick={() => aoMudar(o.id)}>{o.nome}</button>
      ))}
    </div>
  )
}

export function Vazio({ icone = 'programacao', titulo, texto, acao, aoAgir }) {
  return (
    <div className="card vazio">
      <div className="ic"><Icon nome={icone} /></div>
      <h2>{titulo}</h2>
      {texto && <p>{texto}</p>}
      {acao && <button className="btn pri" onClick={aoAgir}>{acao}</button>}
    </div>
  )
}

// Os três estados de toda tela que busca dado: carregando, erro, e o conteúdo.
export function Estado({ carregando, erro, children }) {
  if (carregando) return <div className="estado">Carregando…</div>
  if (erro) return <div className="estado erro">{erro}</div>
  return children
}

// ---------- Aviso rápido no pé da tela ----------
const AvisoContext = createContext(() => {})

export function AvisoProvider({ children }) {
  const [texto, setTexto] = useState(null)
  const avisar = useCallback((t) => setTexto(t), [])

  useEffect(() => {
    if (!texto) return undefined
    const relogio = setTimeout(() => setTexto(null), 2600)
    return () => clearTimeout(relogio)
  }, [texto])

  return (
    <AvisoContext.Provider value={avisar}>
      {children}
      {texto && <div className="toast" role="status">{texto}</div>}
    </AvisoContext.Provider>
  )
}

export function useAviso() {
  return useContext(AvisoContext)
}

// ---------- Formulário em folha (sobe do pé da tela no celular) ----------
// campos: [{ nome, rotulo, tipo, opcoes, obrigatorio, se, ajuda }]
//   tipo: 'texto' | 'longo' | 'numero' | 'data' | 'lista' | 'marcar' | 'foto'
//   opcoes: [{ id, nome }] ou uma função (valores) => lista, para lista que
//           depende de outro campo (ex.: pavimentos da torre escolhida)
//   se: (valores) => bool — o campo só aparece (e só é exigido) quando verdadeiro
// aoSalvar(valores) devolve uma promessa de { erro }. Com erro, a folha fica
// aberta e mostra o texto; sem erro, fecha.
export function Formulario({ titulo, campos, inicial = {}, rotuloSalvar = 'Salvar', aoSalvar, aoFechar }) {
  const [valores, setValores] = useState(inicial)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const visiveis = campos.filter((c) => !c.se || c.se(valores))
  const mudar = (nome, valor) => setValores((v) => ({ ...v, [nome]: valor }))
  const faltando = (c) => {
    const v = valores[c.nome]
    return c.obrigatorio && (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0))
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    if (salvando) return
    const novos = Object.fromEntries(visiveis.filter(faltando).map((c) => [c.nome, 'Preencha este campo.']))
    setErros(novos)
    if (Object.keys(novos).length) return
    setSalvando(true)
    setErroGeral(null)
    // Só os campos visíveis vão para a gravação; os escondidos vão vazios.
    const limpos = Object.fromEntries(campos.map((c) => [c.nome, visiveis.includes(c) ? valores[c.nome] ?? '' : '']))
    const { erro } = await aoSalvar({ ...valores, ...limpos })
    setSalvando(false)
    if (erro) setErroGeral(erro)
    else aoFechar()
  }

  const entrada = (c) => {
    const id = `campo-${c.nome}`
    const valor = valores[c.nome] ?? ''
    const opcoes = typeof c.opcoes === 'function' ? c.opcoes(valores) : c.opcoes || []
    if (c.tipo === 'lista') {
      return (
        <select id={id} value={valor} onChange={(e) => mudar(c.nome, e.target.value)}>
          <option value="">{c.obrigatorio ? 'Escolha…' : '— nenhum —'}</option>
          {opcoes.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
      )
    }
    if (c.tipo === 'marcar') {
      const marcados = valores[c.nome] || []
      return (
        <div className="marcar">
          {opcoes.map((o) => (
            <label key={o.id}>
              <input type="checkbox" checked={marcados.includes(o.id)}
                onChange={(e) => mudar(c.nome, e.target.checked ? [...marcados, o.id] : marcados.filter((m) => m !== o.id))} />
              {o.nome}
            </label>
          ))}
        </div>
      )
    }
    if (c.tipo === 'foto') {
      return (
        <input id={id} type="file" accept="image/*" capture="environment"
          onChange={(e) => mudar(c.nome, e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : '')} />
      )
    }
    if (c.tipo === 'longo') return <textarea id={id} rows={3} value={valor} onChange={(e) => mudar(c.nome, e.target.value)} />
    const tipo = { numero: 'number', data: 'date' }[c.tipo] || 'text'
    return <input id={id} type={tipo} step={c.tipo === 'numero' ? 'any' : undefined} inputMode={c.tipo === 'numero' ? 'decimal' : undefined}
      value={valor} onChange={(e) => mudar(c.nome, e.target.value)} />
  }

  return (
    <div className="fundo-folha" onClick={(e) => { if (e.target === e.currentTarget && !salvando) aoFechar() }}>
      <form className="folha" onSubmit={enviar} noValidate>
        <h2>{titulo}</h2>
        {visiveis.map((c) => (
          <div key={c.nome} className={`campo ${erros[c.nome] ? 'com-erro' : ''}`}>
            <label htmlFor={`campo-${c.nome}`}>{c.rotulo}{c.obrigatorio ? '' : ' (opcional)'}</label>
            {entrada(c)}
            {c.ajuda && <small>{c.ajuda}</small>}
            {erros[c.nome] && <small className="erro">{erros[c.nome]}</small>}
          </div>
        ))}
        {erroGeral && <div className="estado erro" role="alert">{erroGeral}</div>}
        <div className="acoes">
          <button type="button" className="btn sec" onClick={aoFechar} disabled={salvando}>Cancelar</button>
          <button type="submit" className="btn pri" disabled={salvando}>{salvando ? 'Salvando…' : rotuloSalvar}</button>
        </div>
      </form>
    </div>
  )
}

// Para ações de um toque (conferir, aprovar, remover): roda a gravação, mostra
// o erro se houver, e chama `depois` quando dá certo.
export function useAcao(depois) {
  const avisar = useAviso()
  return async (gravar, textoDeSucesso) => {
    const { erro } = await gravar()
    if (erro) { avisar(erro); return }
    if (textoDeSucesso) avisar(textoDeSucesso)
    depois()
  }
}

export const CONFIRMAR_EXCLUSAO = 'Excluir este registro? Não dá para desfazer.'
export const EXPORTAR_DEPOIS = 'Exportar para Excel entra numa próxima etapa.'
