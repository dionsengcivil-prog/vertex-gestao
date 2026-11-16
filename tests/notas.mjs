// Notas e almoxarifado: o caminho da nota, quem pode cada passo e a separação entre obras.
import * as dados from '../src/lib/dados.js'
import { conferirRecebimento, totalDaNota, transicaoDaNota } from '../src/lib/fluxos.js'
import { menuDoPerfil } from '../src/lib/perfis.js'

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
const administrativo = { id: 'p4', role: 'administrativo' }
const almoxarife = { id: 'p5', role: 'almoxarife' }
const mestre = { id: 'p6', role: 'mestre' }
const entrar = (pessoa, obra = 'o1') => { dados.definirUsuarioAtual(pessoa); dados.definirObraAtual(obra) }
const SEM_PERMISSAO = 'Seu perfil não pode fazer isso.'

// ---------- Regras puras ----------
const itens = [{ id: 'a', quantidade: 100, valor_unitario: 2.5 }, { id: 'b', quantidade: 10, valor_unitario: 33.33 }]
conferir('total da nota soma quantidade × valor, com centavos certos', totalDaNota(itens), 583.3)
conferir('tudo igual = Recebida conferida', conferirRecebimento({ status: 'Lançada' }, itens, { a: '100', b: 10 }), { status: 'Recebida conferida' })
conferir('quantidade diferente sem observação é recusada', Boolean(conferirRecebimento({ status: 'Lançada' }, itens, { a: 90, b: 10 }).erro), true)
conferir('quantidade diferente com observação = Divergente', conferirRecebimento({ status: 'Lançada' }, itens, { a: 90, b: 10 }, 'faltou'), { status: 'Divergente' })
conferir('item sem quantidade recebida é recusado', Boolean(conferirRecebimento({ status: 'Lançada' }, itens, { a: 100, b: '' }).erro), true)
conferir('nota sem item não é conferida', Boolean(conferirRecebimento({ status: 'Lançada' }, [], {}).erro), true)
conferir('nota Divergente não é validada', Boolean(transicaoDaNota({ status: 'Divergente' }, 'validar').erro), true)
conferir('nota Lançada não pula direto para Validada', Boolean(transicaoDaNota({ status: 'Lançada' }, 'validar').erro), true)

// ---------- Quem vê ----------
conferir('mestre e assistente não têm Notas no menu', ['mestre', 'assistente', 'diretoria', 'cliente'].filter((r) => menuDoPerfil(r).includes('notas')), [])
entrar(mestre)
conferir('mestre não lê notas', (await dados.carregarNotas()).erro, SEM_PERMISSAO)
entrar(assistente)
conferir('assistente não lê notas', (await dados.carregarNotas()).erro, SEM_PERMISSAO)
entrar(planejador)
conferir('planejador lê as notas', (await dados.carregarNotas()).data.notas.length, 5)
conferir('planejador não lança nota', (await dados.salvarNota({ fornecedor_id: 'fo1', numero: '1', data_emissao: '2026-11-13', fase_id: 'f1' })).erro, SEM_PERMISSAO)

// ---------- O caminho inteiro de uma nota nova ----------
entrar(administrativo)
const base = { numero: '8001', data_emissao: '2026-11-13', fase_id: 'f1' }
conferir('nota sem fornecedor é recusada', Boolean((await dados.salvarNota(base)).erro), true)
conferir('emissão no futuro é recusada', Boolean((await dados.salvarNota({ ...base, fornecedor_id: 'fo1', data_emissao: '2026-12-01' })).erro), true)
const { data: nota } = await dados.salvarNota({ ...base, novo_fornecedor: 'Madeiras Modelo' })
conferir('nota nasce Lançada, na obra em uso, com quem lançou', [nota.status, nota.obra_id, nota.lancada_por_id, nota.valor_total], ['Lançada', 'o1', 'p4', 0])
conferir('fornecedor novo entra na lista', (await dados.carregarNotas()).data.fornecedores.some((f) => f.nome === 'Madeiras Modelo'), true)
conferir('mesma nota do mesmo fornecedor não entra duas vezes', Boolean((await dados.salvarNota({ ...base, novo_fornecedor: 'madeiras modelo' })).erro), true)

await dados.adicionarItemDaNota(nota.id, { insumo_id: 'in2', quantidade: '100', valor_unitario: '33' })
const { data: itemNovo } = await dados.adicionarItemDaNota(nota.id, { novo_insumo: 'Sarrafo 2,5 × 10', unidade: 'm', quantidade: '200', valor_unitario: '4.5' })
conferir('o mesmo insumo não entra duas vezes na nota', Boolean((await dados.adicionarItemDaNota(nota.id, { insumo_id: 'in2', quantidade: 1, valor_unitario: 1 })).erro), true)
conferir('insumo novo sem unidade é recusado', Boolean((await dados.adicionarItemDaNota(nota.id, { novo_insumo: 'Prego', quantidade: 1, valor_unitario: 1 })).erro), true)
const lerNota = async () => (await dados.carregarNotas()).data.notas.find((n) => n.id === nota.id)
conferir('o total acompanha os itens (100 × 33 + 200 × 4,50)', (await lerNota()).valor_total, 4200)

conferir('administrativo não confere recebimento', (await dados.conferirNota(nota.id, {})).erro, SEM_PERMISSAO)
conferir('nota não conferida não é validada', Boolean((await dados.mudarStatusDaNota(nota.id, 'validar')).erro), true)
conferir('administrativo marca Aguardando material', (await dados.mudarStatusDaNota(nota.id, 'aguardar')).data.status, 'Aguardando material')

entrar(almoxarife)
const { data: doAlmoxarife } = await dados.carregarNotas()
const itensDaNota = doAlmoxarife.itens.filter((i) => i.nota_id === nota.id)
conferir('almoxarife vê o valor da nota', doAlmoxarife.notas.find((n) => n.id === nota.id).valor_total, 4200)
const tudoCerto = Object.fromEntries(itensDaNota.map((i) => [i.id, i.quantidade]))
conferir('faltou material sem explicar: recusado', Boolean((await dados.conferirNota(nota.id, { ...tudoCerto, [itemNovo.id]: 180 })).erro), true)
conferir('faltou material com observação: Divergente',
  (await dados.conferirNota(nota.id, { ...tudoCerto, [itemNovo.id]: 180 }, 'Faltaram 20 m.')).data.status, 'Divergente')
conferir('almoxarife não valida', (await dados.mudarStatusDaNota(nota.id, 'validar')).erro, SEM_PERMISSAO)
conferir('depois da conferência os itens não mudam mais', Boolean((await dados.removerItemDaNota(nota.id, itemNovo.id)).erro), true)
conferir('chegou o resto: conferir de novo vira Recebida conferida', (await dados.conferirNota(nota.id, tudoCerto)).data.status, 'Recebida conferida')

entrar(administrativo)
const { data: validada } = await dados.mudarStatusDaNota(nota.id, 'validar')
conferir('administrativo valida, com data e autor', [validada.status, validada.validada_por_id, validada.validada_em], ['Validada', 'p4', '2026-11-13'])
entrar(almoxarife)
conferir('nota validada não é conferida de novo', Boolean((await dados.conferirNota(nota.id, tudoCerto)).erro), true)

// ---------- Multi-obra ----------
entrar(gerente, 'o2')
const { data: daObra2 } = await dados.carregarNotas()
conferir('na obra 2 só aparecem as notas da obra 2', daObra2.notas.map((n) => n.numero), ['3310'])
conferir('fornecedor e insumo da obra 1 não aparecem na obra 2',
  [daObra2.fornecedores.every((f) => f.obra_id === 'o2'), daObra2.insumos.every((i) => i.obra_id === 'o2')], [true, true])
conferir('na obra 2, uma nota da obra 1 não existe', (await dados.mudarStatusDaNota('n4', 'validar')).erro, 'Nota não encontrada nesta obra.')
conferir('na obra 2, fase da obra 1 não aceita nota',
  Boolean((await dados.salvarNota({ fornecedor_id: 'fo5', numero: '1', data_emissao: '2026-11-13', fase_id: 'f1' })).erro), true)
conferir('na obra 2, fornecedor da obra 1 não serve',
  Boolean((await dados.salvarNota({ fornecedor_id: 'fo1', numero: '1', data_emissao: '2026-11-13', fase_id: 'f3' })).erro), true)

console.log(`${ok}/${tot} — notas`)
process.exit(ok === tot ? 0 : 1)
