// Regras do ciclo de laje, das restrições, do PPC e do efetivo.
import { diasEntre, mesmoMes, segundaDaSemana, somarDias } from './datas.js'

export const ETAPAS_CICLO = ['Não iniciado', 'Pilares e escada', 'Laje', 'Concretado']

const emExecucao = (p) => p.etapa_ciclo === 'Pilares e escada' || p.etapa_ciclo === 'Laje'

// O retrato do ciclo de uma torre no dia `hoje`.
export function cicloDaTorre(torre, pavimentos, hoje) {
  const pavs = pavimentos.filter((p) => p.torre_id === torre.id).sort((a, b) => a.ordem - b.ordem)
  const concretados = pavs.filter((p) => p.etapa_ciclo === 'Concretado')
  const ultimo = concretados[concretados.length - 1] || null
  const executando = [...pavs].reverse().find(emExecucao) || null
  const atual = executando || pavs.find((p) => p.etapa_ciclo === 'Não iniciado') || ultimo
  // O ciclo começa na data real dos pilares; dia 1 é o próprio dia do início.
  const dia = executando && executando.data_real_pilares ? diasEntre(executando.data_real_pilares, hoje) + 1 : null
  const atrasoUltimo =
    ultimo && ultimo.data_prevista_concretagem && ultimo.data_real_concretagem
      ? diasEntre(ultimo.data_prevista_concretagem, ultimo.data_real_concretagem)
      : 0
  return {
    atual,
    etapa: executando ? executando.etapa_ciclo : 'Não iniciado',
    dia,
    meta: torre.meta_ciclo_dias,
    lajesNoMes: concretados.filter((p) => p.data_real_concretagem && mesmoMes(p.data_real_concretagem, hoje)).length,
    metaMes: torre.meta_lajes_mes,
    concretados: concretados.length,
    total: pavs.length,
    ultimo,
    atrasoUltimo,
  }
}

// verde = dentro da meta; âmbar = a laje anterior atrasou; vermelho = ciclo estourou a meta.
export function tomDoCiclo(ciclo) {
  if (ciclo.dia == null) return ''
  if (ciclo.dia > ciclo.meta) return 'bad'
  if (ciclo.atrasoUltimo > 0) return 'warn'
  return 'ok'
}

export function tomDaEtapa(pavimento) {
  if (pavimento.etapa_ciclo === 'Não iniciado') return ''
  if (pavimento.etapa_ciclo !== 'Concretado') return 'ok'
  const atraso = atrasoDoPavimento(pavimento)
  return atraso > 3 ? 'bad' : atraso > 0 ? 'warn' : 'ok'
}

// Como cada pavimento aparece no desenho da torre.
// 'feito' | 'tarde' (concretou com até 3 dias de atraso) | 'muito-tarde' | 'fazendo' | 'a-fazer'
export function situacaoDoAndar(pavimento) {
  if (pavimento.etapa_ciclo === 'Não iniciado') return 'a-fazer'
  if (pavimento.etapa_ciclo !== 'Concretado') return 'fazendo'
  const atraso = atrasoDoPavimento(pavimento)
  return atraso > 3 ? 'muito-tarde' : atraso > 0 ? 'tarde' : 'feito'
}

export function atrasoDoPavimento(pavimento) {
  if (!pavimento.data_prevista_concretagem || !pavimento.data_real_concretagem) return 0
  return Math.max(0, diasEntre(pavimento.data_prevista_concretagem, pavimento.data_real_concretagem))
}

// Há quantos dias a restrição está (ou ficou) aberta.
export function diasParado(restricao, hoje) {
  return diasEntre(restricao.data_abertura, restricao.data_remocao || hoje)
}

export function tomDaRestricao(restricao, hoje) {
  if (restricao.status === 'Removida') return 'ok'
  return diasParado(restricao, hoje) >= 3 ? 'bad' : 'warn'
}

// PPC = atividades Concluída ÷ total da semana, em %. Semana sem atividade não tem PPC.
export function ppc(atividades) {
  if (!atividades.length) return null
  const concluidas = atividades.filter((a) => a.status === 'Concluída').length
  return Math.round((100 * concluidas) / atividades.length)
}

export function ppcPorSemana(atividades) {
  const semanas = [...new Set(atividades.map((a) => a.semana_inicio))].sort()
  return semanas.map((semana) => ({ semana, ppc: ppc(atividades.filter((a) => a.semana_inicio === semana)) }))
}

export function tomDaAtividade(status) {
  return { 'Concluída': 'ok', 'Não concluída': 'bad' }[status] || ''
}

// Efetivo de hoje por empreiteiro, média das duas semanas e a maior queda entre elas.
export function resumoDoEfetivo(diarios, efetivos, hoje) {
  const semanaAtual = segundaDaSemana(hoje)
  const semanaAnterior = somarDias(semanaAtual, -7)
  const dataDoDiario = new Map(diarios.map((d) => [d.id, d.data]))
  const datas = [...new Set(diarios.map((d) => d.data))].filter((d) => d <= hoje).sort()
  const ontem = datas.filter((d) => d < hoje).pop() || null

  const somaNoDia = (empreiteiroId, data) =>
    efetivos
      .filter((e) => e.empreiteiro_id === empreiteiroId && dataDoDiario.get(e.diario_id) === data)
      .reduce((s, e) => s + e.quantidade, 0)
  const mediaNaSemana = (empreiteiroId, inicio) => {
    const dias = datas.filter((d) => d >= inicio && d < somarDias(inicio, 7))
    if (!dias.length) return null
    return dias.reduce((s, d) => s + somaNoDia(empreiteiroId, d), 0) / dias.length
  }

  const linhas = [...new Set(efetivos.map((e) => e.empreiteiro_id))].map((id) => {
    const mediaAtual = mediaNaSemana(id, semanaAtual)
    const mediaAnterior = mediaNaSemana(id, semanaAnterior)
    return {
      empreiteiro_id: id,
      hoje: somaNoDia(id, hoje),
      ontem: ontem ? somaNoDia(id, ontem) : null,
      mediaAtual,
      mediaAnterior,
      queda: mediaAtual != null && mediaAnterior != null ? mediaAnterior - mediaAtual : 0,
    }
  })
  linhas.sort((a, b) => b.hoje - a.hoje)
  const maior = [...linhas].sort((a, b) => b.queda - a.queda)[0]
  return {
    temDiarioHoje: datas.includes(hoje),
    totalHoje: linhas.reduce((s, l) => s + l.hoje, 0),
    totalOntem: ontem ? linhas.reduce((s, l) => s + (l.ontem || 0), 0) : null,
    linhas,
    maiorQueda: maior && maior.queda > 0 ? maior.empreiteiro_id : null,
  }
}
