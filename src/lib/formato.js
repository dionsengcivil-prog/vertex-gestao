// Como números aparecem na tela.

// Cor da etiqueta de situação da obra: verde em andamento, vermelho parada.
export function tomDaSituacao(situacao) {
  return { 'Em andamento': 'ok', 'Parada': 'bad', 'Concluída': 'info' }[situacao] || ''
}

export function moeda(valor) {
  return 'R$ ' + Math.round(valor || 0).toLocaleString('pt-BR')
}

// Preço unitário, sempre com centavos: "R$ 2,10".
export function preco(valor) {
  return 'R$ ' + (valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// "97,4" para 97.440 — usado nos cartões de número grande, com "R$ mil" embaixo.
export function milhares(valor) {
  return ((valor || 0) / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function quantidade(valor, unidade) {
  return `${(valor || 0).toLocaleString('pt-BR')} ${unidade || ''}`.trim()
}
