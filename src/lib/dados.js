// CAMADA DE DADOS: a única porta de entrada dos dados. Nenhuma tela lê o
// mockData nem o Supabase direto.
//
// MULTI-OBRA: a obra em uso é guardada aqui (definirObraAtual) e TODA função
// lê com `daObra`/`achar` e grava com `inserir`, que carimbam o obra_id por
// dentro. As telas nunca passam obra_id, e por isso nenhuma consegue esquecer
// o filtro nem gravar na obra errada.
//
// Hoje o miolo trabalha numa cópia dos dados de exemplo, em memória: o que se
// grava vale até recarregar a página. Na etapa do Supabase, troca-se só o
// miolo de cada função; os nomes e o formato { data, erro } não mudam.
import * as mock from './mockData.js'
import { pode } from './perfis.js'
import { valorDaMedicao } from './medicao.js'
import {
  avancoEditavel, diarioEditavel, medicaoEditavel, podeEntrarNaMedicao, transicaoDaMedicao,
  transicaoDoAvanco, transicaoDoDiario, validarAtividade, validarAvanco, validarCiclo, validarObra,
  conferirRecebimento, notaEditavel, totalDaNota, transicaoDaNota,
} from './fluxos.js'

const copiar = (lista) => lista.map((linha) => ({ ...linha }))

// As "tabelas", com os nomes do PRD-BACKEND.
const t = {
  profiles: copiar(mock.mockProfiles),
  grupos_contrato: copiar(mock.mockGrupos),
  obras: copiar(mock.mockObras),
  membros: copiar(mock.mockMembros),
  fases: copiar(mock.mockFases),
  torres: copiar(mock.mockTorres),
  pavimentos: copiar(mock.mockPavimentos),
  servicos: copiar(mock.mockServicos),
  empreiteiros: copiar(mock.mockEmpreiteiros),
  contratos: copiar(mock.mockContratos),
  contrato_itens: copiar(mock.mockContratoItens),
  medicoes: copiar(mock.mockMedicoes),
  avancos: copiar(mock.mockAvancos),
  diarios: copiar(mock.mockDiarios),
  diario_efetivos: copiar(mock.mockDiarioEfetivos),
  diario_servicos: copiar(mock.mockDiarioServicos),
  fotos: copiar(mock.mockFotos),
  atividades_semana: copiar(mock.mockAtividadesSemana),
  restricoes: copiar(mock.mockRestricoes),
  fornecedores: copiar(mock.mockFornecedores),
  insumos: copiar(mock.mockInsumos),
  notas: copiar(mock.mockNotas),
  nota_itens: copiar(mock.mockNotaItens),
}

let obraAtual = null
let usuario = null
let contador = 0

export function definirObraAtual(obraId) {
  obraAtual = obraId
}

export function definirUsuarioAtual(profile) {
  usuario = profile
}

// A data de "hoje" usada nos cálculos. Com dados de exemplo é fixa.
export function hoje() {
  return mock.HOJE_MOCK
}

const resposta = (data) => Promise.resolve({ data, erro: null })
const falha = (erro) => Promise.resolve({ data: null, erro })
const daObra = (lista) => lista.filter((linha) => linha.obra_id === obraAtual)
const achar = (lista, id) => lista.find((linha) => linha.id === id && linha.obra_id === obraAtual)
const novoId = (prefixo) => `${prefixo}-novo${++contador}`
const vazio = (v) => (v === '' || v === undefined ? null : v)

// Toda linha nova nasce com o obra_id da obra em uso.
function inserir(lista, prefixo, dados) {
  const linha = { id: novoId(prefixo), obra_id: obraAtual, ...dados }
  lista.push(linha)
  return linha
}

function remover(lista, id) {
  const posicao = lista.findIndex((linha) => linha.id === id && linha.obra_id === obraAtual)
  if (posicao >= 0) lista.splice(posicao, 1)
}

// Devolve o texto do erro se o perfil em uso não puder; nulo se puder.
function negado(permissao) {
  return usuario && permissao(usuario.role) ? null : 'Seu perfil não pode fazer isso.'
}

// ---------- Entrada e obras ----------

export function listarUsuariosDeExemplo() {
  return resposta(copiar(t.profiles))
}

export function buscarPerfil(profileId) {
  const perfil = t.profiles.find((p) => p.id === profileId)
  return perfil ? resposta({ ...perfil }) : falha('Usuário não encontrado.')
}

// Só as obras em que a pessoa está em `membros`.
export function listarObrasDoUsuario(profileId) {
  const ids = t.membros.filter((m) => m.profile_id === profileId).map((m) => m.obra_id)
  return resposta(copiar(t.obras.filter((o) => ids.includes(o.id))))
}

// O cadastro básico da obra em uso, que quase toda tela precisa.
export function carregarBase() {
  return resposta({
    fases: copiar(daObra(t.fases)).sort((a, b) => a.ordem - b.ordem),
    torres: copiar(daObra(t.torres)).sort((a, b) => a.ordem - b.ordem),
    pavimentos: copiar(daObra(t.pavimentos)),
    servicos: copiar(daObra(t.servicos)),
    empreiteiros: copiar(daObra(t.empreiteiros)),
    pessoas: copiar(t.profiles.filter((p) => t.membros.some((m) => m.obra_id === obraAtual && m.profile_id === p.id))),
  })
}

// ---------- Painel ----------

export function carregarPainel() {
  return resposta({
    avancos: copiar(daObra(t.avancos)),
    contratos: copiar(daObra(t.contratos)),
    itens: copiar(daObra(t.contrato_itens)),
    restricoes: copiar(daObra(t.restricoes).filter((r) => r.status === 'Aberta')),
    diarios: copiar(daObra(t.diarios)),
    efetivos: copiar(daObra(t.diario_efetivos)),
  })
}

// ---------- Avanço e ciclo ----------

export function listarAvancosDaTorre(torreId) {
  return resposta(copiar(daObra(t.avancos).filter((a) => a.torre_id === torreId)))
}

export function carregarPavimento(pavimentoId) {
  return resposta({
    avancos: copiar(daObra(t.avancos).filter((a) => a.pavimento_id === pavimentoId)),
    fotos: copiar(daObra(t.fotos).filter((f) => f.pavimento_id === pavimentoId)),
  })
}

export function salvarAvanco({ pavimento_id, servico_id, empreiteiro_id, quantidade, data, observacao }) {
  const sem = negado(pode.lancarAvanco)
  if (sem) return falha(sem)
  const pavimento = achar(t.pavimentos, pavimento_id)
  if (!pavimento) return falha('Pavimento não encontrado nesta obra.')
  const avanco = {
    torre_id: pavimento.torre_id, pavimento_id, servico_id, empreiteiro_id, quantidade: Number(quantidade), data,
    observacao: vazio(observacao), status: 'Lançado', lancado_por_id: usuario.id, conferido_por_id: null, medicao_id: null,
  }
  const invalido = validarAvanco(avanco, daObra(t.contratos), daObra(t.contrato_itens))
  if (invalido) return falha(invalido)
  return resposta(inserir(t.avancos, 'a', avanco))
}

export function mudarStatusDoAvanco(avancoId, acao) {
  const sem = negado(pode.conferirAvanco)
  if (sem) return falha(sem)
  const avanco = achar(t.avancos, avancoId)
  if (!avanco) return falha('Avanço não encontrado nesta obra.')
  const { status, erro } = transicaoDoAvanco(avanco, acao)
  if (erro) return falha(erro)
  avanco.status = status
  avanco.conferido_por_id = status === 'Conferido' ? usuario.id : null
  return resposta({ ...avanco })
}

export function excluirAvanco(avancoId) {
  const sem = negado(pode.lancarAvanco)
  if (sem) return falha(sem)
  const avanco = achar(t.avancos, avancoId)
  if (!avanco) return falha('Avanço não encontrado nesta obra.')
  if (!avancoEditavel(avanco)) return falha('Só avanço Lançado pode ser excluído.')
  remover(t.avancos, avancoId)
  return resposta(true)
}

export function atualizarCiclo(pavimentoId, mudancas) {
  const sem = negado(pode.lancarAvanco)
  if (sem) return falha(sem)
  const pavimento = achar(t.pavimentos, pavimentoId)
  if (!pavimento) return falha('Pavimento não encontrado nesta obra.')
  const campos = ['etapa_ciclo', 'data_real_pilares', 'data_real_laje', 'data_real_concretagem']
  // Datas previstas são do planejamento: assistente não mexe.
  if (pode.editarDatasPrevistas(usuario.role)) campos.push('data_prevista_pilares', 'data_prevista_laje', 'data_prevista_concretagem')
  const novo = { ...pavimento }
  for (const campo of campos) if (campo in mudancas) novo[campo] = vazio(mudancas[campo])
  const invalido = validarCiclo(novo)
  if (invalido) return falha(invalido)
  Object.assign(pavimento, novo)
  return resposta({ ...pavimento })
}

// ---------- Programação ----------

export function carregarProgramacao() {
  return resposta({
    atividades: copiar(daObra(t.atividades_semana)),
    restricoes: copiar(daObra(t.restricoes)),
  })
}

export function salvarAtividade({ semana_inicio, torre_id, pavimento_id, servico_id, empreiteiro_id }) {
  const sem = negado(pode.programarSemana)
  if (sem) return falha(sem)
  return resposta(inserir(t.atividades_semana, 'at', {
    semana_inicio, torre_id, pavimento_id: vazio(pavimento_id), servico_id, empreiteiro_id: vazio(empreiteiro_id), status: 'Programada', causa: null,
  }))
}

export function mudarStatusDaAtividade(atividadeId, status, causa) {
  const sem = negado(pode.criarRestricao)
  if (sem) return falha(sem)
  const atividade = achar(t.atividades_semana, atividadeId)
  if (!atividade) return falha('Atividade não encontrada nesta obra.')
  const nova = { ...atividade, status, causa: status === 'Não concluída' ? vazio(causa) : null }
  const invalido = validarAtividade(nova)
  if (invalido) return falha(invalido)
  Object.assign(atividade, nova)
  return resposta({ ...atividade })
}

export function salvarRestricao({ tipo, torre_id, pavimento_id, servico_id, descricao, responsavel_id, data_prometida }) {
  const sem = negado(pode.criarRestricao)
  if (sem) return falha(sem)
  return resposta(inserir(t.restricoes, 'r', {
    torre_id, pavimento_id: vazio(pavimento_id), servico_id: vazio(servico_id), tipo, descricao, data_abertura: hoje(),
    responsavel_id, data_prometida: vazio(data_prometida), data_remocao: null, status: 'Aberta', criado_por_id: usuario.id,
  }))
}

export function removerRestricao(restricaoId) {
  const sem = negado(pode.removerRestricao)
  if (sem) return falha(sem)
  const restricao = achar(t.restricoes, restricaoId)
  if (!restricao) return falha('Restrição não encontrada nesta obra.')
  restricao.status = 'Removida'
  restricao.data_remocao = hoje()
  return resposta({ ...restricao })
}

// ---------- Diário ----------

export function listarDiarios() {
  const efetivos = daObra(t.diario_efetivos)
  const fotos = daObra(t.fotos)
  const lista = daObra(t.diarios)
    .map((d) => ({
      ...d,
      efetivo_total: efetivos.filter((e) => e.diario_id === d.id).reduce((s, e) => s + e.quantidade, 0),
      total_fotos: fotos.filter((f) => f.diario_id === d.id).length,
    }))
    .sort((a, b) => (a.data < b.data ? 1 : -1))
  return resposta(lista)
}

export function carregarDiario(diarioId) {
  const diario = achar(t.diarios, diarioId)
  if (!diario) return falha('Diário não encontrado nesta obra.')
  return resposta({
    diario: { ...diario },
    efetivos: copiar(daObra(t.diario_efetivos).filter((e) => e.diario_id === diarioId)),
    servicos: copiar(daObra(t.diario_servicos).filter((s) => s.diario_id === diarioId)),
    fotos: copiar(daObra(t.fotos).filter((f) => f.diario_id === diarioId)),
  })
}

// Um diário por obra por dia: se o de hoje já existe, devolve o que existe.
export function abrirDiarioDeHoje() {
  const sem = negado(pode.lancarDiario)
  if (sem) return falha(sem)
  const existente = daObra(t.diarios).find((d) => d.data === hoje())
  if (existente) return resposta({ ...existente })
  return resposta(inserir(t.diarios, 'd', {
    data: hoje(), clima_manha: 'Sol', clima_tarde: 'Sol', ocorrencias: null, status: 'Rascunho', autor_id: usuario.id, revisado_por_id: null,
  }))
}

// Acha o diário e confere se ainda dá para mexer nele.
function diarioAberto(diarioId) {
  const sem = negado(pode.lancarDiario)
  if (sem) return { erro: sem }
  const diario = achar(t.diarios, diarioId)
  if (!diario) return { erro: 'Diário não encontrado nesta obra.' }
  if (!diarioEditavel(diario)) return { erro: 'Este diário já foi enviado e não pode mais ser alterado.' }
  return { diario }
}

export function salvarDiario(diarioId, { clima_manha, clima_tarde, ocorrencias }) {
  const { diario, erro } = diarioAberto(diarioId)
  if (erro) return falha(erro)
  Object.assign(diario, { clima_manha, clima_tarde, ocorrencias: vazio(ocorrencias) })
  return resposta({ ...diario })
}

export function adicionarEfetivo(diarioId, { empreiteiro_id, torre_id, quantidade }) {
  const { erro } = diarioAberto(diarioId)
  if (erro) return falha(erro)
  if (!(Number(quantidade) > 0)) return falha('O efetivo precisa ser maior que zero.')
  return resposta(inserir(t.diario_efetivos, 'ef', { diario_id: diarioId, empreiteiro_id, torre_id, quantidade: Math.round(Number(quantidade)) }))
}

export function adicionarServicoDoDia(diarioId, { torre_id, pavimento_id, servico_id, empreiteiro_id, descricao }) {
  const { erro } = diarioAberto(diarioId)
  if (erro) return falha(erro)
  return resposta(inserir(t.diario_servicos, 'ds', {
    diario_id: diarioId, torre_id, pavimento_id: vazio(pavimento_id), servico_id, empreiteiro_id: vazio(empreiteiro_id), descricao: vazio(descricao),
  }))
}

export function adicionarFoto(diarioId, { torre_id, pavimento_id, servico_id, legenda, url }) {
  const { erro } = diarioAberto(diarioId)
  if (erro) return falha(erro)
  return resposta(inserir(t.fotos, 'f', {
    diario_id: diarioId, torre_id, pavimento_id: vazio(pavimento_id), servico_id: vazio(servico_id), url: url || '', legenda: vazio(legenda), publicada: false,
  }))
}

// tabela: 'diario_efetivos' | 'diario_servicos' | 'fotos'
export function removerDoDiario(diarioId, tabela, id) {
  const { erro } = diarioAberto(diarioId)
  if (erro) return falha(erro)
  if (!['diario_efetivos', 'diario_servicos', 'fotos'].includes(tabela)) return falha('Tabela inválida.')
  remover(t[tabela], id)
  return resposta(true)
}

export function mudarStatusDoDiario(diarioId, acao) {
  const sem = negado(acao === 'enviar' ? pode.lancarDiario : pode.revisarDiario)
  if (sem) return falha(sem)
  const diario = achar(t.diarios, diarioId)
  if (!diario) return falha('Diário não encontrado nesta obra.')
  const linhas = daObra(t.diario_efetivos).filter((e) => e.diario_id === diarioId).length
  const { status, erro } = transicaoDoDiario(diario, acao, linhas)
  if (erro) return falha(erro)
  diario.status = status
  diario.revisado_por_id = status === 'Revisado' ? usuario.id : null
  return resposta({ ...diario })
}

// A chave de publicar foto continua valendo mesmo com o diário revisado.
export function alternarPublicacaoDaFoto(fotoId) {
  const sem = negado(pode.publicarFoto)
  if (sem) return falha(sem)
  const foto = achar(t.fotos, fotoId)
  if (!foto) return falha('Foto não encontrada nesta obra.')
  foto.publicada = !foto.publicada
  return resposta({ ...foto })
}

// ---------- Contratos e medição (tem valor: só gerente, planejador e diretoria) ----------

export function carregarMedicoes() {
  const sem = negado(pode.verValores)
  if (sem) return falha(sem)
  return resposta({
    contratos: copiar(daObra(t.contratos)),
    itens: copiar(daObra(t.contrato_itens)),
    medicoes: copiar(daObra(t.medicoes)),
    avancos: copiar(daObra(t.avancos)),
  })
}

export function salvarContrato({ empreiteiro_id, numero, data_inicio }) {
  const sem = negado(pode.alterarEstrutura)
  if (sem) return falha(sem)
  if (daObra(t.contratos).some((c) => c.numero.toUpperCase() === numero.trim().toUpperCase())) return falha('Já existe um contrato com este número nesta obra.')
  return resposta(inserir(t.contratos, 'c', { empreiteiro_id, numero: numero.trim(), data_inicio, status: 'Ativo' }))
}

export function salvarItemDoContrato(contratoId, { servico_id, torre_id, preco_unitario, quantidade_contratada }) {
  const sem = negado(pode.alterarEstrutura)
  if (sem) return falha(sem)
  if (!achar(t.contratos, contratoId)) return falha('Contrato não encontrado nesta obra.')
  if (daObra(t.contrato_itens).some((i) => i.contrato_id === contratoId && i.servico_id === servico_id && i.torre_id === torre_id)) {
    return falha('Este contrato já tem este serviço nesta torre.')
  }
  if (!(Number(preco_unitario) > 0) || !(Number(quantidade_contratada) > 0)) return falha('Preço e quantidade precisam ser maiores que zero.')
  return resposta(inserir(t.contrato_itens, 'i', {
    contrato_id: contratoId, servico_id, torre_id, preco_unitario: Number(preco_unitario), quantidade_contratada: Number(quantidade_contratada),
  }))
}

export function criarMedicao(contratoId, { periodo_inicio, periodo_fim }) {
  const sem = negado(pode.prepararMedicao)
  if (sem) return falha(sem)
  if (!achar(t.contratos, contratoId)) return falha('Contrato não encontrado nesta obra.')
  if (periodo_fim < periodo_inicio) return falha('O fim do período não pode ser antes do início.')
  const numeros = daObra(t.medicoes).filter((m) => m.contrato_id === contratoId).map((m) => m.numero)
  return resposta(inserir(t.medicoes, 'md', {
    contrato_id: contratoId, numero: Math.max(0, ...numeros) + 1, periodo_inicio, periodo_fim, status: 'Em preparo', desconto: 0,
    valor_total: null, observacao: null, motivo_devolucao: null, preparado_por_id: usuario.id, aprovado_por_id: null, aprovado_em: null,
  }))
}

// Acha a medição e confere se ainda está em preparo.
function medicaoAberta(medicaoId) {
  const sem = negado(pode.prepararMedicao)
  if (sem) return { erro: sem }
  const medicao = achar(t.medicoes, medicaoId)
  if (!medicao) return { erro: 'Medição não encontrada nesta obra.' }
  if (!medicaoEditavel(medicao)) return { erro: 'Esta medição já foi enviada e não pode mais ser alterada.' }
  return { medicao }
}

// Põe ou tira um avanço conferido da medição.
export function alternarAvancoNaMedicao(medicaoId, avancoId) {
  const { medicao, erro } = medicaoAberta(medicaoId)
  if (erro) return falha(erro)
  const avanco = achar(t.avancos, avancoId)
  if (!avanco) return falha('Avanço não encontrado nesta obra.')
  if (avanco.medicao_id === medicaoId) {
    avanco.medicao_id = null
  } else if (podeEntrarNaMedicao(avanco, achar(t.contratos, medicao.contrato_id))) {
    avanco.medicao_id = medicaoId
  } else {
    return falha('Este avanço não pode entrar nesta medição.')
  }
  return resposta({ ...avanco })
}

export function salvarMedicao(medicaoId, { desconto, observacao }) {
  const { medicao, erro } = medicaoAberta(medicaoId)
  if (erro) return falha(erro)
  if (Number(desconto) < 0) return falha('O desconto não pode ser negativo.')
  Object.assign(medicao, { desconto: Number(desconto) || 0, observacao: vazio(observacao) })
  return resposta({ ...medicao })
}

// acao: 'enviar' | 'aprovar' | 'devolver'. Aprovar grava o valor e trava os
// avanços como Medido — tudo ou nada.
export function mudarStatusDaMedicao(medicaoId, acao, motivo = '') {
  const sem = negado(acao === 'enviar' ? pode.prepararMedicao : pode.aprovarMedicao)
  if (sem) return falha(sem)
  const medicao = achar(t.medicoes, medicaoId)
  if (!medicao) return falha('Medição não encontrada nesta obra.')
  const incluidos = daObra(t.avancos).filter((a) => a.medicao_id === medicaoId)
  const { status, erro } = transicaoDaMedicao(medicao, acao, { avancosIncluidos: incluidos.length, motivo })
  if (erro) return falha(erro)
  if (status === 'Aprovada') {
    medicao.valor_total = valorDaMedicao(medicao, daObra(t.avancos), daObra(t.contratos), daObra(t.contrato_itens))
    medicao.aprovado_por_id = usuario.id
    medicao.aprovado_em = `${hoje()}T12:00:00Z`
    for (const avanco of incluidos) avanco.status = 'Medido'
  }
  medicao.status = status
  medicao.motivo_devolucao = status === 'Devolvida' ? motivo.trim() : null
  return resposta({ ...medicao })
}

// ---------- Estrutura (só gerente) ----------

export function carregarObraAtual() {
  const obra = t.obras.find((o) => o.id === obraAtual)
  if (!obra) return falha('Obra não encontrada.')
  return resposta({ obra: { ...obra }, grupo: t.grupos_contrato.find((g) => g.id === obra.grupo_contrato_id), grupos: copiar(t.grupos_contrato) })
}

// Com `id` edita a obra em uso; sem `id` abre uma obra nova. Quem cria a obra
// entra como membro dela — sem isso não enxergaria a obra que acabou de criar.
export function salvarObra({ id, nome, codigo, grupo, endereco, cliente, data_inicio, data_meta_entrega, situacao }) {
  const sem = negado(pode.alterarEstrutura)
  if (sem) return falha(sem)
  const dados = {
    id, nome: nome.trim(), codigo: codigo.trim().toUpperCase(), endereco: vazio(endereco), cliente: vazio(cliente),
    data_inicio, data_meta_entrega: vazio(data_meta_entrega), situacao,
  }
  const invalido = validarObra(dados, t.obras)
  if (invalido) return falha(invalido)

  // O grupo de contrato é escolhido pelo nome; nome novo cria o grupo.
  const nomeDoGrupo = (grupo || dados.nome).trim()
  let grupoDaObra = t.grupos_contrato.find((g) => g.nome.toLowerCase() === nomeDoGrupo.toLowerCase())
  if (!grupoDaObra) {
    grupoDaObra = { id: novoId('g'), nome: nomeDoGrupo }
    t.grupos_contrato.push(grupoDaObra)
  }
  dados.grupo_contrato_id = grupoDaObra.id

  if (id) {
    if (id !== obraAtual) return falha('Só dá para editar a obra em uso.')
    Object.assign(t.obras.find((o) => o.id === id), dados)
    return resposta({ ...dados })
  }
  const obra = { ...dados, id: novoId('o') }
  t.obras.push(obra)
  t.membros.push({ id: novoId('m'), obra_id: obra.id, profile_id: usuario.id })
  return resposta({ ...obra })
}

export function salvarFase({ nome, centro_custo }) {
  const sem = negado(pode.alterarEstrutura)
  if (sem) return falha(sem)
  return resposta(inserir(t.fases, 'f', { nome: nome.trim(), centro_custo: centro_custo.trim(), ordem: daObra(t.fases).length + 1 }))
}

// Cria a torre e já gera os pavimentos dela, de 1 até `pavimentos`.
export function salvarTorre({ fase_id, nome, tipo, pavimentos, meta_ciclo_dias, meta_lajes_mes }) {
  const sem = negado(pode.alterarEstrutura)
  if (sem) return falha(sem)
  if (!achar(t.fases, fase_id)) return falha('Fase não encontrada nesta obra.')
  const total = Math.round(Number(pavimentos))
  if (!(total >= 1 && total <= 80)) return falha('Informe de 1 a 80 pavimentos.')
  const torre = inserir(t.torres, 't', {
    fase_id, nome: nome.trim(), tipo, ordem: daObra(t.torres).length + 1,
    meta_ciclo_dias: Math.round(Number(meta_ciclo_dias)) || 7, meta_lajes_mes: Math.round(Number(meta_lajes_mes)) || 4, status: 'Ativa',
  })
  for (let ordem = 1; ordem <= total; ordem++) {
    inserir(t.pavimentos, 'p', {
      torre_id: torre.id, nome: `${ordem}º pavimento`, ordem, etapa_ciclo: 'Não iniciado',
      data_prevista_pilares: null, data_real_pilares: null, data_prevista_laje: null, data_real_laje: null,
      data_prevista_concretagem: null, data_real_concretagem: null,
    })
  }
  return resposta({ ...torre })
}

export function salvarServico({ nome, unidade }) {
  const sem = negado(pode.alterarEstrutura)
  if (sem) return falha(sem)
  return resposta(inserir(t.servicos, 's', { nome: nome.trim(), unidade: unidade.trim() }))
}

export function salvarEmpreiteiro({ nome, cnpj }) {
  const sem = negado(pode.alterarEstrutura)
  if (sem) return falha(sem)
  return resposta(inserir(t.empreiteiros, 'e', { nome: nome.trim(), cnpj: vazio(cnpj) }))
}

// ---------- Usuários (só gerente) ----------

export function listarUsuarios() {
  const sem = negado(pode.gerenciarUsuarios)
  if (sem) return falha(sem)
  return resposta({
    obras: copiar(t.obras),
    pessoas: t.profiles.map((p) => ({ ...p, obra_ids: t.membros.filter((m) => m.profile_id === p.id).map((m) => m.obra_id) })),
  })
}

// Libera ou edita uma pessoa: perfil, obras e se está ativa.
export function salvarUsuario(profileId, { role, obra_ids, ativo }) {
  const sem = negado(pode.gerenciarUsuarios)
  if (sem) return falha(sem)
  const pessoa = t.profiles.find((p) => p.id === profileId)
  if (!pessoa) return falha('Usuário não encontrado.')
  if (!obra_ids || obra_ids.length === 0) return falha('Escolha pelo menos uma obra.')
  if (profileId === usuario.id && role !== 'gerente') return falha('Você não pode tirar o seu próprio perfil de gerente.')
  Object.assign(pessoa, { role, ativo: ativo !== false })
  for (let i = t.membros.length - 1; i >= 0; i--) if (t.membros[i].profile_id === profileId) t.membros.splice(i, 1)
  for (const obra_id of obra_ids) t.membros.push({ id: novoId('m'), obra_id, profile_id: profileId })
  return resposta({ ...pessoa })
}

// ---------- Notas e almoxarifado (tem valor: gerente, planejador, administrativo, almoxarife) ----------

export function carregarNotas() {
  const sem = negado(pode.verNotas)
  if (sem) return falha(sem)
  return resposta({
    notas: copiar(daObra(t.notas)),
    itens: copiar(daObra(t.nota_itens)),
    fornecedores: copiar(daObra(t.fornecedores)),
    insumos: copiar(daObra(t.insumos)),
  })
}

// Escolhe-se da lista ou escreve-se um nome novo; nome que já existe é reaproveitado.
function acharOuCriar(lista, prefixo, id, nomeNovo, extra = {}) {
  if (id) return achar(lista, id) || null
  const nome = (nomeNovo || '').trim()
  if (!nome) return null
  return daObra(lista).find((x) => x.nome.toLowerCase() === nome.toLowerCase()) || inserir(lista, prefixo, { nome, ...extra })
}

export function salvarNota({ fornecedor_id, novo_fornecedor, numero, data_emissao, fase_id, anexo_url }) {
  const sem = negado(pode.lancarNota)
  if (sem) return falha(sem)
  if (!achar(t.fases, fase_id)) return falha('Fase não encontrada nesta obra.')
  if (data_emissao > hoje()) return falha('A data de emissão não pode ser no futuro.')
  if (!fornecedor_id && !(novo_fornecedor || '').trim()) return falha('Escolha um fornecedor da lista ou escreva o nome de um novo.')
  const fornecedor = acharOuCriar(t.fornecedores, 'fo', fornecedor_id, novo_fornecedor, { cnpj: null })
  if (!fornecedor) return falha('Fornecedor não encontrado nesta obra.')
  if (daObra(t.notas).some((n) => n.fornecedor_id === fornecedor.id && n.numero === numero.trim())) {
    return falha('Esta nota já foi lançada: mesmo fornecedor e mesmo número.')
  }
  return resposta(inserir(t.notas, 'n', {
    fase_id, fornecedor_id: fornecedor.id, numero: numero.trim(), data_emissao, valor_total: 0, anexo_url: vazio(anexo_url),
    status: 'Lançada', observacao_conferencia: null, lancada_por_id: usuario.id,
    conferida_por_id: null, conferida_em: null, validada_por_id: null, validada_em: null,
  }))
}

// Acha a nota e confere se os itens ainda podem mudar (antes da conferência).
function notaAberta(notaId) {
  const sem = negado(pode.lancarNota)
  if (sem) return { erro: sem }
  const nota = achar(t.notas, notaId)
  if (!nota) return { erro: 'Nota não encontrada nesta obra.' }
  if (!notaEditavel(nota)) return { erro: 'O recebimento desta nota já foi conferido; os itens não mudam mais.' }
  return { nota }
}

const itensDaNota = (notaId) => daObra(t.nota_itens).filter((i) => i.nota_id === notaId)

export function adicionarItemDaNota(notaId, { insumo_id, novo_insumo, unidade, quantidade, valor_unitario }) {
  const { nota, erro } = notaAberta(notaId)
  if (erro) return falha(erro)
  if (!(Number(quantidade) > 0) || !(Number(valor_unitario) > 0)) return falha('Quantidade e valor unitário precisam ser maiores que zero.')
  if (!insumo_id && !(novo_insumo || '').trim()) return falha('Escolha um insumo da lista ou escreva o nome de um novo.')
  if (!insumo_id && !(unidade || '').trim()) return falha('Informe a unidade do insumo novo (kg, saco, m³, un…).')
  const insumo = acharOuCriar(t.insumos, 'in', insumo_id, novo_insumo, { unidade: (unidade || '').trim() })
  if (!insumo) return falha('Insumo não encontrado nesta obra.')
  if (itensDaNota(notaId).some((i) => i.insumo_id === insumo.id)) return falha('Este insumo já está na nota.')
  const item = inserir(t.nota_itens, 'ni', {
    nota_id: notaId, insumo_id: insumo.id, quantidade: Number(quantidade), valor_unitario: Number(valor_unitario), quantidade_recebida: null,
  })
  nota.valor_total = totalDaNota(itensDaNota(notaId))
  return resposta({ ...item })
}

export function removerItemDaNota(notaId, itemId) {
  const { nota, erro } = notaAberta(notaId)
  if (erro) return falha(erro)
  remover(t.nota_itens, itemId)
  nota.valor_total = totalDaNota(itensDaNota(notaId))
  return resposta(true)
}

// O almoxarife informa quanto chegou de cada item: { [itemId]: quantidade }.
export function conferirNota(notaId, recebidas, observacao = '') {
  const sem = negado(pode.conferirNota)
  if (sem) return falha(sem)
  const nota = achar(t.notas, notaId)
  if (!nota) return falha('Nota não encontrada nesta obra.')
  const itens = itensDaNota(notaId)
  const { status, erro } = conferirRecebimento(nota, itens, recebidas, observacao)
  if (erro) return falha(erro)
  for (const item of itens) item.quantidade_recebida = Number(recebidas[item.id])
  Object.assign(nota, { status, observacao_conferencia: vazio(observacao.trim()), conferida_por_id: usuario.id, conferida_em: hoje() })
  return resposta({ ...nota })
}

// acao: 'aguardar' | 'validar'
export function mudarStatusDaNota(notaId, acao) {
  const sem = negado(acao === 'validar' ? pode.validarNota : pode.lancarNota)
  if (sem) return falha(sem)
  const nota = achar(t.notas, notaId)
  if (!nota) return falha('Nota não encontrada nesta obra.')
  const { status, erro } = transicaoDaNota(nota, acao)
  if (erro) return falha(erro)
  nota.status = status
  // shortcut: validar ainda não gera a entrada no estoque; fazer junto com o módulo Estoque.
  if (status === 'Validada') Object.assign(nota, { validada_por_id: usuario.id, validada_em: hoje() })
  return resposta({ ...nota })
}
