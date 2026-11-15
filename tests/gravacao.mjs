// O caminho de gravação inteiro, pela camada de dados, em Node puro:
// lançar → conferir → medir → aprovar, as travas de status, as permissões e
// a separação entre obras.
import * as dados from '../src/lib/dados.js'
import { transicaoDaMedicao, transicaoDoAvanco, transicaoDoDiario, validarCiclo, validarObra } from '../src/lib/fluxos.js'

let ok = 0
let tot = 0

function conferir(descricao, real, esperado) {
  tot++
  if (JSON.stringify(real) === JSON.stringify(esperado)) {
    ok++
  } else {
    console.log(`  ✗ ${descricao}`)
    console.log(`     esperado: ${JSON.stringify(esperado)}`)
    console.log(`     veio:     ${JSON.stringify(real)}`)
  }
}

const gerente = { id: 'p1', role: 'gerente' }
const planejador = { id: 'p2', role: 'planejador' }
const assistente = { id: 'p3', role: 'assistente' }
const mestre = { id: 'p6', role: 'mestre' }
const entrar = (pessoa, obra = 'o1') => { dados.definirUsuarioAtual(pessoa); dados.definirObraAtual(obra) }
const SEM_PERMISSAO = 'Seu perfil não pode fazer isso.'

// ---------- Regras puras de transição ----------
conferir('avanço Lançado pode ser conferido', transicaoDoAvanco({ status: 'Lançado' }, 'conferir'), { status: 'Conferido' })
conferir('avanço Medido não volta', Boolean(transicaoDoAvanco({ status: 'Medido' }, 'desfazer').erro), true)
conferir('avanço em medição não desfaz a conferência', Boolean(transicaoDoAvanco({ status: 'Conferido', medicao_id: 'x' }, 'desfazer').erro), true)
conferir('diário sem efetivo não é enviado', Boolean(transicaoDoDiario({ status: 'Rascunho' }, 'enviar', 0).erro), true)
conferir('diário com efetivo é enviado', transicaoDoDiario({ status: 'Rascunho' }, 'enviar', 2), { status: 'Enviado' })
conferir('diário Revisado não é devolvido', Boolean(transicaoDoDiario({ status: 'Revisado' }, 'devolver', 2).erro), true)
conferir('medição vazia não é enviada', Boolean(transicaoDaMedicao({ status: 'Em preparo' }, 'enviar', { avancosIncluidos: 0 }).erro), true)
conferir('medição em preparo não é aprovada direto', Boolean(transicaoDaMedicao({ status: 'Em preparo' }, 'aprovar').erro), true)
conferir('devolver exige motivo', Boolean(transicaoDaMedicao({ status: 'Aguardando aprovação' }, 'devolver', { motivo: '  ' }).erro), true)
conferir('Concretado exige data real de concretagem',
  Boolean(validarCiclo({ etapa_ciclo: 'Concretado', data_real_pilares: '2026-11-01', data_real_concretagem: null })), true)
conferir('laje em execução exige data real dos pilares', Boolean(validarCiclo({ etapa_ciclo: 'Laje', data_real_pilares: null })), true)
conferir('código de obra repetido é recusado',
  Boolean(validarObra({ codigo: 'rm-01', data_inicio: '2026-01-01' }, [{ id: 'o1', codigo: 'RM-01' }])), true)
conferir('meta de entrega antes do início é recusada',
  Boolean(validarObra({ codigo: 'X', data_inicio: '2026-05-01', data_meta_entrega: '2026-04-01' }, [])), true)

// ---------- Lançar e conferir avanço ----------
entrar(assistente)
const novo = { pavimento_id: 't1-p14', servico_id: 's3', empreiteiro_id: 'e1', quantidade: '200', data: '2026-11-13' }
conferir('avanço sem contrato para o serviço na torre é recusado',
  Boolean((await dados.salvarAvanco({ ...novo, servico_id: 's6' })).erro), true)
conferir('quantidade zero é recusada', Boolean((await dados.salvarAvanco({ ...novo, quantidade: '0' })).erro), true)
const { data: avanco } = await dados.salvarAvanco(novo)
conferir('avanço nasce Lançado, na obra em uso, com quem lançou',
  [avanco.status, avanco.obra_id, avanco.torre_id, avanco.lancado_por_id, avanco.quantidade], ['Lançado', 'o1', 't1', 'p3', 200])
conferir('assistente não confere', (await dados.mudarStatusDoAvanco(avanco.id, 'conferir')).erro, SEM_PERMISSAO)

entrar(planejador)
conferir('planejador confere', (await dados.mudarStatusDoAvanco(avanco.id, 'conferir')).data.status, 'Conferido')
conferir('avanço conferido não pode mais ser excluído', Boolean((await dados.excluirAvanco(avanco.id)).erro), true)

// ---------- Medir e aprovar ----------
const { data: medicao } = await dados.criarMedicao('c1', { periodo_inicio: '2026-11-11', periodo_fim: '2026-11-13' })
conferir('medição nova continua a numeração do contrato', [medicao.numero, medicao.status], [8, 'Em preparo'])
conferir('medição vazia não é enviada', Boolean((await dados.mudarStatusDaMedicao(medicao.id, 'enviar')).erro), true)
conferir('avanço de outro empreiteiro não entra', Boolean((await dados.alternarAvancoNaMedicao(medicao.id, 'a2')).erro), true)
await dados.alternarAvancoNaMedicao(medicao.id, avanco.id)
conferir('planejador não aprova', (await dados.mudarStatusDaMedicao(medicao.id, 'aprovar')).erro, SEM_PERMISSAO)
conferir('planejador envia', (await dados.mudarStatusDaMedicao(medicao.id, 'enviar')).data.status, 'Aguardando aprovação')
conferir('medição enviada não aceita mais avanço', Boolean((await dados.alternarAvancoNaMedicao(medicao.id, 'a3')).erro), true)

entrar(gerente)
const { data: aprovada } = await dados.mudarStatusDaMedicao(medicao.id, 'aprovar')
conferir('gerente aprova e o valor fica gravado (200 m³ × R$ 95)', [aprovada.status, aprovada.valor_total], ['Aprovada', 19000])
const { data: depois } = await dados.carregarPavimento('t1-p14')
conferir('aprovar passa o avanço a Medido', depois.avancos.find((a) => a.id === avanco.id).status, 'Medido')
conferir('avanço Medido não desfaz', Boolean((await dados.mudarStatusDoAvanco(avanco.id, 'desfazer')).erro), true)
conferir('medição aprovada não é aprovada de novo', Boolean((await dados.mudarStatusDaMedicao(medicao.id, 'aprovar')).erro), true)

// ---------- Dinheiro ----------
entrar(mestre)
conferir('mestre não lê contratos nem medições', (await dados.carregarMedicoes()).erro, SEM_PERMISSAO)
entrar(assistente)
conferir('assistente não lê contratos nem medições', (await dados.carregarMedicoes()).erro, SEM_PERMISSAO)

// ---------- Ciclo ----------
entrar(assistente)
conferir('assistente não muda data prevista',
  (await dados.atualizarCiclo('t1-p15', { data_prevista_concretagem: '2027-01-01' })).data.data_prevista_concretagem, '2026-11-21')
conferir('não marca Concretado sem data real',
  Boolean((await dados.atualizarCiclo('t1-p14', { etapa_ciclo: 'Concretado', data_real_concretagem: '' })).erro), true)
conferir('marca Concretado com a data real',
  (await dados.atualizarCiclo('t1-p14', { etapa_ciclo: 'Concretado', data_real_concretagem: '2026-11-14' })).data.etapa_ciclo, 'Concretado')

// ---------- Diário ----------
entrar(mestre)
const { data: diarioHoje } = await dados.abrirDiarioDeHoje()
conferir('o diário de hoje que já existe é reaproveitado', diarioHoje.id, 'd-1113')
conferir('mestre não revisa', (await dados.mudarStatusDoDiario('d-1112', 'revisar')).erro, SEM_PERMISSAO)
conferir('diário revisado não aceita efetivo',
  Boolean((await dados.adicionarEfetivo('d-1111', { empreiteiro_id: 'e1', torre_id: 't1', quantidade: 5 })).erro), true)
conferir('mestre envia o diário de hoje', (await dados.mudarStatusDoDiario('d-1113', 'enviar')).data.status, 'Enviado')
conferir('depois de enviado, o mestre não altera mais',
  Boolean((await dados.salvarDiario('d-1113', { clima_manha: 'Sol', clima_tarde: 'Sol' })).erro), true)

// ---------- Multi-obra: nada atravessa de uma obra para a outra ----------
entrar(gerente, 'o2')
conferir('na obra 2, um avanço da obra 1 não existe', (await dados.mudarStatusDoAvanco('a4', 'conferir')).erro, 'Avanço não encontrado nesta obra.')
conferir('na obra 2, um pavimento da obra 1 não aceita avanço', Boolean((await dados.salvarAvanco(novo)).erro), true)
conferir('na obra 2, um contrato da obra 1 não aceita medição',
  Boolean((await dados.criarMedicao('c1', { periodo_inicio: '2026-11-01', periodo_fim: '2026-11-13' })).erro), true)
const { data: restricao } = await dados.salvarRestricao({ tipo: 'Projeto', torre_id: 'bc', descricao: 'Teste', responsavel_id: 'p2' })
conferir('o que se grava na obra 2 leva o obra_id da obra 2', restricao.obra_id, 'o2')
entrar(gerente, 'o1')
const { data: prog1 } = await dados.carregarProgramacao()
conferir('a restrição gravada na obra 2 não aparece na obra 1', prog1.restricoes.some((r) => r.id === restricao.id), false)
conferir('toda linha lida na obra 1 é da obra 1',
  [...prog1.restricoes, ...prog1.atividades].every((linha) => linha.obra_id === 'o1'), true)

// ---------- Abrir obra nova pela tela ----------
conferir('planejador não abre obra', (await (entrar(planejador), dados.salvarObra({ nome: 'X', codigo: 'X-1', data_inicio: '2026-12-01', situacao: 'Em andamento' }))).erro, SEM_PERMISSAO)
entrar(gerente)
const { data: obraNova } = await dados.salvarObra({ nome: 'Galpão Modelo', codigo: 'gm-03', grupo: '', data_inicio: '2026-12-01', situacao: 'Em andamento' })
conferir('obra nova nasce com o código em maiúsculas', obraNova.codigo, 'GM-03')
conferir('quem cria a obra já enxerga a obra',
  (await dados.listarObrasDoUsuario('p1')).data.map((o) => o.codigo), ['RM-01', 'CM-02', 'GM-03'])
conferir('quem não é membro não enxerga a obra nova',
  (await dados.listarObrasDoUsuario('p2')).data.map((o) => o.codigo), ['RM-01', 'CM-02'])
dados.definirObraAtual(obraNova.id)
const { data: baseNova } = await dados.carregarBase()
conferir('obra nova começa vazia: nada herdado das outras',
  [baseNova.fases.length, baseNova.torres.length, baseNova.servicos.length, baseNova.empreiteiros.length], [0, 0, 0, 0])
const { data: fase } = await dados.salvarFase({ nome: 'Fase 1', centro_custo: 'CC-100' })
await dados.salvarTorre({ fase_id: fase.id, nome: 'Galpão A', tipo: 'Torre', pavimentos: '2', meta_ciclo_dias: '', meta_lajes_mes: '' })
const { data: baseDepois } = await dados.carregarBase()
conferir('criar a torre gera os pavimentos dela, na obra nova',
  [baseDepois.torres.length, baseDepois.pavimentos.length, baseDepois.pavimentos.every((p) => p.obra_id === obraNova.id)], [1, 2, true])

console.log(`${ok}/${tot} — gravação`)
process.exit(ok === tot ? 0 : 1)
