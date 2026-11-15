// O que pode mudar de status, e quando. Regra pura: é daqui que as telas e a
// camada de dados tiram a decisão. Os textos de status são os do PRD-BACKEND.

const erro = (texto) => ({ erro: texto })

// ---------- Avanço: Lançado → Conferido → Medido ----------

export function avancoEditavel(avanco) {
  return avanco.status === 'Lançado'
}

export function transicaoDoAvanco(avanco, acao) {
  if (acao === 'conferir') {
    return avanco.status === 'Lançado' ? { status: 'Conferido' } : erro('Só avanço Lançado pode ser conferido.')
  }
  if (acao === 'desfazer') {
    if (avanco.status !== 'Conferido') return erro('Só avanço Conferido pode voltar para Lançado.')
    if (avanco.medicao_id) return erro('Este avanço está numa medição. Tire-o da medição antes.')
    return { status: 'Lançado' }
  }
  return erro('Ação desconhecida.')
}

// O empreiteiro precisa ter contrato Ativo com este serviço nesta torre;
// sem isso o avanço nunca viraria medição.
export function validarAvanco(avanco, contratos, itens) {
  if (!(avanco.quantidade > 0)) return 'A quantidade precisa ser maior que zero.'
  const ativos = contratos.filter((c) => c.empreiteiro_id === avanco.empreiteiro_id && c.status === 'Ativo').map((c) => c.id)
  const temItem = itens.some((i) => ativos.includes(i.contrato_id) && i.servico_id === avanco.servico_id && i.torre_id === avanco.torre_id)
  return temItem ? null : 'Este empreiteiro não tem contrato ativo para este serviço nesta torre.'
}

// ---------- Ciclo de laje ----------

export function validarCiclo(pavimento) {
  const executando = pavimento.etapa_ciclo === 'Pilares e escada' || pavimento.etapa_ciclo === 'Laje'
  if ((executando || pavimento.etapa_ciclo === 'Concretado') && !pavimento.data_real_pilares) {
    return 'Informe a data real de início dos pilares: é dela que o ciclo é contado.'
  }
  if (pavimento.etapa_ciclo === 'Concretado' && !pavimento.data_real_concretagem) {
    return 'Para marcar como Concretado, informe a data real da concretagem.'
  }
  return null
}

// ---------- Programação ----------

export function validarAtividade(atividade) {
  if (atividade.status === 'Não concluída' && !atividade.causa) return 'Informe a causa da não conclusão.'
  return null
}

// ---------- Diário: Rascunho → Enviado → Revisado ----------

export function diarioEditavel(diario) {
  return diario.status === 'Rascunho'
}

export function transicaoDoDiario(diario, acao, linhasDeEfetivo) {
  if (acao === 'enviar') {
    if (diario.status !== 'Rascunho') return erro('Só diário em Rascunho pode ser enviado.')
    if (!linhasDeEfetivo) return erro('Adicione o efetivo de pelo menos um empreiteiro antes de enviar.')
    return { status: 'Enviado' }
  }
  if (acao === 'revisar') return diario.status === 'Enviado' ? { status: 'Revisado' } : erro('Só diário Enviado pode ser revisado.')
  if (acao === 'devolver') return diario.status === 'Enviado' ? { status: 'Rascunho' } : erro('Só diário Enviado pode ser devolvido.')
  return erro('Ação desconhecida.')
}

// ---------- Medição: Em preparo → Aguardando aprovação → Aprovada | Devolvida ----------

export function medicaoEditavel(medicao) {
  return medicao.status === 'Em preparo' || medicao.status === 'Devolvida'
}

export function transicaoDaMedicao(medicao, acao, { avancosIncluidos = 0, motivo = '' } = {}) {
  if (acao === 'enviar') {
    if (!medicaoEditavel(medicao)) return erro('Esta medição não está em preparo.')
    if (!avancosIncluidos) return erro('Inclua pelo menos um avanço conferido antes de enviar.')
    return { status: 'Aguardando aprovação' }
  }
  if (medicao.status !== 'Aguardando aprovação') return erro('Só medição aguardando aprovação pode ser aprovada ou devolvida.')
  if (acao === 'aprovar') return { status: 'Aprovada' }
  if (acao === 'devolver') return motivo.trim() ? { status: 'Devolvida' } : erro('Escreva o motivo da devolução.')
  return erro('Ação desconhecida.')
}

// Avanço que pode entrar numa medição: conferido, do mesmo empreiteiro, ainda livre.
export function podeEntrarNaMedicao(avanco, contrato) {
  return avanco.status === 'Conferido' && !avanco.medicao_id && avanco.empreiteiro_id === contrato.empreiteiro_id
}

// ---------- Obra ----------

export const SITUACOES_DA_OBRA = ['Em andamento', 'Concluída', 'Parada']

export function validarObra(obra, outras) {
  const codigo = (obra.codigo || '').trim().toUpperCase()
  if (outras.some((o) => o.id !== obra.id && o.codigo.toUpperCase() === codigo)) return 'Já existe uma obra com este código.'
  if (obra.data_meta_entrega && obra.data_meta_entrega < obra.data_inicio) return 'A data-meta de entrega não pode ser antes do início.'
  return null
}
