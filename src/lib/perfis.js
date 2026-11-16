// Perfis, menus e o que cada perfil pode. Um dono só para essas listas:
// o valor gravado (`role`) é idêntico ao CHECK de `profiles.role` no PRD-BACKEND.

export const PERFIS = {
  gerente: 'Gerente de obras',
  planejador: 'Engenheiro planejador',
  assistente: 'Assistente de engenharia',
  administrativo: 'Administrativo',
  almoxarife: 'Almoxarife',
  mestre: 'Mestre / encarregado',
  diretoria: 'Diretoria',
  cliente: 'Cliente',
  pendente: 'Aguardando liberação',
}

// Todas as telas de menu. `onda: 2` = ainda não construída (aparece como "em breve").
export const TELAS = {
  painel: { nome: 'Painel', icone: 'painel' },
  avanco: { nome: 'Avanço', icone: 'avanco' },
  programacao: { nome: 'Programação', curto: 'Program.', icone: 'programacao' },
  medicao: { nome: 'Medição', icone: 'medicao' },
  diario: { nome: 'Diário', icone: 'diario' },
  estrutura: { nome: 'Estrutura', icone: 'estrutura' },
  usuarios: { nome: 'Usuários', icone: 'usuarios' },
  perfil: { nome: 'Meu perfil', curto: 'Perfil', icone: 'perfil' },
  notas: { nome: 'Notas', icone: 'notas' },
  estoque: { nome: 'Estoque', icone: 'estoque', onda: 2 },
  financeiro: { nome: 'Financeiro', curto: 'Financ.', icone: 'financeiro', onda: 2 },
  orcamento: { nome: 'Orçamento', icone: 'orcamento', onda: 2 },
  solicitacoes: { nome: 'Solicitações', curto: 'Solicit.', icone: 'solicitacoes', onda: 2 },
  resumo: { nome: 'Resumo por torre', curto: 'Resumo', icone: 'painel', onda: 2 },
  resumocliente: { nome: 'Resumo do cliente', curto: 'Resumo', icone: 'painel', onda: 2 },
}

// A primeira tela da lista é a tela inicial do perfil.
const MENUS = {
  gerente: ['painel', 'avanco', 'programacao', 'medicao', 'diario', 'notas', 'estoque', 'financeiro', 'orcamento', 'solicitacoes', 'estrutura', 'usuarios', 'perfil'],
  planejador: ['painel', 'avanco', 'programacao', 'medicao', 'diario', 'notas', 'estoque', 'financeiro', 'solicitacoes', 'perfil'],
  assistente: ['avanco', 'diario', 'programacao', 'estoque', 'perfil'],
  administrativo: ['notas', 'financeiro', 'perfil'],
  almoxarife: ['notas', 'estoque', 'perfil'],
  mestre: ['diario', 'solicitacoes', 'avanco', 'perfil'],
  diretoria: ['resumo', 'perfil'],
  cliente: ['resumocliente', 'perfil'],
}

export function menuDoPerfil(role) {
  return MENUS[role] || []
}

export function telaInicial(role) {
  return menuDoPerfil(role)[0] || 'perfil'
}

// Barra inferior do celular: no máximo 5 itens. Se o perfil tem mais telas,
// as 4 primeiras ficam na barra e o quinto item é "Mais".
export function barraInferior(role) {
  const menu = menuDoPerfil(role)
  if (menu.length <= 5) return { itens: menu, extras: [] }
  return { itens: menu.slice(0, 4), extras: menu.slice(4) }
}

export function podeAcessar(role, tela) {
  return menuDoPerfil(role).includes(tela)
}

const em = (...roles) => (role) => roles.includes(role)

// A matriz de permissões do PLANO-DO-PROJETO, em funções.
export const pode = {
  verValores: em('gerente', 'planejador', 'diretoria'),
  lancarAvanco: em('gerente', 'planejador', 'assistente'),
  conferirAvanco: em('gerente', 'planejador'),
  editarDatasPrevistas: em('gerente', 'planejador'),
  lancarDiario: em('gerente', 'planejador', 'mestre'),
  revisarDiario: em('gerente', 'planejador', 'assistente'),
  publicarFoto: em('gerente', 'planejador'),
  programarSemana: em('gerente', 'planejador'),
  criarRestricao: em('gerente', 'planejador', 'assistente'),
  removerRestricao: em('gerente', 'planejador'),
  prepararMedicao: em('gerente', 'planejador'),
  aprovarMedicao: em('gerente'),
  // Notas: quem lança não confere, e quem confere não valida.
  lancarNota: em('gerente', 'administrativo', 'almoxarife'),
  conferirNota: em('almoxarife'),
  validarNota: em('gerente', 'administrativo'),
  verNotas: em('gerente', 'planejador', 'administrativo', 'almoxarife'),
  alterarEstrutura: em('gerente'),
  gerenciarUsuarios: em('gerente'),
}
