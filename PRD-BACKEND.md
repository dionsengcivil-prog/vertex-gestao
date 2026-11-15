# PRD Backend — VERTEX - Gestão de Obras

> Especificação dos dados e das permissões. Lido na etapa de criar o banco no Supabase.
> O SQL não está aqui: ele é escrito na hora de construir, a partir desta descrição.
> Fonte das decisões: `PLANO-DO-PROJETO.md`.

## Convenções

- Tabelas no plural, em minúsculo, sem acento, com underline: `diarios`.
- Colunas em minúsculo com underline: `data_inicio`, `responsavel_id`.
- Toda tabela tem `id` (uuid) e `created_at` (timestamptz, automático). Nas tabelas abaixo esses dois campos não são repetidos.
- Chave estrangeira termina em `_id`.
- Campo de lista fechada vira CHECK, e o texto é **idêntico** ao usado na interface, com acento e maiúscula.
- Datas como `date` ou `timestamptz`. Dinheiro como `numeric(14,2)`. Quantidade como `numeric(14,3)`.
- Foto e PDF vão para o Storage; o banco guarda só o link.
- **Regra do valor:** dinheiro só existe em `contrato_itens`, `medicoes`, `notas`, `nota_itens` e `orcamentos`. As tabelas de produção (`avancos`, `diarios`, `diario_*`, `fotos`, `atividades_semana`, `restricoes`, `movimentos_estoque`) não têm coluna de valor. É isso que permite a mestre e assistente verem a produção sem ver custo.

## Ordem de construção

- **Onda 1 (19 tabelas):** `profiles`, `grupos_contrato`, `obras`, `membros`, `fases`, `torres`, `pavimentos`, `servicos`, `empreiteiros`, `diarios`, `diario_efetivos`, `diario_servicos`, `fotos`, `avancos`, `atividades_semana`, `restricoes`, `contratos`, `contrato_itens`, `medicoes`.
- **Onda 2 (7 tabelas):** `fornecedores`, `insumos`, `notas`, `nota_itens`, `movimentos_estoque`, `orcamentos`, `solicitacoes`.

---

## Unidade principal

**Obra.** Vai existir mais de uma: **sim**. Há pessoas em mais de uma obra ao mesmo tempo: **sim**.

Tabela da unidade: `obras`. Toda tabela de dado de obra tem `obra_id`. A tabela `membros` diz quem trabalha em qual obra. Uma pessoa só lê e grava linhas cujo `obra_id` esteja entre as suas obras em `membros`. Obras se agrupam em `grupos_contrato`.

Dentro da obra: `fases` (subcondomínio = centro de custo) → `torres` (torre, anexo, garagem, lazer) → `pavimentos`.

---

## Tabela `profiles`

Liga o login à pessoa e guarda o perfil dela. É ela que manda nas permissões.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | chave; é o próprio código do login |
| nome | text | sim | |
| email | text | sim | único |
| role | text | sim | CHECK: `gerente`, `planejador`, `assistente`, `administrativo`, `almoxarife`, `mestre`, `diretoria`, `cliente`, `pendente`. Padrão `pendente` |
| ativo | boolean | sim | padrão verdadeiro |

Criado automaticamente por um gatilho quando alguém se cadastra, com `role = 'pendente'`.
Na interface os perfis aparecem como: Gerente de obras, Engenheiro planejador, Assistente de engenharia, Administrativo, Almoxarife, Mestre / encarregado, Diretoria, Cliente.

## Tabela `grupos_contrato`

Para que serve: agrupa obras do mesmo contrato ou cliente.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| nome | text | sim | |

## Tabela `obras`

Para que serve: a unidade principal.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| grupo_contrato_id | uuid | sim | |
| nome | text | sim | |
| codigo | text | sim | código ou apelido curto, único; aparece no seletor de obra |
| endereco | text | não | |
| cliente | text | não | |
| data_inicio | date | sim | |
| data_meta_entrega | date | não | |
| situacao | text | sim | CHECK: `Em andamento`, `Concluída`, `Parada`. Padrão `Em andamento` |

**Relações:** pertence a um grupo de contrato; tem várias fases, membros e todos os lançamentos.

### Regra multi-obra (vale para o sistema inteiro)

- Toda tabela de lançamento, as de agora e as de qualquer módulo futuro, tem a coluna `obra_id`, **obrigatória**, apontando para `obras`. As únicas tabelas sem `obra_id` são `profiles`, `grupos_contrato` e a própria `obras`.
- Toda leitura e toda gravação filtra por `obra_id`. Nenhuma consulta devolve linhas de duas obras juntas, a não ser numa tela que seja explicitamente um comparativo entre obras (não existe nenhuma na v1).
- A obra em uso é escolhida no seletor de obra da interface. A escolha fica guardada no aparelho; o banco não guarda "obra atual".

## Tabela `membros`

Para que serve: diz quem trabalha em qual obra.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| profile_id | uuid | sim | |

**Regra de negócio:** par (obra_id, profile_id) único. O perfil vale o de `profiles.role` em todas as obras da pessoa. Quem cria uma obra entra automaticamente como membro dela; sem isso o gerente não enxergaria a obra que acabou de criar.

## Tabela `fases`

Para que serve: subcondomínio; é o centro de custo.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| nome | text | sim | ex.: Fase 1 |
| centro_custo | text | sim | |
| ordem | integer | sim | |

## Tabela `torres`

Para que serve: cada torre, anexo, garagem ou área de lazer de uma fase.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| fase_id | uuid | sim | |
| nome | text | sim | ex.: Torre 1 |
| tipo | text | sim | CHECK: `Torre`, `Anexo`, `Garagem`, `Lazer` |
| meta_ciclo_dias | integer | sim | padrão 7 |
| meta_lajes_mes | integer | sim | padrão 4 |
| status | text | sim | CHECK: `Ativa`, `Concluída`. Padrão `Ativa` |
| ordem | integer | sim | |

## Tabela `pavimentos`

Para que serve: cada pavimento de uma torre, com o ciclo de laje dele.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| torre_id | uuid | sim | |
| nome | text | sim | ex.: 12º pavimento |
| ordem | integer | sim | define a posição na lista |
| etapa_ciclo | text | sim | CHECK: `Não iniciado`, `Pilares e escada`, `Laje`, `Concretado`. Padrão `Não iniciado` |
| data_prevista_pilares | date | não | |
| data_real_pilares | date | não | marca o início do ciclo |
| data_prevista_laje | date | não | |
| data_real_laje | date | não | |
| data_prevista_concretagem | date | não | |
| data_real_concretagem | date | não | |

**Índices úteis:** `torre_id`, `ordem`.
**Regra de negócio:** `etapa_ciclo = 'Concretado'` exige `data_real_concretagem`.

## Tabela `servicos`

Para que serve: catálogo de serviços medíveis da obra.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| nome | text | sim | |
| unidade | text | sim | m², m³, kg, un, vb |

## Tabela `empreiteiros`

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| nome | text | sim | |
| cnpj | text | não | |

## Tabela `diarios`

Para que serve: o diário de obra de cada dia.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| data | date | sim | |
| clima_manha | text | sim | CHECK: `Sol`, `Nublado`, `Chuva fraca`, `Chuva forte` |
| clima_tarde | text | sim | mesma lista |
| ocorrencias | text | não | |
| status | text | sim | CHECK: `Rascunho`, `Enviado`, `Revisado`. Padrão `Rascunho` |
| autor_id | uuid | sim | quem criou |
| revisado_por_id | uuid | não | |

**Regra de negócio:** um diário por obra por dia (obra_id + data único). Em `Revisado`, o diário e seus efetivos e serviços não mudam mais.

## Tabela `diario_efetivos`

Para que serve: quantas pessoas de cada empreiteiro em cada torre, por dia.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| diario_id | uuid | sim | |
| empreiteiro_id | uuid | sim | |
| torre_id | uuid | sim | |
| quantidade | integer | sim | maior que zero |

## Tabela `diario_servicos`

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| diario_id | uuid | sim | |
| torre_id | uuid | sim | |
| pavimento_id | uuid | não | |
| servico_id | uuid | sim | |
| empreiteiro_id | uuid | não | |
| descricao | text | não | |

## Tabela `fotos`

Para que serve: fotos do diário, presas ao local.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| diario_id | uuid | sim | |
| torre_id | uuid | sim | |
| pavimento_id | uuid | não | |
| servico_id | uuid | não | |
| url | text | sim | link no Storage |
| legenda | text | não | |
| publicada | boolean | sim | padrão falso; verdadeiro = o cliente vê |

**Índices úteis:** `pavimento_id`, `publicada`.

## Tabela `avancos`

Para que serve: o que foi executado, por serviço, torre e pavimento. É a base da medição.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| torre_id | uuid | sim | |
| pavimento_id | uuid | sim | |
| servico_id | uuid | sim | |
| empreiteiro_id | uuid | sim | |
| quantidade | numeric(14,3) | sim | maior que zero |
| data | date | sim | |
| observacao | text | não | |
| status | text | sim | CHECK: `Lançado`, `Conferido`, `Medido`. Padrão `Lançado` |
| lancado_por_id | uuid | sim | |
| conferido_por_id | uuid | não | |
| medicao_id | uuid | não | preenchido ao incluir numa medição |

**Índices úteis:** `torre_id`, `pavimento_id`, `empreiteiro_id`, `status`.
**Regra de negócio:** só se edita ou apaga em `Lançado`. `Medido` é definitivo. O preço não fica aqui: vem de `contrato_itens` (mesmo serviço, torre e empreiteiro).

## Tabela `atividades_semana`

Para que serve: a programação semanal e a base do PPC.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| semana_inicio | date | sim | a segunda-feira da semana |
| torre_id | uuid | sim | |
| pavimento_id | uuid | não | |
| servico_id | uuid | sim | |
| empreiteiro_id | uuid | não | |
| status | text | sim | CHECK: `Programada`, `Concluída`, `Não concluída`. Padrão `Programada` |
| causa | text | não | CHECK: `Material`, `Mão de obra`, `Projeto`, `Equipamento`, `Clima`, `Outro`. Obrigatória se `Não concluída` |

**Índices úteis:** `obra_id`, `semana_inicio`.

## Tabela `restricoes`

Para que serve: o que está parado e por quê.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| torre_id | uuid | sim | |
| pavimento_id | uuid | não | |
| servico_id | uuid | não | |
| tipo | text | sim | CHECK: `Material`, `Mão de obra`, `Projeto`, `Equipamento` |
| descricao | text | sim | |
| data_abertura | date | sim | padrão hoje |
| responsavel_id | uuid | sim | pessoa da obra |
| data_prometida | date | não | |
| data_remocao | date | não | |
| status | text | sim | CHECK: `Aberta`, `Removida`. Padrão `Aberta` |
| criado_por_id | uuid | sim | |

**Regra de negócio:** `Removida` exige `data_remocao`. Dias parado = hoje − `data_abertura`.

## Tabela `contratos`

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| empreiteiro_id | uuid | sim | |
| numero | text | sim | |
| data_inicio | date | sim | |
| status | text | sim | CHECK: `Ativo`, `Encerrado`. Padrão `Ativo` |

## Tabela `contrato_itens`

Para que serve: o preço de cada serviço em cada torre. **Tem valor.**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| contrato_id | uuid | sim | |
| servico_id | uuid | sim | |
| torre_id | uuid | sim | |
| preco_unitario | numeric(14,2) | sim | |
| quantidade_contratada | numeric(14,3) | sim | |

**Regra de negócio:** um item por contrato, serviço e torre.

## Tabela `medicoes`

Para que serve: a medição de um empreiteiro num período. **Tem valor.**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| contrato_id | uuid | sim | |
| numero | integer | sim | sequencial por contrato |
| periodo_inicio | date | sim | |
| periodo_fim | date | sim | |
| status | text | sim | CHECK: `Em preparo`, `Aguardando aprovação`, `Aprovada`, `Devolvida`. Padrão `Em preparo` |
| desconto | numeric(14,2) | sim | padrão 0 |
| valor_total | numeric(14,2) | não | gravado na aprovação |
| observacao | text | não | |
| motivo_devolucao | text | não | obrigatório ao devolver |
| preparado_por_id | uuid | sim | |
| aprovado_por_id | uuid | não | |
| aprovado_em | timestamptz | não | |

**Relações:** tem vários `avancos` (pelo `medicao_id`).
**Regra de negócio:** valor = soma de (quantidade do avanço × preço unitário do item correspondente) − desconto. `Aprovada` não se edita.

---

## Tabelas da Onda 2

## Tabela `fornecedores`

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| nome | text | sim | |
| cnpj | text | não | |

## Tabela `insumos`

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| nome | text | sim | |
| unidade | text | sim | |

## Tabela `notas`

Para que serve: nota fiscal de material. **Tem valor.**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| fase_id | uuid | sim | centro de custo de destino |
| fornecedor_id | uuid | sim | |
| numero | text | sim | |
| data_emissao | date | sim | |
| valor_total | numeric(14,2) | sim | soma dos itens |
| anexo_url | text | não | Storage |
| status | text | sim | CHECK: `Lançada`, `Aguardando material`, `Recebida conferida`, `Divergente`, `Validada`. Padrão `Lançada` |
| observacao_conferencia | text | não | obrigatória se `Divergente` |
| lancada_por_id | uuid | sim | |
| conferida_por_id | uuid | não | |
| conferida_em | timestamptz | não | |
| validada_por_id | uuid | não | |
| validada_em | timestamptz | não | |

**Regra de negócio:** só passa a `Validada` a partir de `Recebida conferida`. `Validada` não se edita nem se apaga.

## Tabela `nota_itens`

**Tem valor.**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| nota_id | uuid | sim | |
| insumo_id | uuid | sim | |
| quantidade | numeric(14,3) | sim | |
| valor_unitario | numeric(14,2) | sim | |
| quantidade_recebida | numeric(14,3) | não | preenchida na conferência |

## Tabela `movimentos_estoque`

Para que serve: toda entrada e saída de insumo, com destino. Base da apropriação por torre. Sem valor.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| insumo_id | uuid | sim | |
| tipo | text | sim | CHECK: `Entrada`, `Saída`, `Transferência`, `Estorno` |
| quantidade | numeric(14,3) | sim | maior que zero |
| data | date | sim | |
| fase_id | uuid | sim | fase de destino |
| torre_id | uuid | não | obrigatória em `Saída` |
| pavimento_id | uuid | não | |
| fase_origem_id | uuid | não | obrigatória em `Transferência` |
| nota_item_id | uuid | não | preenchido em `Entrada` vinda de nota |
| observacao | text | não | obrigatória em `Estorno` |
| lancado_por_id | uuid | sim | |

**Índices úteis:** `insumo_id`, `torre_id`, `fase_id`, `data`.
**Regra de negócio:** movimento não se edita nem se apaga; corrige-se com `Estorno`. Saldo = Entradas − Saídas + Estornos. Saída não pode deixar o saldo negativo.

## Tabela `orcamentos`

Para que serve: o previsto, vindo da planilha de orçamento (espelho do ERP UAU). **Tem valor.**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| fase_id | uuid | sim | |
| torre_id | uuid | não | vazio = vale para a fase inteira |
| categoria | text | sim | CHECK: `Receita`, `Mão de obra`, `Material`, `Equipamento`, `Outros` |
| insumo_id | uuid | não | só em `Material` |
| quantidade_prevista | numeric(14,3) | não | |
| valor_previsto | numeric(14,2) | sim | |

## Tabela `solicitacoes`

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | |
| tipo | text | sim | CHECK: `Máquina`, `Hora extra de equipamento` |
| equipamento | text | sim | CHECK: `Escavadeira`, `Bobcat`, `Miniescavadeira`, `Grua`, `Cremalheira`, `Outro` |
| data_necessaria | date | sim | |
| horas | numeric(6,2) | não | obrigatório em `Hora extra de equipamento` |
| torre_id | uuid | não | |
| justificativa | text | sim | |
| status | text | sim | CHECK: `Pendente`, `Aprovada`, `Negada`. Padrão `Pendente` |
| resposta | text | não | obrigatória ao negar |
| solicitado_por_id | uuid | sim | |
| decidido_por_id | uuid | não | |

---

## Números calculados (não são tabelas)

- **Pronto para medir, por empreiteiro e torre:** soma de `avancos` em `Conferido` sem `medicao_id` × `preco_unitario` do item de contrato correspondente.
- **Dia do ciclo:** hoje − `data_real_pilares` do pavimento em execução, contra `torres.meta_ciclo_dias`.
- **Lajes no mês:** pavimentos com `data_real_concretagem` no mês, contra `torres.meta_lajes_mes`.
- **PPC da semana:** atividades `Concluída` ÷ total da `semana_inicio`.
- **Maior queda de efetivo:** média diária por empreiteiro na semana atual menos a da semana anterior.
- **Comprometido:** soma dos contratos Ativos (quantidade contratada × preço) ainda não medida + notas ainda não `Validada`.
- **Incorrido:** medições `Aprovada` + notas `Validada`.
- **Custo estimado da obra:** incorrido + comprometido.
- **Desvio de insumo por torre:** soma das `Saída` (menos `Estorno`) por insumo e torre, contra `orcamentos.quantidade_prevista`.

O resumo financeiro consolidado (por fase e torre) é entregue por uma consulta de resumo própria, que devolve só os totais. É por ela que a diretoria vê custo sem ler nota por nota, e que o administrativo vê só a parte de notas.

---

## Permissões

Vale para todas: a pessoa só alcança linhas das obras em que está em `membros`; `pendente` e quem não fez login não alcançam nada.

### `profiles`
- **Ver:** cada um o próprio; gerente todos; os demais veem nome das pessoas das suas obras (para a lista de responsáveis).
- **Criar:** automático no cadastro.
- **Editar:** cada um o próprio nome; gerente troca `role` e `ativo` de qualquer um.
- **Apagar:** ninguém (desativa).
- **Sem login:** nada.

### `grupos_contrato`, `obras`, `membros`
- **Ver:** todos os liberados, só as suas obras.
- **Criar / Editar:** gerente.
- **Apagar:** gerente, e só o que não tem lançamento.
- **Sem login:** nada.

### `fases`, `torres`, `servicos`, `empreiteiros`
- **Ver:** todos os liberados da obra. Cliente não vê `empreiteiros` nem `servicos`.
- **Criar / Editar / Apagar:** gerente.
- **Sem login:** nada.

### `pavimentos`
- **Ver:** todos os liberados da obra.
- **Criar / Apagar:** gerente.
- **Editar:** gerente e planejador (tudo); assistente só `etapa_ciclo` e as datas reais.
- **Sem login:** nada.

### `diarios`, `diario_efetivos`, `diario_servicos`
- **Ver:** gerente, planejador, assistente, mestre.
- **Criar:** mestre, gerente, planejador.
- **Editar:** o autor enquanto `Rascunho`; assistente, planejador e gerente mudam o status (revisar, devolver).
- **Apagar:** gerente, e só em `Rascunho`.
- **Sem login:** nada.

### `fotos`
- **Ver:** gerente, planejador, assistente, mestre, diretoria: todas. Cliente: só `publicada = verdadeiro`.
- **Criar:** mestre, gerente, planejador.
- **Editar:** autor do diário enquanto `Rascunho`; gerente e planejador mudam `publicada` a qualquer momento.
- **Apagar:** gerente.
- **Sem login:** nada.

### `avancos`
- **Ver:** gerente, planejador, assistente, mestre.
- **Criar:** gerente, planejador, assistente.
- **Editar:** quem lançou, enquanto `Lançado`; gerente e planejador mudam o status para `Conferido` e de volta.
- **Apagar:** gerente, e só em `Lançado`.
- **Sem login:** nada.

### `atividades_semana`
- **Ver:** gerente, planejador, assistente, mestre.
- **Criar / Apagar:** gerente, planejador.
- **Editar:** gerente, planejador; assistente só `status` e `causa`.
- **Sem login:** nada.

### `restricoes`
- **Ver:** gerente, planejador, assistente, mestre.
- **Criar:** gerente, planejador, assistente.
- **Editar:** gerente, planejador (inclusive remover); assistente só as que criou e enquanto `Aberta`, sem remover.
- **Apagar:** gerente.
- **Sem login:** nada.

### `contratos`, `contrato_itens`
- **Ver:** gerente, planejador, diretoria.
- **Criar / Editar / Apagar:** gerente.
- **Sem login:** nada.

### `medicoes`
- **Ver:** gerente, planejador, diretoria.
- **Criar:** gerente, planejador.
- **Editar:** gerente, planejador enquanto `Em preparo` ou `Devolvida`; só o gerente muda para `Aprovada` ou `Devolvida`.
- **Apagar:** gerente, e só em `Em preparo`.
- **Sem login:** nada.

### `fornecedores`, `insumos`
- **Ver:** gerente, planejador, assistente, administrativo, almoxarife.
- **Criar / Editar:** gerente, administrativo, almoxarife.
- **Apagar:** gerente.
- **Sem login:** nada.

### `notas`, `nota_itens`
- **Ver:** gerente, planejador, administrativo, almoxarife (com valor).
- **Criar:** gerente, administrativo, almoxarife.
- **Editar:** quem lançou, enquanto não `Validada`; almoxarife preenche a conferência (`quantidade_recebida`, status `Recebida conferida` ou `Divergente`); administrativo e gerente mudam para `Validada`.
- **Apagar:** gerente, e só se não `Validada`.
- **Sem login:** nada.

### `movimentos_estoque`
- **Ver:** gerente, planejador, assistente, administrativo, almoxarife.
- **Criar:** gerente, assistente, almoxarife; a `Entrada` de nota é criada pelo processo automático.
- **Editar / Apagar:** ninguém.
- **Sem login:** nada.

### `orcamentos`
- **Ver:** gerente, planejador, diretoria.
- **Criar / Editar / Apagar:** gerente.
- **Sem login:** nada.

### `solicitacoes`
- **Ver:** gerente, planejador: todas. Mestre: as próprias.
- **Criar:** mestre, gerente, planejador.
- **Editar:** quem pediu, enquanto `Pendente`; gerente e planejador decidem (status e resposta).
- **Apagar:** gerente.
- **Sem login:** nada.

### Consulta de resumo financeiro
- **Gerente, planejador, diretoria:** todos os totais, por fase, torre e empreiteiro.
- **Administrativo:** só comprometido e incorrido de notas, por fase.
- **Demais perfis e sem login:** nada.

---

## Fluxo de cadastro e liberação

1. A pessoa se cadastra sozinha com email e senha.
2. Um gatilho cria a linha em `profiles` com `role = 'pendente'`. Ela não está em nenhuma obra e não vê dado nenhum.
3. Vê o aviso "Conta aguardando liberação do administrador".
4. O gerente, na tela Usuários, escolhe o perfil (`role`) e as obras (linhas em `membros`).
5. O primeiro gerente é definido à mão no banco, na criação do sistema.

## Processos automáticos

### Medição aprovada trava o avanço
- **Gatilho:** `medicoes.status` passa a `Aprovada`.
- **Passos:** 1. Todos os `avancos` com aquele `medicao_id` passam a `Medido`. 2. `valor_total`, `aprovado_por_id` e `aprovado_em` são gravados.
- **Resultado:** os avanços saem do pronto para medir e ficam definitivos; o incorrido da torre sobe.
- **Se falhar:** nada é gravado (tudo ou nada); a medição continua `Aguardando aprovação` e a tela mostra "Não foi possível aprovar. Tente de novo."

### Nota validada entra no estoque (Onda 2)
- **Gatilho:** `notas.status` passa a `Validada`.
- **Passos:** 1. Para cada `nota_itens`, cria um `movimentos_estoque` do tipo `Entrada` com `quantidade_recebida`, a `fase_id` da nota e o `nota_item_id`. 2. Grava `validada_por_id` e `validada_em`.
- **Resultado:** saldo atualizado; o valor da nota passa de comprometido a incorrido.
- **Se falhar:** nada é gravado; a nota continua `Recebida conferida` e a tela mostra o erro.

## Arquivos

- Guardados no Storage, nas pastas `fotos-diario` e `anexos-notas`, separados por obra.
- Imagem comprimida no navegador antes de subir (máx. 1200px, qualidade 0.8).
- O banco guarda só o link (`fotos.url`, `notas.anexo_url`).
- Leitura dos arquivos segue a mesma regra das tabelas: cliente só abre foto publicada.

## Critérios de aceite

- [ ] Usuário recém-cadastrado não enxerga nenhum dado até ser liberado.
- [ ] Quem não está em `membros` de uma obra não lê nenhuma linha dela.
- [ ] Toda tabela de lançamento recusa linha sem `obra_id`.
- [ ] Com duas obras cadastradas, nenhuma consulta de tela devolve linha da outra obra.
- [ ] Mestre e assistente não conseguem ler `contrato_itens`, `medicoes`, `notas`, `nota_itens` nem `orcamentos`.
- [ ] O administrativo não consegue ler `contratos`, `contrato_itens` nem `medicoes`.
- [ ] O cliente só lê `fotos` com `publicada = verdadeiro` e não lê `empreiteiros`.
- [ ] Só o gerente consegue mudar uma medição para `Aprovada`.
- [ ] Aprovar a medição passa os avanços a `Medido`, e avanço `Medido` recusa edição.
- [ ] Nota só passa a `Validada` vinda de `Recebida conferida`, e gera as entradas de estoque.
- [ ] `Saída` sem `torre_id` é recusada; saída maior que o saldo é recusada.
- [ ] Ninguém além do gerente consegue apagar registro, nem o próprio.
- [ ] O gerente consegue trocar o perfil de qualquer usuário.
- [ ] Os valores de status do banco são idênticos aos da interface.
- [ ] Todo campo obrigatório recusa cadastro vazio.

## A conta que vai chegar depois

- `[PENDENTE: formato da planilha de orçamento / exportação do UAU]` — custo: as colunas de `orcamentos` podem precisar de ajuste para a importação.
- `[PENDENTE: valor do plano pago do Supabase]` — custo: fotos diárias devem passar do limite grátis de arquivos.
- `[PENDENTE: número real de pavimentos por torre e lista de serviços]` — custo: é o primeiro cadastro; sem ele nada se lança.

## Decidir depois de usar

- `[DESCOBRIR NO USO: retenção, adiantamento e descontos na medição]` — por enquanto ficou: `medicoes.desconto` e `medicoes.observacao`.
- `[DESCOBRIR NO USO: avanço por quantidade ou por percentual]` — por enquanto ficou: `avancos.quantidade` na unidade do serviço.
- `[DESCOBRIR NO USO: efetivo por função]` — por enquanto ficou: `diario_efetivos.quantidade` por empreiteiro e torre.
- `[DESCOBRIR NO USO: um perfil diferente por obra para a mesma pessoa]` — por enquanto ficou: um perfil só, em `profiles.role`.
