// Datas como texto 'AAAA-MM-DD'. Tudo em UTC, para o fuso do Brasil não pular um dia.

function paraData(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}

export function somarDias(iso, n) {
  const d = paraData(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Quantos dias de `de` até `ate` (positivo quando `ate` é depois).
export function diasEntre(de, ate) {
  return Math.round((paraData(ate) - paraData(de)) / 86400000)
}

export function mesmoMes(a, b) {
  return a.slice(0, 7) === b.slice(0, 7)
}

// A segunda-feira da semana em que a data cai.
export function segundaDaSemana(iso) {
  const diaDaSemana = (paraData(iso).getUTCDay() + 6) % 7
  return somarDias(iso, -diaDaSemana)
}

export function dataBR(iso, comAno = false) {
  if (!iso) return '—'
  const [a, m, d] = iso.split('-')
  return comAno ? `${d}/${m}/${a}` : `${d}/${m}`
}
