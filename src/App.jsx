import { useEffect, useState } from 'react'
import { buscarPerfil, definirUsuarioAtual } from './lib/dados.js'
import { ObraProvider } from './lib/ObraContext.jsx'
import { AvisoProvider } from './components/index.jsx'
import Login from './pages/Login.jsx'
import Aguardando from './pages/Aguardando.jsx'
import AppShell from './pages/AppShell.jsx'

// Quem entrou fica guardado só nesta aba. É a entrada de mentira da Fundação:
// na etapa do banco, isto passa a ser o login de verdade do Supabase.
const CHAVE = 'vertex-usuario'

function lerUsuario() {
  try { return sessionStorage.getItem(CHAVE) } catch (_) { return null }
}

function guardarUsuario(id) {
  try {
    if (id) sessionStorage.setItem(CHAVE, id)
    else sessionStorage.removeItem(CHAVE)
  } catch (_) { /* sem armazenamento: só não lembra quem entrou */ }
}

export default function App() {
  const [profile, setProfile] = useState(null)
  const [conferindo, setConferindo] = useState(true)

  useEffect(() => {
    const id = lerUsuario()
    if (!id) { setConferindo(false); return }
    buscarPerfil(id).then(({ data }) => {
      // Antes do setProfile: as telas buscam dados assim que aparecem, e a
      // camada de dados precisa já saber quem está pedindo.
      definirUsuarioAtual(data)
      setProfile(data)
      setConferindo(false)
    })
  }, [])

  const entrar = (perfil) => { guardarUsuario(perfil.id); definirUsuarioAtual(perfil); setProfile(perfil) }
  const sair = () => { guardarUsuario(null); definirUsuarioAtual(null); setProfile(null) }

  if (conferindo) return <div className="estado">Carregando…</div>
  if (!profile) return <Login aoEntrar={entrar} />
  if (profile.role === 'pendente') return <Aguardando aoSair={sair} />

  return (
    <AvisoProvider>
      <ObraProvider profile={profile}>
        <AppShell profile={profile} aoSair={sair} />
      </ObraProvider>
    </AvisoProvider>
  )
}
