# Plano do Projeto — VERTEX - Gestão de Obras

> Fonte da verdade deste projeto. Quando mudar de ideia, mude aqui primeiro.
> Última atualização: 15/11/2026

## Em uma frase

Um sistema de gestão de obra que resolve o fechamento diário de medição, ciclo de laje e apropriação por torre para o gerente de obras e sua equipe, fazendo com que cada lançamento do canteiro (diário, avanço, nota, saída de material) já nasça amarrado a fase, torre e pavimento.

---

# 1. Visão Estratégica

## Os problemas

### Problema 1 — Não sei quanto medir de cada empreiteiro
- **Como acontece hoje:** junto o que cada empreiteiro fez, por torre e por pavimento, a partir de mensagens no WhatsApp, fotos soltas e conversa com o encarregado, e monto a planilha de medição de cada um, por torre.
- **Frequência:** todo dia.
- **Custo:** 4 a 6 horas por dia (junto com gestão de contratos, planejamento, suprimentos e financeiro). Mesmo assim, chego na segunda sem o número fechado.
- **Último caso:** `[PENDENTE: um caso concreto de medição que saiu errada ou atrasou]`

### Problema 2 — Não sei se o ciclo semanal de laje fechou
- **Como acontece hoje:** o ciclo (pilares e escada → laje → concretado) e o Last Planner/PPC ficam em planilha separada, alimentada na mão.
- **Frequência:** toda semana, por torre; acompanhamento também mensal.
- **Custo:** risco de prazo; só descubro o atraso na segunda.
- **Último caso:** `[PENDENTE]`

### Problema 3 — Apropriação cruzada entre torres e entre fases
- **Como acontece hoje:** confiro na mão se insumo e mão de obra estão sendo consumidos na torre errada. O desvio preocupa nos dois níveis: **entre torres da mesma fase** (Torre 1 ↔ Torre 2) e **entre fases** (Fase 1 ↔ Fase 2). Cada fase é um centro de custo.
- **Frequência:** contínua; piora agora, com a Fase 2 em mobilização.
- **Custo:** custo oculto que aparece depois da entrega; decisão de adiantar ou não as Torres 1 e 2 sem número confiável.
- **Último caso:** `[PENDENTE]`

## A solução

Cada pessoa do canteiro lança o que é dela (mestre o diário, assistente o avanço e a saída de insumo, administrativo e almoxarife as notas), sempre escolhendo fase, torre e pavimento. O sistema soma sozinho: o que está pronto para medir por empreiteiro, em que etapa está o ciclo de laje de cada torre, o que está parado e por quê, e quanto cada torre consumiu de material, mão de obra e dinheiro contra o orçado.

**O que ele NÃO faz (v1):**
- Não é app de loja (App Store/Play Store): abre pelo navegador do celular e do computador.
- Não integra com o ERP UAU nem com contador ou banco. O orçamento entra por importação de planilha (CSV) ou digitação; o que precisar sai por exportação.
- Não lê nota fiscal automaticamente (XML/SEFAZ): a nota é digitada, com foto ou PDF anexo.
- Não substitui o cronograma detalhado (MS Project/Primavera): guarda datas planejadas do ciclo por pavimento e a programação semanal, não a rede completa.
- Não lê WhatsApp sozinho, não tem chat interno e não manda aviso por e-mail ou WhatsApp.
- Não funciona sem internet.
- Empreiteiro não tem acesso.

## Ordem de construção

O escopo é grande: 23 telas, 26 tabelas e 8 perfis. É bem acima do tamanho saudável de uma primeira versão (6 telas, 7 tabelas). Por isso a construção é em duas ondas, e a Onda 2 só começa com a Onda 1 em uso real no canteiro.

- **Onda 1 — o que mata as 4 a 6 horas:** Estrutura da obra, Diário, Avanço e ciclo de laje, Programação semanal e restrições, Contratos e medição, Painel da obra (blocos 1, 2, 3 e 5), Usuários.
- **Onda 2 — dinheiro e material:** Notas e almoxarifado, Estoque e apropriação de insumo, Orçamento, Financeiro (bloco 4 do painel), Solicitações de máquina e hora extra, Resumo da Diretoria e do Cliente.

## Funcionalidades

### 1. Painel da obra (a tela de todo dia)
- **Abre em:** painel, com seletor de obra, fase e torre no topo (padrão: obra inteira).
- **Mostra:** cinco blocos, nesta ordem:
  1. **Ciclo de laje** — uma linha por torre: pavimento atual, etapa (Pilares e escada → Laje → Concretado), dias no ciclo contra a meta, e contagem do mês (lajes concretadas contra meta mensal).
  2. **Parado** — restrições abertas: torre, pavimento, serviço, há quantos dias, tipo (Material, Mão de obra, Projeto, Equipamento), responsável por destravar.
  3. **Pronto para medir** — uma linha por empreiteiro: valor conferido e ainda não medido, por torre.
  4. **Saúde financeira** — receita × comprometido × incorrido, por fase e por torre. (Onda 2)
  5. **Efetivo** — efetivo de hoje por empreiteiro, média da semana e o empreiteiro com maior queda em relação à semana anterior.
- **Ordem e filtro:** parados mais antigos primeiro; filtro por fase e torre.
- **Ações:** nenhuma de lançamento; só navegar.
- **Ao clicar num item:** abre o módulo correspondente já filtrado.
- **Vazio:** "Ainda não há lançamentos nesta obra. Comece pelo diário de hoje."
- **Nasce e morre:** calculado; nada é digitado aqui.
- `[APROVADO SEM REVISÃO: primeira ação da manhã — risco: a ordem dos blocos foi decidida pela IA a partir da lista do dono, não por ele]`

### 2. Estrutura da obra
- **Abre em:** árvore (Obra → Fase → Torre/Anexo → Pavimento) e catálogo de serviços e empreiteiros.
- **Mostra:** nome, tipo (Torre, Anexo, Garagem, Lazer), centro de custo da fase, pavimentos, meta de ciclo e meta mensal de lajes por torre.
- **Ordem e filtro:** ordem do canteiro; sem filtro.
- **Ações:** criar, editar, marcar como concluída. Só o gerente.
- **Ao clicar num item:** abre os filhos.
- **Vazio:** "Cadastre a primeira fase desta obra."
- **Nasce e morre:** gerente cria; torre entregue fica como Concluída, nunca é apagada.

### 3. Diário de obra
- **Abre em:** lista por dia, mais recente primeiro.
- **Mostra:** data, clima (manhã e tarde), efetivo por empreiteiro e por torre, serviços do dia (torre, pavimento, serviço), fotos amarradas a torre + pavimento + serviço, ocorrências, status (Rascunho, Enviado, Revisado).
- **Ordem e filtro:** por data; filtro por status.
- **Ações:** mestre cria e edita o do dia; assistente revisa; ninguém edita depois de revisado.
- **Ao clicar num item:** abre o diário do dia.
- **Vazio:** "Nenhum diário lançado. Toque em Novo diário."
- **Nasce e morre:** mestre cria; após Revisado fica travado.

### 4. Avanço e ciclo de laje
- **Abre em:** grade de pavimentos da torre escolhida.
- **Mostra:** por pavimento, a etapa do ciclo e as datas prevista e real de pilares, laje e concretagem; por serviço, quantidade executada, quem lançou e o status (Lançado, Conferido, Medido).
- **Ordem e filtro:** pavimento mais alto em cima; filtro por torre, serviço e empreiteiro.
- **Ações:** assistente e planejador lançam; planejador confere (Conferido = pronto para medir).
- **Ao clicar num item:** abre o pavimento, com as fotos do diário daquele local.
- **Vazio:** "Nenhum avanço lançado nesta torre."
- **Nasce e morre:** avanço Medido fica travado.

### 5. Programação semanal e restrições (Last Planner / PPC)
- **Abre em:** lista da semana.
- **Mostra:** atividade programada, torre, pavimento, empreiteiro, status (Programada, Concluída, Não concluída), causa da não conclusão; restrições abertas (tipo, dias parado, responsável, data prometida); PPC da semana e histórico.
- **Ordem e filtro:** restrições mais antigas primeiro; filtro por torre e tipo.
- **Ações:** planejador programa a semana; assistente atualiza status; planejador ou gerente remove restrição.
- **Ao clicar num item:** abre a atividade ou a restrição.
- **Vazio:** "Nenhuma atividade programada para esta semana."
- **Nasce e morre:** semana passada vira histórico de PPC.

### 6. Contratos e medição de empreiteiros
- **Abre em:** lista de contratos ativos.
- **Mostra:** empreiteiro, serviços contratados, preço unitário, quantidade contratada por torre, medido acumulado, saldo, pronto para medir; medições com status (Em preparo, Aguardando aprovação, Aprovada, Devolvida).
- **Ordem e filtro:** maior valor pronto para medir primeiro; filtro por fase e torre.
- **Ações:** planejador prepara a medição a partir do avanço conferido; gerente aprova ou devolve; exportar para Excel.
- **Ao clicar num item:** abre o contrato e suas medições.
- **Vazio:** "Nenhum contrato cadastrado."
- **Nasce e morre:** gerente cadastra contrato; medição Aprovada não se edita.

### 7. Solicitações de máquina e hora extra (Onda 2)
- **Abre em:** lista.
- **Mostra:** tipo (Máquina, Hora extra de equipamento), equipamento (Escavadeira, Bobcat, Miniescavadeira, Grua, Cremalheira, Outro), data necessária, torre, justificativa, status (Pendente, Aprovada, Negada).
- **Ordem e filtro:** pendentes primeiro, por data necessária.
- **Ações:** mestre cria; planejador ou gerente aprova ou nega.
- **Vazio:** "Nenhuma solicitação aberta."
- **Nasce e morre:** mestre cria; decidida vira histórico.

### 8. Notas e almoxarifado (Onda 2)
- **Abre em:** lista de notas.
- **Mostra:** fornecedor, número, data, itens (insumo, quantidade, valor), fase de destino, anexo, status (Lançada, Aguardando material, Recebida conferida, Divergente, Validada).
- **Ordem e filtro:** aguardando há mais tempo primeiro; filtro por status e fase.
- **Ações:** administrativo ou almoxarife lança; almoxarife confere o recebimento; administrativo valida depois da conferência.
- **Vazio:** "Nenhuma nota lançada."
- **Nasce e morre:** nota Validada entra no estoque e no incorrido; não se apaga.

### 9. Estoque e apropriação de insumo (Onda 2)
- **Abre em:** lista de insumos.
- **Mostra:** insumo, unidade, saldo, consumo por torre contra o previsto no orçamento, transferências entre fases.
- **Ordem e filtro:** maior desvio primeiro; filtro por fase e torre.
- **Ações:** almoxarife e assistente lançam saída, sempre com fase, torre e pavimento de destino; correção só por estorno.
- **Vazio:** "Nenhum insumo cadastrado."

### 10. Orçamento e Financeiro (Onda 2)
- **Abre em:** painel por fase e por torre.
- **Mostra:** receita e custo previstos (orçamento), comprometido (contratos e notas ainda não validadas), incorrido (medições aprovadas e notas validadas), saldo e custo estimado da obra.
- **Ações:** gerente importa ou digita o orçamento; os demais só leem; exportar.
- **Vazio:** "Sem orçamento cadastrado para esta obra."
- **Origem dos números:** planilha de orçamento, espelhada no ERP UAU. Entra por importação de CSV.

### 11. Resumo da Diretoria e do Cliente (Onda 2)
- **Mostra:** Diretoria — avanço físico, prazo e custo por torre, com opção de abrir por empreiteiro. Cliente — avanço físico e fotos publicadas, sem valor nenhum.
- **Ações:** só leitura.
- **Vazio:** "Ainda não há avanço publicado."

### 12. Usuários
- **Abre em:** lista. O gerente libera a conta, escolhe o perfil e as obras de cada pessoa.

## Unidade principal

**Obra** — vai existir mais de uma? **sim**. Alguém trabalha em mais de uma ao mesmo tempo? **sim** (o gerente, no mínimo).

**Regra multi-obra (decidida em 15/11/2026):**
- Cada obra tem nome, código ou apelido, endereço, cliente, data de início, data-meta de entrega e situação (Em andamento, Concluída, Parada).
- Toda tabela de lançamento, de agora e de qualquer módulo futuro, leva `obra_id` obrigatório.
- No topo do app há um seletor de obra sempre visível. Trocar de obra recarrega a tela inteira com os dados daquela obra.
- A obra escolhida fica guardada: ao fechar e abrir o app, ele volta na mesma.
- Nenhuma tela mostra dado de duas obras juntas, a não ser que seja explicitamente um comparativo entre obras.
- A regra está registrada no `AGENTS.md` do projeto.

Dentro da obra: **Fase (subcondomínio = centro de custo) → Torre ou Anexo → Pavimento**. Todo lançamento carrega obra, e os de produção carregam também torre. Obras ficam agrupadas por **grupo de contrato**, sem misturar dados.

Obra de partida: 2 fases, 5 torres, 562 apartamentos. Fase 1: 2 torres de 86 apartamentos (172) + anexos. Fase 2: 3 torres de 130 apartamentos (390) + anexo. 5 subsolos de garagem (G1 a G5), 1.147 vagas.

## Perfis de usuário

- **Gerente de obras:** dono do sistema, aprova medição, vê custo por torre · primeira tela: Painel da obra
- **Engenheiro planejador:** lança avanço e restrições, prepara medição, vê contratos e o custo estimado da obra · primeira tela: Painel da obra
- **Assistente de engenharia:** lança insumo e avanço, revisa diário, não vê valor · primeira tela: Avanço
- **Administrativo:** lança, valida e acompanha notas · primeira tela: Notas
- **Almoxarife:** confere recebimento, cuida do estoque, vê quantidade e valor da nota · primeira tela: Notas
- **Mestre / encarregado:** lança o diário e solicitações, não vê valor · primeira tela: Diário
- **Diretoria:** acompanha avanço, prazo e custo · primeira tela: Resumo por torre
- **Cliente:** acompanha avanço e fotos publicadas · primeira tela: Resumo do cliente

### Matriz de permissões

| Ação | Gerente | Planejador | Assistente | Administrativo | Almoxarife | Mestre | Diretoria | Cliente |
|---|---|---|---|---|---|---|---|---|
| Ver avanço, ciclo e restrições | sim | sim | sim | não | não | sim | resumo | resumo |
| Lançar avanço e restrição | sim | sim | sim | não | não | não | não | não |
| Conferir avanço | sim | sim | não | não | não | não | não | não |
| Lançar diário | sim | sim | não | não | não | sim | não | não |
| Revisar diário | sim | sim | sim | não | não | não | não | não |
| Ver fotos | sim | sim | sim | não | não | sim | sim | só as publicadas |
| Publicar foto para o cliente | sim | sim | não | não | não | não | não | não |
| **Ver preço e valor de contrato e medição** | sim | sim | não | não | não | não | sim (consolidado; abre por empreiteiro se quiser) | não |
| Preparar medição | sim | sim | não | não | não | não | não | não |
| Aprovar medição | sim | não | não | não | não | não | não | não |
| Lançar nota | sim | não | não | sim | sim | não | não | não |
| **Ver valor de nota** | sim | sim | não | sim | sim | não | não | não |
| Conferir recebimento | não | não | não | não | sim | não | não | não |
| Validar nota | sim | não | não | sim | não | não | não | não |
| Lançar saída de insumo | sim | não | sim | não | sim | não | não | não |
| Ver estoque (quantidade) | sim | sim | sim | sim | sim | não | não | não |
| **Ver saúde financeira e custo estimado** | sim | sim | não | só comprometido e incorrido de notas | não | não | sim | não |
| Importar ou editar orçamento | sim | não | não | não | não | não | não | não |
| Criar solicitação de máquina/hora extra | sim | sim | não | não | não | sim | não | não |
| Aprovar solicitação | sim | sim | não | não | não | não | não | não |
| Alterar estrutura (fase, torre, serviço, contrato) | sim | não | não | não | não | não | não | não |
| Apagar registro | sim | não | não | não | não | não | não | não |
| Gerenciar usuários | sim | não | não | não | não | não | não | não |
| **Quem não fez login** | não vê nada | | | | | | | |

Cada pessoa só enxerga as obras em que foi incluída.

Confirmado pelo dono em 15/11/2026: planejador, almoxarife, diretoria e cliente. A linha do administrativo ficou como proposta, sem objeção.

## Fluxo de cadastro

1. A pessoa se cadastra sozinha com email e senha.
2. Entra sem perfil e não vê dado nenhum.
3. Vê o aviso "Conta aguardando liberação do administrador".
4. O gerente libera, escolhe o perfil e as obras.

## Ferramentas e custo

| Peça | Para que serve | Custo |
|---|---|---|
| Claude | construir o sistema | a assinatura que já existe |
| React + Vite | a interface | grátis |
| Supabase | banco, login e arquivos (fotos, anexos) | grátis no começo; fotos diárias devem exigir o plano pago |
| Vercel | colocar no ar | grátis |
| GitHub | guardar o código | grátis |

**Total por mês:** R$ 0 no começo, além da assinatura da IA. `[PENDENTE: valor do plano pago do Supabase quando as fotos acumularem]`
**O que custaria a alternativa pronta:** o dono não paga nem pretende pagar sistema pronto; o único custo aceito é a IA para construir do jeito dele.

## Prazo

- **Quer usar de verdade em:** `[PENDENTE: data não informada]`
- **Horas por semana disponíveis:** 10, no mínimo.

---

# 2. Insights do Mercado

## Benchmark

Pesquisado na web em 15/11/2026. Só está escrito o que apareceu na busca; onde não apareceu preço, está dito.

### OrçaFascio
- Site: orcafascio.com · Preço: de R$ 599 a R$ 2.097, cobrança anual (a página não indica a data desses valores)
- Faz bem: orçamento, medição, diário de obras com fotos e aplicativo que funciona sem internet.
- Falta: nada visto sobre ciclo de laje por torre ou apropriação de insumo entre torres.
- Vale copiar: foto tirada no canteiro já presa ao diário.

### Mais Controle
- Site: não confirmado na busca (aplicativo "Mais Controle App" na App Store) · Preço: não informado na busca
- Faz bem: medição e diário, aprovação de medição por alçada, relatório de avanço planejado × medido.
- Falta: o aplicativo depende da assinatura do ERP deles.
- Vale copiar: aprovação de medição em etapas.

### Sienge Construpoint
- Site: sienge.com.br/construpoint · Preço: não informado na busca
- Faz bem: diário digital com fotos, comentários e documentos, online e offline.
- Falta: é parte de outro ERP; a empresa já usa o UAU.
- Vale copiar: diário utilizável sem sinal.

`[PENDENTE: Prevision (Last Planner e PPC) não pôde ser avaliado — a busca não trouxe funcionalidades nem preço]`

## Por que ainda vale construir o meu

Nenhum dos três faz o processo do jeito desta obra: ciclo de laje por torre, pronto para medir por empreiteiro e desvio de insumo e mão de obra entre torres e entre fases, tudo na mesma tela. A empresa já tem ERP (UAU) e não quer outra mensalidade. `[APROVADO SEM REVISÃO: parágrafo escrito pela IA — risco: o motivo não foi dito pelo dono com as palavras dele]`

**O que os prontos têm e este não terá na v1:** funcionar sem internet. Em subsolo e em pavimento alto isso pode pesar.

## Referências de interface

- **Gosta de / Odeia:** `[DESCOBRIR NO USO]`
- **Usa mais em:** mestre, almoxarife e assistente no celular, no canteiro; gerente, planejador, administrativo e diretoria no computador. `[APROVADO SEM REVISÃO: suposição da IA]`
- **Paleta:** identidade "Azul Vertex", tirada da logo da empresa: principal `#325085` (azul do símbolo), marinho `#172741` (cabeçalho e menu), fundo `#F2F4F8`, destaque `#6FA0E6`, crítico `#C8463B`, ok `#2E9E6B`, atenção `#E3A008`. Escolhida pelo dono em 15/11/2026, no lugar da Concreto.
- **Nome do app:** VERTEX - Gestão de Obras.
- **Estilo:** "Painel" (cockpit denso: cabeçalho escuro com abas, cartões com faixa colorida no topo, listas compactas com etiqueta de status). Referência visual: `preview.html`, aprovada pelo dono em 15/11/2026.
- **Tema:** claro (lê melhor no sol)
- **Logo:** sem logo

---

# 3. Arquitetura

## Mapa de telas

```
Login → (conta nova) Aguardando liberação
└── Gerente / Planejador
    ├── Painel da obra                  (início)
    ├── Avanço  →  Pavimento
    ├── Programação  (semana, restrições, PPC)
    ├── Medição  →  Contrato  →  Medição
    ├── Diário  →  Diário do dia
    └── Mais: Notas · Estoque · Financeiro · Solicitações · Estrutura* · Usuários* · Meu perfil
└── Assistente:      Avanço · Diário · Programação · Estoque · Meu perfil
└── Administrativo:  Notas · Financeiro de notas · Meu perfil
└── Almoxarife:      Notas · Estoque · Meu perfil
└── Mestre:          Diário · Solicitações · Avanço (só leitura) · Meu perfil
└── Diretoria:       Resumo por torre · Meu perfil
└── Cliente:         Resumo do cliente · Meu perfil
```
`*` só o gerente.

**Navegação:** celular com barra inferior de até 5 itens (o quinto é "Mais" quando houver mais telas); computador com menu lateral à esquerda. No topo, o seletor de obra.

## Processos automáticos

`[APROVADO SEM REVISÃO: os dois processos foram escolhidos pela IA — risco: o dono não disse o que queria que acontecesse sozinho]`

### Medição aprovada trava o avanço
- **Gatilho:** o gerente aprova uma medição.
- **Passos:** 1. Os avanços incluídos passam de Conferido para Medido. 2. O valor total fica gravado na medição. 3. O saldo do contrato e o incorrido da torre são recalculados.
- **Resultado:** o que foi medido some do "pronto para medir" e não pode mais ser editado.
- **Se der errado:** nada é alterado, a medição continua em Aguardando aprovação e o gerente vê "Não foi possível aprovar. Tente de novo."

### Nota validada entra no estoque
- **Gatilho:** o administrativo valida uma nota que o almoxarife já conferiu.
- **Passos:** 1. Para cada item, cria uma Entrada no estoque com a quantidade recebida. 2. O valor passa de comprometido para incorrido na fase da nota.
- **Resultado:** saldo de estoque e financeiro atualizados sem digitar duas vezes.
- **Se der errado:** a nota volta para Recebida conferida e o administrativo vê o erro; nenhuma entrada parcial fica gravada.

## Modelagem de dados

26 tabelas (19 na Onda 1, 7 na Onda 2). O detalhe de campos está no `PRD-BACKEND.md`.

| Grupo | Tabelas |
|---|---|
| Acesso | `profiles`, `grupos_contrato`, `obras`, `membros` |
| Estrutura | `fases`, `torres`, `pavimentos`, `servicos`, `empreiteiros` |
| Diário | `diarios`, `diario_efetivos`, `diario_servicos`, `fotos` |
| Produção | `avancos`, `atividades_semana`, `restricoes` |
| Medição | `contratos`, `contrato_itens`, `medicoes` |
| Material (Onda 2) | `fornecedores`, `insumos`, `notas`, `nota_itens`, `movimentos_estoque` |
| Dinheiro e apoio (Onda 2) | `orcamentos`, `solicitacoes` |

Regra que protege o valor: preço e dinheiro ficam em tabelas próprias (`contrato_itens`, `medicoes`, `notas`, `nota_itens`, `orcamentos`). As tabelas de produção (`avancos`, `diarios`, `fotos`) não guardam valor nenhum, e por isso mestre e assistente podem vê-las sem enxergar custo.

## A pergunta de um ano

Proposta: **"Quanto custou, em material e mão de obra, cada pavimento de cada torre, e qual empreiteiro manteve o ciclo de laje?"** Para responder, todo avanço, saída de insumo e efetivo guarda torre e pavimento desde o primeiro dia, e cada pavimento guarda data prevista e real de cada etapa. `[APROVADO SEM REVISÃO: pergunta proposta pela IA]`

## Melhorias para a v2

- Funcionar sem internet — cortado porque muda toda a forma de guardar os dados.
- Integração com o ERP UAU — cortado porque depende de acesso técnico ao UAU; por enquanto, importação de planilha.
- Leitura automática de nota fiscal (XML) — cortado por complexidade.
- Avisos por e-mail ou WhatsApp (restrição vencida, medição aguardando) — cortado para manter só 2 processos automáticos.
- Acesso do empreiteiro à própria medição — cortado por risco de permissão.
- Relatório em PDF do diário e da medição — cortado; a v1 exporta para Excel.
- Retenção, adiantamento e descontos detalhados na medição — cortado até se ver o uso.

---

# A conta que vai chegar depois

- `[PENDENTE: caso concreto de medição errada ou atrasada]` — custo: o sistema fica sem um exemplo real para testar a medição.
- `[PENDENTE: data em que quer estar usando]` — custo: sem data não dá para dizer se a Onda 2 cabe; a 10 horas por semana, as duas ondas são um projeto de meses, não de semanas.
- `[PENDENTE: número de pavimentos de cada torre e lista de serviços medíveis]` — custo: a estrutura da obra é o primeiro cadastro; sem ela nada mais se lança.
- `[PENDENTE: formato da planilha de orçamento / exportação do UAU]` — custo: a importação do orçamento não pode ser construída sem ver as colunas.
- `[PENDENTE: valor do plano pago do Supabase]` — custo: mensalidade em dólar quando as fotos passarem do limite grátis.
- `[PENDENTE: Prevision não avaliado]` — custo: pode existir pronto o que o módulo de Programação vai fazer.
- `[PENDENTE: o dono já conversou com mestre, almoxarife e administrativo sobre lançar no sistema?]` — custo: é o maior risco do projeto; se o mestre não lançar o diário, o painel fica vazio.

# Decidir depois de usar

- `[DESCOBRIR NO USO: retenção, adiantamento e descontos na medição]` — por enquanto ficou: medição = quantidade conferida × preço unitário, com um campo de desconto e uma observação.
- `[DESCOBRIR NO USO: avanço por quantidade ou por percentual]` — por enquanto ficou: quantidade na unidade do serviço.
- `[DESCOBRIR NO USO: referências de interface de que gosta e que odeia]` — por enquanto ficou: tema claro, identidade Azul Vertex, estilo Painel, botões grandes no celular.
- `[DESCOBRIR NO USO: efetivo por função (pedreiro, servente, armador)]` — por enquanto ficou: só a quantidade por empreiteiro e torre.
