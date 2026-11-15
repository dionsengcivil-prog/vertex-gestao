// Regras de medição de empreiteiro. Sem React e sem banco: é o que o teste alcança.

const arredondar = (v) => Math.round(v * 100) / 100

// O preço não mora no avanço: vem do item de contrato com o mesmo empreiteiro,
// serviço e torre. Sem item correspondente, o avanço vale zero (e não aparece
// como dinheiro inventado).
export function precoDoAvanco(avanco, contratos, itens) {
  const contratosDoEmpreiteiro = contratos
    .filter((c) => c.empreiteiro_id === avanco.empreiteiro_id)
    .map((c) => c.id)
  const item = itens.find(
    (i) =>
      contratosDoEmpreiteiro.includes(i.contrato_id) &&
      i.servico_id === avanco.servico_id &&
      i.torre_id === avanco.torre_id,
  )
  return item ? item.preco_unitario : 0
}

export function valorDoAvanco(avanco, contratos, itens) {
  return arredondar(avanco.quantidade * precoDoAvanco(avanco, contratos, itens))
}

// Pronto para medir = avanço Conferido que ainda não entrou em nenhuma medição.
export function estaProntoParaMedir(avanco) {
  return avanco.status === 'Conferido' && !avanco.medicao_id
}

// Uma linha por empreiteiro, com o total e o valor por torre. Maior valor primeiro.
export function prontoParaMedir(avancos, contratos, itens) {
  const porEmpreiteiro = new Map()
  for (const avanco of avancos.filter(estaProntoParaMedir)) {
    const valor = valorDoAvanco(avanco, contratos, itens)
    const linha = porEmpreiteiro.get(avanco.empreiteiro_id) || {
      empreiteiro_id: avanco.empreiteiro_id, total: 0, porTorre: {}, avancos: [],
    }
    linha.total = arredondar(linha.total + valor)
    linha.porTorre[avanco.torre_id] = arredondar((linha.porTorre[avanco.torre_id] || 0) + valor)
    linha.avancos.push(avanco)
    porEmpreiteiro.set(avanco.empreiteiro_id, linha)
  }
  return [...porEmpreiteiro.values()].sort((a, b) => b.total - a.total)
}

// Medição aprovada tem o valor gravado; as outras são calculadas dos avanços incluídos.
export function valorDaMedicao(medicao, avancos, contratos, itens) {
  if (medicao.status === 'Aprovada' && medicao.valor_total != null) return medicao.valor_total
  const subtotal = avancos
    .filter((a) => a.medicao_id === medicao.id)
    .reduce((soma, a) => soma + valorDoAvanco(a, contratos, itens), 0)
  return arredondar(subtotal - (medicao.desconto || 0))
}

export function resumoDoContrato(contrato, itens, medicoes, avancos, contratos) {
  const itensDoContrato = itens.filter((i) => i.contrato_id === contrato.id)
  const contratado = itensDoContrato.reduce((s, i) => s + i.quantidade_contratada * i.preco_unitario, 0)
  const medido = medicoes
    .filter((m) => m.contrato_id === contrato.id && m.status === 'Aprovada')
    .reduce((s, m) => s + (m.valor_total || 0), 0)
  const pronto = avancos
    .filter((a) => a.empreiteiro_id === contrato.empreiteiro_id && estaProntoParaMedir(a))
    .reduce((s, a) => s + valorDoAvanco(a, contratos, itens), 0)
  return {
    contratado: arredondar(contratado),
    medido: arredondar(medido),
    saldo: arredondar(contratado - medido),
    pronto: arredondar(pronto),
    percentual: contratado ? Math.round((100 * medido) / contratado) : 0,
  }
}

export function tomDaMedicao(status) {
  return { 'Aprovada': 'ok', 'Aguardando aprovação': 'warn', 'Devolvida': 'bad' }[status] || ''
}

export function tomDoAvanco(status) {
  return { 'Conferido': 'ok', 'Medido': 'info' }[status] || ''
}
