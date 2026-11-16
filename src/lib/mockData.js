// ============================================================
// DADOS DE EXEMPLO (de mentira) para ver o app sem banco.
// Os nomes de campo são os mesmos das tabelas do PRD-BACKEND, para a troca
// pelo Supabase ser só trocar o miolo de dados.js. Na etapa do banco, estes
// dados viram a carga inicial ("seed").
//
// DUAS OBRAS, de propósito, e diferentes entre si: a o1 é a completa; a o2
// tem pouca coisa. Tela que só funciona com uma obra aparece quebrada aqui.
// ============================================================
import { somarDias } from './datas.js'

// Vire para false na etapa do Supabase.
export const USAR_MOCK = true

// "Hoje" dos dados de exemplo. Com o banco, passa a ser a data real.
export const HOJE_MOCK = '2026-11-13'

export const mockProfiles = [
  { id: 'p1', nome: 'Gerente de Exemplo', email: 'gerente@exemplo.test', role: 'gerente', ativo: true },
  { id: 'p2', nome: 'Planejador de Exemplo', email: 'planejador@exemplo.test', role: 'planejador', ativo: true },
  { id: 'p3', nome: 'Assistente de Exemplo', email: 'assistente@exemplo.test', role: 'assistente', ativo: true },
  { id: 'p4', nome: 'Administrativo de Exemplo', email: 'administrativo@exemplo.test', role: 'administrativo', ativo: true },
  { id: 'p5', nome: 'Almoxarife de Exemplo', email: 'almoxarife@exemplo.test', role: 'almoxarife', ativo: true },
  { id: 'p6', nome: 'Mestre de Exemplo', email: 'mestre@exemplo.test', role: 'mestre', ativo: true },
  { id: 'p7', nome: 'Diretoria de Exemplo', email: 'diretoria@exemplo.test', role: 'diretoria', ativo: true },
  { id: 'p8', nome: 'Cliente de Exemplo', email: 'cliente@exemplo.test', role: 'cliente', ativo: true },
  { id: 'p9', nome: 'Pessoa Nova', email: 'novo@exemplo.test', role: 'pendente', ativo: true },
]

export const mockGrupos = [
  { id: 'g1', nome: 'Residencial Modelo' },
  { id: 'g2', nome: 'Habitacional Modelo' },
]

export const mockObras = [
  { id: 'o1', grupo_contrato_id: 'g1', nome: 'Residencial Modelo', codigo: 'RM-01', endereco: 'Av. das Palmeiras, 1200', cliente: 'Incorporadora Modelo S.A.', data_inicio: '2025-03-10', data_meta_entrega: '2028-06-30', situacao: 'Em andamento' },
  { id: 'o2', grupo_contrato_id: 'g2', nome: 'Condomínio Modelo II', codigo: 'CM-02', endereco: 'Rua dos Ipês, 450', cliente: 'Habitacional Modelo Ltda.', data_inicio: '2026-09-01', data_meta_entrega: '2027-12-20', situacao: 'Em andamento' },
]

// Todos na o1; só gerente e planejador também na o2.
export const mockMembros = [
  ...['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].map((p) => ({ id: `m-o1-${p}`, obra_id: 'o1', profile_id: p })),
  { id: 'm-o2-p1', obra_id: 'o2', profile_id: 'p1' },
  { id: 'm-o2-p2', obra_id: 'o2', profile_id: 'p2' },
]

export const mockFases = [
  { id: 'f1', obra_id: 'o1', nome: 'Fase 1', centro_custo: 'CC-001', ordem: 1 },
  { id: 'f2', obra_id: 'o1', nome: 'Fase 2', centro_custo: 'CC-002', ordem: 2 },
  { id: 'f3', obra_id: 'o2', nome: 'Fase única', centro_custo: 'CC-010', ordem: 1 },
]

const torre = (id, obra_id, fase_id, nome, tipo, ordem, meta_lajes_mes = 4) => ({
  id, obra_id, fase_id, nome, tipo, ordem, meta_ciclo_dias: 7, meta_lajes_mes, status: 'Ativa',
})

export const mockTorres = [
  torre('t1', 'o1', 'f1', 'Torre 1', 'Torre', 1),
  torre('t2', 'o1', 'f1', 'Torre 2', 'Torre', 2),
  torre('ta1', 'o1', 'f1', 'Anexo F1', 'Anexo', 3),
  torre('tg1', 'o1', 'f1', 'Garagem G1', 'Garagem', 4),
  torre('t3', 'o1', 'f2', 'Torre 3', 'Torre', 5),
  torre('t4', 'o1', 'f2', 'Torre 4', 'Torre', 6),
  torre('t5', 'o1', 'f2', 'Torre 5', 'Torre', 7),
  torre('ta2', 'o1', 'f2', 'Anexo F2', 'Anexo', 8),
  torre('ba', 'o2', 'f3', 'Bloco A', 'Torre', 1, 3),
  torre('bb', 'o2', 'f3', 'Bloco B', 'Torre', 2, 3),
  torre('bc', 'o2', 'f3', 'Bloco C', 'Torre', 3, 3),
  torre('bd', 'o2', 'f3', 'Bloco D', 'Torre', 4, 3),
]

// Gera os pavimentos de uma torre: os `feitos` primeiros já concretados, um por
// semana, terminando em `ultimaReal`. `ajustes` sobrescreve pavimentos específicos.
function pavimentos(obra_id, torre_id, total, feitos, ultimaReal, ajustes = {}) {
  const lista = []
  for (let ordem = 1; ordem <= total; ordem++) {
    const p = {
      id: `${torre_id}-p${ordem}`, obra_id, torre_id, nome: `${ordem}º pavimento`, ordem,
      etapa_ciclo: 'Não iniciado',
      data_prevista_pilares: null, data_real_pilares: null,
      data_prevista_laje: null, data_real_laje: null,
      data_prevista_concretagem: null, data_real_concretagem: null,
    }
    if (ordem <= feitos) {
      const real = somarDias(ultimaReal, -7 * (feitos - ordem))
      Object.assign(p, {
        etapa_ciclo: 'Concretado',
        data_prevista_pilares: somarDias(real, -6), data_real_pilares: somarDias(real, -6),
        data_prevista_laje: somarDias(real, -3), data_real_laje: somarDias(real, -3),
        data_prevista_concretagem: real, data_real_concretagem: real,
      })
    }
    lista.push(Object.assign(p, ajustes[ordem] || {}))
  }
  return lista
}

export const mockPavimentos = [
  ...pavimentos('o1', 't1', 24, 13, '2026-11-07', {
    13: { data_prevista_concretagem: '2026-11-06' },
    14: { etapa_ciclo: 'Laje', data_prevista_pilares: '2026-11-09', data_real_pilares: '2026-11-09', data_prevista_laje: '2026-11-12', data_real_laje: '2026-11-12', data_prevista_concretagem: '2026-11-14' },
    15: { data_prevista_concretagem: '2026-11-21' },
  }),
  ...pavimentos('o1', 't2', 24, 11, '2026-11-10', {
    11: { data_prevista_concretagem: '2026-11-05' },
    12: { etapa_ciclo: 'Pilares e escada', data_prevista_pilares: '2026-11-10', data_real_pilares: '2026-11-10', data_prevista_concretagem: '2026-11-17' },
  }),
  ...pavimentos('o1', 't3', 24, 0, null, { 1: { data_prevista_concretagem: '2026-11-30' } }),
  ...pavimentos('o1', 't4', 24, 0, null),
  ...pavimentos('o1', 't5', 24, 0, null),
  ...pavimentos('o1', 'ta1', 1, 0, null),
  ...pavimentos('o1', 'tg1', 1, 0, null),
  ...pavimentos('o1', 'ta2', 1, 0, null),
  ...pavimentos('o2', 'ba', 5, 2, '2026-11-05', {
    1: { data_prevista_concretagem: '2026-10-27' },
    3: { etapa_ciclo: 'Laje', data_prevista_pilares: '2026-11-10', data_real_pilares: '2026-11-10', data_prevista_laje: '2026-11-12', data_real_laje: '2026-11-12', data_prevista_concretagem: '2026-11-14' },
  }),
  ...pavimentos('o2', 'bb', 5, 1, '2026-11-06', {
    2: { etapa_ciclo: 'Pilares e escada', data_prevista_pilares: '2026-11-11', data_real_pilares: '2026-11-11', data_prevista_concretagem: '2026-11-18' },
  }),
  ...pavimentos('o2', 'bc', 5, 0, null, { 1: { data_prevista_concretagem: '2026-12-02' } }),
  ...pavimentos('o2', 'bd', 5, 0, null),
]

export const mockServicos = [
  { id: 's1', obra_id: 'o1', nome: 'Forma', unidade: 'm²' },
  { id: 's2', obra_id: 'o1', nome: 'Armação', unidade: 'kg' },
  { id: 's3', obra_id: 'o1', nome: 'Concretagem', unidade: 'm³' },
  { id: 's4', obra_id: 'o1', nome: 'Alvenaria', unidade: 'm²' },
  { id: 's5', obra_id: 'o1', nome: 'Contrapiso', unidade: 'm²' },
  { id: 's6', obra_id: 'o1', nome: 'Reboco', unidade: 'm²' },
  { id: 's7', obra_id: 'o2', nome: 'Alvenaria', unidade: 'm²' },
  { id: 's8', obra_id: 'o2', nome: 'Laje', unidade: 'm²' },
]

export const mockEmpreiteiros = [
  { id: 'e1', obra_id: 'o1', nome: 'Estrutural Alfa', cnpj: null },
  { id: 'e2', obra_id: 'o1', nome: 'Formas Beta', cnpj: null },
  { id: 'e3', obra_id: 'o1', nome: 'Alvenaria Gama', cnpj: null },
  { id: 'e4', obra_id: 'o1', nome: 'Acabamentos Delta', cnpj: null },
  { id: 'e5', obra_id: 'o2', nome: 'Alvenaria Sigma', cnpj: null },
  { id: 'e6', obra_id: 'o2', nome: 'Lajes Ômega', cnpj: null },
]

export const mockContratos = [
  { id: 'c1', obra_id: 'o1', empreiteiro_id: 'e1', numero: 'CT-001', data_inicio: '2025-04-01', status: 'Ativo' },
  { id: 'c2', obra_id: 'o1', empreiteiro_id: 'e2', numero: 'CT-002', data_inicio: '2025-04-01', status: 'Ativo' },
  { id: 'c3', obra_id: 'o1', empreiteiro_id: 'e3', numero: 'CT-003', data_inicio: '2026-06-15', status: 'Ativo' },
  { id: 'c4', obra_id: 'o2', empreiteiro_id: 'e5', numero: 'CT-101', data_inicio: '2026-09-15', status: 'Ativo' },
]

export const mockContratoItens = [
  { id: 'i1', obra_id: 'o1', contrato_id: 'c1', servico_id: 's3', torre_id: 't1', preco_unitario: 95, quantidade_contratada: 4800 },
  { id: 'i2', obra_id: 'o1', contrato_id: 'c1', servico_id: 's3', torre_id: 't2', preco_unitario: 95, quantidade_contratada: 4800 },
  { id: 'i3', obra_id: 'o1', contrato_id: 'c1', servico_id: 's2', torre_id: 't1', preco_unitario: 2.1, quantidade_contratada: 380000 },
  { id: 'i4', obra_id: 'o1', contrato_id: 'c2', servico_id: 's1', torre_id: 't1', preco_unitario: 38, quantidade_contratada: 26000 },
  { id: 'i5', obra_id: 'o1', contrato_id: 'c2', servico_id: 's1', torre_id: 't2', preco_unitario: 38, quantidade_contratada: 26000 },
  { id: 'i6', obra_id: 'o1', contrato_id: 'c3', servico_id: 's4', torre_id: 't1', preco_unitario: 42, quantidade_contratada: 31000 },
  { id: 'i7', obra_id: 'o2', contrato_id: 'c4', servico_id: 's7', torre_id: 'ba', preco_unitario: 36, quantidade_contratada: 9500 },
]

export const mockMedicoes = [
  { id: 'md1', obra_id: 'o1', contrato_id: 'c1', numero: 5, periodo_inicio: '2026-10-01', periodo_fim: '2026-10-31', status: 'Aprovada', desconto: 0, valor_total: 823775, observacao: 'Acumulado das medições 1 a 5.', motivo_devolucao: null, preparado_por_id: 'p2', aprovado_por_id: 'p1', aprovado_em: '2026-11-02T14:00:00Z' },
  { id: 'md2', obra_id: 'o1', contrato_id: 'c1', numero: 6, periodo_inicio: '2026-11-01', periodo_fim: '2026-11-10', status: 'Aprovada', desconto: 0, valor_total: 18525, observacao: null, motivo_devolucao: null, preparado_por_id: 'p2', aprovado_por_id: 'p1', aprovado_em: '2026-11-11T13:30:00Z' },
  { id: 'md3', obra_id: 'o1', contrato_id: 'c1', numero: 7, periodo_inicio: '2026-11-11', periodo_fim: '2026-11-13', status: 'Em preparo', desconto: 0, valor_total: null, observacao: null, motivo_devolucao: null, preparado_por_id: 'p2', aprovado_por_id: null, aprovado_em: null },
  { id: 'md4', obra_id: 'o1', contrato_id: 'c2', numero: 4, periodo_inicio: '2026-10-01', periodo_fim: '2026-10-31', status: 'Aprovada', desconto: 0, valor_total: 1012700, observacao: 'Acumulado das medições 1 a 4.', motivo_devolucao: null, preparado_por_id: 'p2', aprovado_por_id: 'p1', aprovado_em: '2026-11-02T14:10:00Z' },
  { id: 'md5', obra_id: 'o1', contrato_id: 'c2', numero: 5, periodo_inicio: '2026-11-01', periodo_fim: '2026-11-10', status: 'Aguardando aprovação', desconto: 0, valor_total: null, observacao: null, motivo_devolucao: null, preparado_por_id: 'p2', aprovado_por_id: null, aprovado_em: null },
  { id: 'md6', obra_id: 'o1', contrato_id: 'c3', numero: 2, periodo_inicio: '2026-09-01', periodo_fim: '2026-10-19', status: 'Aprovada', desconto: 0, valor_total: 268900, observacao: 'Acumulado das medições 1 e 2.', motivo_devolucao: null, preparado_por_id: 'p2', aprovado_por_id: 'p1', aprovado_em: '2026-10-21T10:00:00Z' },
  { id: 'md7', obra_id: 'o1', contrato_id: 'c3', numero: 3, periodo_inicio: '2026-10-20', periodo_fim: '2026-10-31', status: 'Devolvida', desconto: 0, valor_total: null, observacao: null, motivo_devolucao: 'Quantidade do 5º pavimento não confere.', preparado_por_id: 'p2', aprovado_por_id: null, aprovado_em: null },
  { id: 'md8', obra_id: 'o2', contrato_id: 'c4', numero: 2, periodo_inicio: '2026-10-15', periodo_fim: '2026-11-05', status: 'Aprovada', desconto: 0, valor_total: 54000, observacao: 'Acumulado das medições 1 e 2.', motivo_devolucao: null, preparado_por_id: 'p2', aprovado_por_id: 'p1', aprovado_em: '2026-11-06T09:00:00Z' },
]

const avanco = (id, obra_id, torre_id, ordem, servico_id, empreiteiro_id, quantidade, data, status, medicao_id = null) => ({
  id, obra_id, torre_id, pavimento_id: `${torre_id}-p${ordem}`, servico_id, empreiteiro_id, quantidade, data,
  observacao: null, status, lancado_por_id: 'p3', conferido_por_id: status === 'Lançado' ? null : 'p2', medicao_id,
})

export const mockAvancos = [
  avanco('a1', 'o1', 't1', 13, 's3', 'e1', 195, '2026-11-10', 'Medido', 'md2'),
  avanco('a2', 'o1', 't1', 14, 's1', 'e2', 1050, '2026-11-11', 'Conferido'),
  avanco('a3', 'o1', 't1', 14, 's2', 'e1', 15200, '2026-11-11', 'Conferido'),
  avanco('a4', 'o1', 't2', 12, 's1', 'e2', 480, '2026-11-12', 'Lançado'),
  avanco('a5', 'o1', 't1', 6, 's4', 'e3', 610, '2026-11-12', 'Conferido'),
  avanco('a6', 'o1', 't2', 11, 's3', 'e1', 198, '2026-11-13', 'Lançado'),
  avanco('a7', 'o1', 't2', 11, 's1', 'e2', 1050, '2026-11-06', 'Conferido', 'md5'),
  avanco('a8', 'o1', 't1', 5, 's4', 'e3', 610, '2026-10-28', 'Conferido', 'md7'),
  avanco('a9', 'o2', 'ba', 3, 's7', 'e5', 420, '2026-11-12', 'Conferido'),
]

// ---------- Diário ----------
const diario = (id, obra_id, data, clima_manha, clima_tarde, status, ocorrencias = null) => ({
  id, obra_id, data, clima_manha, clima_tarde, ocorrencias, status, autor_id: 'p6',
  revisado_por_id: status === 'Revisado' ? 'p3' : null,
})

// [empreiteiro, torre, quantidade] de um dia viram linhas de diario_efetivos.
const efetivosDoDia = (obra_id, diario_id, linhas) =>
  linhas.map(([empreiteiro_id, torre_id, quantidade], n) => ({
    id: `${diario_id}-e${n}`, obra_id, diario_id, empreiteiro_id, torre_id, quantidade,
  }))

const semanaCheiaO1 = [['e1', 't1', 22], ['e1', 't2', 16], ['e2', 't1', 15], ['e2', 't2', 14], ['e3', 't1', 24], ['e4', 't1', 12]]
const diasSemanaAnteriorO1 = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']
const diasSemanaAnteriorO2 = ['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']

export const mockDiarios = [
  diario('d-1113', 'o1', '2026-11-13', 'Sol', 'Nublado', 'Rascunho'),
  diario('d-1112', 'o1', '2026-11-12', 'Sol', 'Sol', 'Enviado', 'Grua parada das 14h às 16h para manutenção preventiva.'),
  diario('d-1111', 'o1', '2026-11-11', 'Chuva fraca', 'Nublado', 'Revisado'),
  diario('d-1110', 'o1', '2026-11-10', 'Chuva forte', 'Chuva fraca', 'Revisado', 'Concretagem do 11º da Torre 2 atrasou por causa da chuva.'),
  ...diasSemanaAnteriorO1.map((data) => diario(`d-${data.slice(5).replace('-', '')}`, 'o1', data, 'Sol', 'Sol', 'Revisado')),
  diario('d2-1113', 'o2', '2026-11-13', 'Sol', 'Sol', 'Enviado'),
  diario('d2-1112', 'o2', '2026-11-12', 'Sol', 'Nublado', 'Revisado'),
  ...diasSemanaAnteriorO2.map((data) => diario(`d2-${data.slice(5).replace('-', '')}`, 'o2', data, 'Sol', 'Sol', 'Revisado')),
]

export const mockDiarioEfetivos = [
  ...efetivosDoDia('o1', 'd-1113', [['e1', 't1', 22], ['e1', 't2', 16], ['e2', 't1', 11], ['e2', 't2', 10], ['e3', 't1', 24], ['e4', 't1', 13]]),
  ...efetivosDoDia('o1', 'd-1112', [['e1', 't1', 22], ['e1', 't2', 16], ['e2', 't1', 15], ['e2', 't2', 14], ['e3', 't1', 24], ['e4', 't1', 13]]),
  ...efetivosDoDia('o1', 'd-1111', [['e1', 't1', 18], ['e1', 't2', 12], ['e2', 't1', 13], ['e2', 't2', 12], ['e3', 't1', 22], ['e4', 't1', 11]]),
  ...efetivosDoDia('o1', 'd-1110', [['e1', 't1', 12], ['e1', 't2', 8], ['e2', 't1', 10], ['e2', 't2', 8], ['e3', 't1', 15], ['e4', 't1', 8]]),
  ...diasSemanaAnteriorO1.flatMap((data) => efetivosDoDia('o1', `d-${data.slice(5).replace('-', '')}`, semanaCheiaO1)),
  ...efetivosDoDia('o2', 'd2-1113', [['e5', 'ba', 16], ['e5', 'bb', 11], ['e6', 'ba', 14]]),
  ...efetivosDoDia('o2', 'd2-1112', [['e5', 'ba', 16], ['e5', 'bb', 11], ['e6', 'ba', 14]]),
  ...diasSemanaAnteriorO2.flatMap((data) => efetivosDoDia('o2', `d2-${data.slice(5).replace('-', '')}`, [['e5', 'ba', 15], ['e5', 'bb', 10], ['e6', 'ba', 14]])),
]

export const mockDiarioServicos = [
  { id: 'ds1', obra_id: 'o1', diario_id: 'd-1113', torre_id: 't1', pavimento_id: 't1-p14', servico_id: 's1', empreiteiro_id: 'e2', descricao: 'Fechamento da forma da laje.' },
  { id: 'ds2', obra_id: 'o1', diario_id: 'd-1113', torre_id: 't2', pavimento_id: 't2-p12', servico_id: 's2', empreiteiro_id: 'e1', descricao: 'Armação de pilares, parada à tarde por falta de aço.' },
  { id: 'ds3', obra_id: 'o1', diario_id: 'd-1113', torre_id: 't1', pavimento_id: 't1-p6', servico_id: 's4', empreiteiro_id: 'e3', descricao: null },
  { id: 'ds4', obra_id: 'o1', diario_id: 'd-1112', torre_id: 't1', pavimento_id: 't1-p14', servico_id: 's2', empreiteiro_id: 'e1', descricao: 'Armação positiva da laje.' },
  { id: 'ds5', obra_id: 'o1', diario_id: 'd-1112', torre_id: 't2', pavimento_id: 't2-p12', servico_id: 's1', empreiteiro_id: 'e2', descricao: 'Forma de pilares.' },
  { id: 'ds6', obra_id: 'o2', diario_id: 'd2-1113', torre_id: 'ba', pavimento_id: 'ba-p3', servico_id: 's7', empreiteiro_id: 'e5', descricao: 'Elevação de alvenaria estrutural.' },
]

// Sem imagem de verdade ainda: `url` vazio vira um quadro cinza com a legenda.
const fotos = (obra_id, diario_id, lista) =>
  lista.map(([torre_id, ordem, servico_id, legenda, publicada], n) => ({
    id: `${diario_id}-f${n}`, obra_id, diario_id, torre_id, pavimento_id: ordem ? `${torre_id}-p${ordem}` : null,
    servico_id, url: '', legenda, publicada: Boolean(publicada),
  }))

export const mockFotos = [
  ...fotos('o1', 'd-1113', [['t1', 14, 's1', 'Forma da laje fechada', true], ['t1', 14, 's2', 'Armação positiva'], ['t2', 12, 's2', 'Pilares aguardando aço'], ['t1', 6, 's4', 'Alvenaria do 6º'], ['t1', null, null, 'Vista geral da Torre 1', true], ['t2', 12, 's1', 'Forma de pilares'], ['t1', 14, 's1', 'Escoramento']]),
  ...fotos('o1', 'd-1112', [['t1', 14, 's2', 'Armação da laje'], ['t1', 14, 's2', 'Detalhe da armação negativa'], ['t2', 12, 's1', 'Gastalho dos pilares'], ['t2', 11, 's3', 'Laje do 11º concretada', true], ['t1', 6, 's4', 'Marcação de alvenaria'], ['t1', 13, 's3', 'Cura da laje do 13º'], ['t2', null, null, 'Vista geral da Torre 2', true], ['t1', null, null, 'Grua em manutenção'], ['t1', 14, 's1', 'Forma de borda']]),
  ...fotos('o1', 'd-1111', [['t1', 14, 's1', 'Início da forma'], ['t1', 14, 's1', 'Cimbramento'], ['t2', 11, 's3', 'Lançamento do concreto'], ['t1', 6, 's4', 'Alvenaria'], ['t2', 12, 's2', 'Arranque de pilares']]),
  ...fotos('o1', 'd-1110', [['t2', 11, 's3', 'Concretagem sob chuva'], ['t1', 14, 's2', 'Aço estocado'], ['t1', 13, 's3', 'Desforma']]),
  ...fotos('o2', 'd2-1113', [['ba', 3, 's7', 'Alvenaria do 3º', true], ['bb', 2, 's7', 'Estoque de bloco baixo']]),
]

export const mockAtividadesSemana = [
  { id: 'at1', obra_id: 'o1', semana_inicio: '2026-11-09', torre_id: 't1', pavimento_id: 't1-p14', servico_id: 's1', empreiteiro_id: 'e2', status: 'Concluída', causa: null },
  { id: 'at2', obra_id: 'o1', semana_inicio: '2026-11-09', torre_id: 't1', pavimento_id: 't1-p14', servico_id: 's2', empreiteiro_id: 'e1', status: 'Concluída', causa: null },
  { id: 'at3', obra_id: 'o1', semana_inicio: '2026-11-09', torre_id: 't1', pavimento_id: 't1-p14', servico_id: 's3', empreiteiro_id: 'e1', status: 'Programada', causa: null },
  { id: 'at4', obra_id: 'o1', semana_inicio: '2026-11-09', torre_id: 't2', pavimento_id: 't2-p12', servico_id: 's2', empreiteiro_id: 'e1', status: 'Não concluída', causa: 'Material' },
  { id: 'at5', obra_id: 'o1', semana_inicio: '2026-11-09', torre_id: 't1', pavimento_id: 't1-p6', servico_id: 's4', empreiteiro_id: 'e3', status: 'Concluída', causa: null },
  { id: 'at6', obra_id: 'o1', semana_inicio: '2026-11-02', torre_id: 't1', pavimento_id: 't1-p13', servico_id: 's3', empreiteiro_id: 'e1', status: 'Concluída', causa: null },
  { id: 'at7', obra_id: 'o1', semana_inicio: '2026-11-02', torre_id: 't2', pavimento_id: 't2-p11', servico_id: 's3', empreiteiro_id: 'e1', status: 'Não concluída', causa: 'Clima' },
  { id: 'at8', obra_id: 'o1', semana_inicio: '2026-11-02', torre_id: 't1', pavimento_id: 't1-p5', servico_id: 's4', empreiteiro_id: 'e3', status: 'Concluída', causa: null },
  { id: 'at9', obra_id: 'o1', semana_inicio: '2026-11-02', torre_id: 't2', pavimento_id: 't2-p11', servico_id: 's1', empreiteiro_id: 'e2', status: 'Concluída', causa: null },
  { id: 'at10', obra_id: 'o1', semana_inicio: '2026-10-26', torre_id: 't1', pavimento_id: 't1-p12', servico_id: 's3', empreiteiro_id: 'e1', status: 'Concluída', causa: null },
  { id: 'at11', obra_id: 'o1', semana_inicio: '2026-10-26', torre_id: 't2', pavimento_id: 't2-p10', servico_id: 's3', empreiteiro_id: 'e1', status: 'Concluída', causa: null },
  { id: 'at12', obra_id: 'o1', semana_inicio: '2026-10-26', torre_id: 't1', pavimento_id: 't1-p4', servico_id: 's4', empreiteiro_id: 'e3', status: 'Não concluída', causa: 'Mão de obra' },
  { id: 'at13', obra_id: 'o2', semana_inicio: '2026-11-09', torre_id: 'ba', pavimento_id: 'ba-p3', servico_id: 's7', empreiteiro_id: 'e5', status: 'Concluída', causa: null },
  { id: 'at14', obra_id: 'o2', semana_inicio: '2026-11-09', torre_id: 'bb', pavimento_id: 'bb-p2', servico_id: 's7', empreiteiro_id: 'e5', status: 'Programada', causa: null },
]

export const mockRestricoes = [
  { id: 'r1', obra_id: 'o1', torre_id: 't2', pavimento_id: 't2-p12', servico_id: 's2', tipo: 'Material', descricao: 'Aço CA-50 10 mm não entregue', data_abertura: '2026-11-08', responsavel_id: 'p4', data_prometida: '2026-11-14', data_remocao: null, status: 'Aberta', criado_por_id: 'p2' },
  { id: 'r2', obra_id: 'o1', torre_id: 't1', pavimento_id: null, servico_id: null, tipo: 'Equipamento', descricao: 'Grua em manutenção preventiva', data_abertura: '2026-11-12', responsavel_id: 'p2', data_prometida: null, data_remocao: null, status: 'Aberta', criado_por_id: 'p2' },
  { id: 'r3', obra_id: 'o1', torre_id: 't3', pavimento_id: 't3-p1', servico_id: 's1', tipo: 'Projeto', descricao: 'Revisão de fôrma do térreo pendente', data_abertura: '2026-10-28', responsavel_id: 'p2', data_prometida: null, data_remocao: null, status: 'Aberta', criado_por_id: 'p2' },
  { id: 'r4', obra_id: 'o1', torre_id: 't1', pavimento_id: 't1-p6', servico_id: 's4', tipo: 'Mão de obra', descricao: 'Equipe reduzida', data_abertura: '2026-11-03', responsavel_id: 'p2', data_prometida: null, data_remocao: '2026-11-06', status: 'Removida', criado_por_id: 'p3' },
  { id: 'r5', obra_id: 'o2', torre_id: 'bb', pavimento_id: 'bb-p2', servico_id: 's7', tipo: 'Material', descricao: 'Bloco estrutural 14 em falta', data_abertura: '2026-11-11', responsavel_id: 'p2', data_prometida: '2026-11-16', data_remocao: null, status: 'Aberta', criado_por_id: 'p2' },
]

// ---------- Notas e almoxarifado ----------
export const mockFornecedores = [
  { id: 'fo1', obra_id: 'o1', nome: 'Aços Norte', cnpj: null },
  { id: 'fo2', obra_id: 'o1', nome: 'Cimentos Sul', cnpj: null },
  { id: 'fo3', obra_id: 'o1', nome: 'Blocos Leste', cnpj: null },
  { id: 'fo4', obra_id: 'o1', nome: 'Argamassas Oeste', cnpj: null },
  { id: 'fo5', obra_id: 'o2', nome: 'Blocos Centro', cnpj: null },
]

export const mockInsumos = [
  { id: 'in1', obra_id: 'o1', nome: 'Aço CA-50 10 mm', unidade: 'kg' },
  { id: 'in2', obra_id: 'o1', nome: 'Cimento CP-II', unidade: 'saco' },
  { id: 'in3', obra_id: 'o1', nome: 'Bloco de concreto 14', unidade: 'un' },
  { id: 'in4', obra_id: 'o1', nome: 'Argamassa estabilizada', unidade: 'm³' },
  { id: 'in5', obra_id: 'o2', nome: 'Bloco estrutural 14', unidade: 'un' },
]

const nota = (id, obra_id, fase_id, fornecedor_id, numero, data_emissao, valor_total, status, extra = {}) => ({
  id, obra_id, fase_id, fornecedor_id, numero, data_emissao, valor_total, anexo_url: null, status,
  observacao_conferencia: null, lancada_por_id: 'p4', conferida_por_id: null, conferida_em: null,
  validada_por_id: null, validada_em: null, ...extra,
})

// Uma nota de cada status na o1; uma só, recém-lançada, na o2.
export const mockNotas = [
  nota('n1', 'o1', 'f1', 'fo1', '4410', '2026-11-06', 148200, 'Aguardando material'),
  nota('n2', 'o1', 'f1', 'fo2', '9912', '2026-11-09', 21450, 'Validada', { conferida_por_id: 'p5', conferida_em: '2026-11-10', validada_por_id: 'p4', validada_em: '2026-11-10' }),
  nota('n3', 'o1', 'f1', 'fo3', '2031', '2026-11-11', 37800, 'Divergente', { conferida_por_id: 'p5', conferida_em: '2026-11-12', observacao_conferencia: 'Faltaram 2 paletes.' }),
  nota('n4', 'o1', 'f2', 'fo2', '5520', '2026-11-12', 9750, 'Recebida conferida', { conferida_por_id: 'p5', conferida_em: '2026-11-13' }),
  nota('n5', 'o1', 'f1', 'fo4', '7781', '2026-11-13', 12300, 'Lançada'),
  nota('n6', 'o2', 'f3', 'fo5', '3310', '2026-11-12', 30600, 'Lançada'),
]

export const mockNotaItens = [
  { id: 'ni1', obra_id: 'o1', nota_id: 'n1', insumo_id: 'in1', quantidade: 19000, valor_unitario: 7.8, quantidade_recebida: null },
  { id: 'ni2', obra_id: 'o1', nota_id: 'n2', insumo_id: 'in2', quantidade: 650, valor_unitario: 33, quantidade_recebida: 650 },
  { id: 'ni3', obra_id: 'o1', nota_id: 'n3', insumo_id: 'in3', quantidade: 12000, valor_unitario: 3.15, quantidade_recebida: 11760 },
  { id: 'ni4', obra_id: 'o1', nota_id: 'n4', insumo_id: 'in2', quantidade: 300, valor_unitario: 32.5, quantidade_recebida: 300 },
  { id: 'ni5', obra_id: 'o1', nota_id: 'n5', insumo_id: 'in4', quantidade: 30, valor_unitario: 410, quantidade_recebida: null },
  { id: 'ni6', obra_id: 'o2', nota_id: 'n6', insumo_id: 'in5', quantidade: 9000, valor_unitario: 3.4, quantidade_recebida: null },
]
