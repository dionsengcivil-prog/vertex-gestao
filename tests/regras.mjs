// Regras de negócio do Vertex Gestão, em Node puro (sem framework).
// Roda com `node tests/regras.mjs` e junto no `npm run check`.
import { prontoParaMedir, resumoDoContrato, valorDaMedicao, valorDoAvanco } from '../src/lib/medicao.js'
import { cicloDaTorre, diasParado, ppc, resumoDoEfetivo, tomDoCiclo } from '../src/lib/ciclo.js'
import { barraInferior, menuDoPerfil, pode, telaInicial } from '../src/lib/perfis.js'
import { diasEntre, segundaDaSemana, somarDias } from '../src/lib/datas.js'
import * as mock from '../src/lib/mockData.js'

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

const daObra = (lista, obra) => lista.filter((x) => x.obra_id === obra)
const o1 = {
  avancos: daObra(mock.mockAvancos, 'o1'), contratos: daObra(mock.mockContratos, 'o1'),
  itens: daObra(mock.mockContratoItens, 'o1'), medicoes: daObra(mock.mockMedicoes, 'o1'),
}

// ---------- Datas ----------
conferir('somar dias atravessa o mês', somarDias('2026-10-30', 3), '2026-11-02')
conferir('dias entre duas datas', diasEntre('2026-11-09', '2026-11-13'), 4)
conferir('sexta 13/11 cai na semana de segunda 09/11', segundaDaSemana('2026-11-13'), '2026-11-09')
conferir('a própria segunda é o início da semana', segundaDaSemana('2026-11-09'), '2026-11-09')

// ---------- Medição: é aqui que o dinheiro erra calado ----------
const forma14 = o1.avancos.find((a) => a.id === 'a2')
conferir('avanço vale quantidade × preço do item do contrato', valorDoAvanco(forma14, o1.contratos, o1.itens), 39900)
conferir('avanço sem item de contrato vale zero, não um preço inventado',
  valorDoAvanco({ ...forma14, torre_id: 't5' }, o1.contratos, o1.itens), 0)

const pronto = prontoParaMedir(o1.avancos, o1.contratos, o1.itens)
conferir('pronto para medir: uma linha por empreiteiro, maior valor primeiro',
  pronto.map((l) => [l.empreiteiro_id, l.total]), [['e2', 39900], ['e1', 31920], ['e3', 25620]])
conferir('avanço Lançado não entra no pronto para medir',
  pronto.some((l) => l.avancos.some((a) => a.status !== 'Conferido')), false)
conferir('avanço já incluído em medição não entra de novo',
  pronto.some((l) => l.avancos.some((a) => a.medicao_id)), false)
conferir('pronto para medir separa o valor por torre', pronto[0].porTorre, { t1: 39900 })

const aguardando = o1.medicoes.find((m) => m.id === 'md5')
conferir('medição em aberto é calculada dos avanços incluídos', valorDaMedicao(aguardando, o1.avancos, o1.contratos, o1.itens), 39900)
conferir('desconto abate o total da medição',
  valorDaMedicao({ ...aguardando, desconto: 900 }, o1.avancos, o1.contratos, o1.itens), 39000)
conferir('medição aprovada usa o valor gravado',
  valorDaMedicao(o1.medicoes.find((m) => m.id === 'md2'), o1.avancos, o1.contratos, o1.itens), 18525)

const resumo = resumoDoContrato(o1.contratos[0], o1.itens, o1.medicoes, o1.avancos, o1.contratos)
conferir('contratado soma todos os itens do contrato', resumo.contratado, 1710000)
conferir('medido acumulado soma só as medições aprovadas', resumo.medido, 842300)
conferir('saldo = contratado − medido', resumo.saldo, 867700)

// ---------- Multi-obra: nada de uma obra entra na conta da outra ----------
const o2 = {
  avancos: daObra(mock.mockAvancos, 'o2'), contratos: daObra(mock.mockContratos, 'o2'), itens: daObra(mock.mockContratoItens, 'o2'),
}
conferir('pronto para medir da obra 2 só tem a obra 2',
  prontoParaMedir(o2.avancos, o2.contratos, o2.itens).map((l) => [l.empreiteiro_id, l.total]), [['e5', 15120]])
const tabelasDeLancamento = ['mockFases', 'mockTorres', 'mockPavimentos', 'mockServicos', 'mockEmpreiteiros', 'mockContratos',
  'mockContratoItens', 'mockMedicoes', 'mockAvancos', 'mockDiarios', 'mockDiarioEfetivos', 'mockDiarioServicos', 'mockFotos',
  'mockAtividadesSemana', 'mockRestricoes', 'mockMembros']
conferir('toda linha de toda tabela de lançamento tem obra_id',
  tabelasDeLancamento.filter((t) => mock[t].some((linha) => !linha.obra_id)), [])

// ---------- Ciclo de laje ----------
const torre1 = mock.mockTorres.find((t) => t.id === 't1')
const ciclo1 = cicloDaTorre(torre1, mock.mockPavimentos, '2026-11-13')
conferir('pavimento em execução da Torre 1 é o 14º', ciclo1.atual.ordem, 14)
conferir('dia do ciclo conta o dia do início como dia 1', ciclo1.dia, 5)
conferir('concretados da Torre 1', [ciclo1.concretados, ciclo1.total], [13, 24])
conferir('ciclo dentro da meta, mas laje anterior atrasada = atenção', tomDoCiclo(ciclo1), 'warn')
conferir('ciclo que passa da meta = crítico', tomDoCiclo({ ...ciclo1, dia: 8 }), 'bad')
const torre3 = mock.mockTorres.find((t) => t.id === 't3')
conferir('torre não iniciada não tem dia de ciclo', cicloDaTorre(torre3, mock.mockPavimentos, '2026-11-13').dia, null)

// ---------- Restrições e PPC ----------
conferir('restrição aberta conta os dias até hoje', diasParado(mock.mockRestricoes[2], '2026-11-13'), 16)
conferir('restrição removida conta só até a remoção', diasParado(mock.mockRestricoes[3], '2026-11-13'), 3)
const semana = daObra(mock.mockAtividadesSemana, 'o1').filter((a) => a.semana_inicio === '2026-11-09')
conferir('PPC = concluídas ÷ total', ppc(semana), 60)
conferir('semana sem atividade não tem PPC', ppc([]), null)

// ---------- Efetivo ----------
const efetivo = resumoDoEfetivo(daObra(mock.mockDiarios, 'o1'), daObra(mock.mockDiarioEfetivos, 'o1'), '2026-11-13')
conferir('efetivo de hoje e de ontem', [efetivo.totalHoje, efetivo.totalOntem], [96, 104])
conferir('maior queda entre as semanas', efetivo.maiorQueda, 'e1')

// ---------- Perfis e permissões ----------
conferir('gerente abre no Painel', telaInicial('gerente'), 'painel')
conferir('mestre abre no Diário', telaInicial('mestre'), 'diario')
conferir('mestre não tem Medição nem Financeiro no menu',
  menuDoPerfil('mestre').filter((t) => ['medicao', 'financeiro', 'estrutura'].includes(t)), [])
conferir('barra inferior nunca passa de 5 itens (4 + Mais)', barraInferior('gerente').itens.length, 4)
conferir('perfil com até 5 telas não tem "Mais"', barraInferior('assistente').extras, [])
conferir('só o gerente aprova medição', ['gerente', 'planejador', 'assistente', 'mestre'].filter(pode.aprovarMedicao), ['gerente'])
conferir('mestre e assistente não veem valor', ['mestre', 'assistente', 'almoxarife', 'cliente'].filter(pode.verValores), [])
conferir('assistente lança avanço mas não confere', [pode.lancarAvanco('assistente'), pode.conferirAvanco('assistente')], [true, false])

console.log(`${ok}/${tot} — regras`)
process.exit(ok === tot ? 0 : 1)
