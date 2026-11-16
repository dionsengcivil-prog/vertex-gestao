# PRD Frontend — VERTEX - Gestão de Obras

> Especificação da interface. Quem constrói lê este arquivo.
> Nesta fase não existe banco: as telas funcionam com os dados de exemplo do fim deste arquivo.
> Fonte das decisões: `PLANO-DO-PROJETO.md`.

## O que o sistema é

Gestão de obra em que todo lançamento do canteiro nasce amarrado a obra, fase, torre e pavimento, para fechar medição de empreiteiro, ciclo de laje e apropriação por torre sem planilha. Mestre, almoxarife e assistente usam no celular, no canteiro; gerente, planejador, administrativo e diretoria usam no computador.

## Padrão técnico

- React + Vite (versões atuais), sem biblioteca de componente pronta.
- Visual a partir de um `index.css` próprio.
- Navegação por estado, sem endereço no navegador.
- Tema claro, identidade "Azul Vertex", tirada da logo da empresa: principal `#325085` (azul do símbolo), marinho `#172741` (cabeçalho e menu), fundo `#F2F4F8`, destaque `#6FA0E6`, crítico `#C8463B`, ok `#2E9E6B`, atenção `#E3A008`.
- Logo: a branca (`public/logo.png`) sobre o marinho, inteira no menu lateral e na entrada; só o símbolo no cabeçalho do celular.
- Tipografia: Barlow para texto e Barlow Condensed para números e títulos, com os arquivos dentro do projeto. Rótulos em caixa normal, 13 px no mínimo.
- Etiqueta de status leva ícone e texto, nunca só a cor.
- Referência visual aprovada: `preview.html` (estilo "Painel"). A tipografia e as etiquetas do app evoluíram depois dele; onde divergirem, vale o app. As telas seguem o espaçamento, o tamanho dos números, os cartões e a navegação desse arquivo.
- Celular: barra inferior fixa com até 5 itens (o quinto é "Mais" quando o perfil tem mais telas). Computador: menu lateral à esquerda.
- No celular: botões grandes, pouca digitação, listas de escolha no lugar de texto livre sempre que possível.

## Multi-obra

O sistema guarda várias obras e nunca mistura os dados delas.

- **Seletor de obra:** fica no topo de toda tela, sempre visível, mostrando o nome e o código da obra em uso. Tocar nele abre a lista das obras em que a pessoa está incluída, cada uma com nome, código, cliente, situação e data-meta de entrega.
- **Trocar de obra** recarrega a tela inteira com os dados da obra escolhida e volta para a tela inicial do perfil.
- **A obra escolhida fica guardada no aparelho.** Ao fechar e abrir o app, ele volta na mesma obra. Se a pessoa perdeu o acesso a ela, abre na primeira obra da lista.
- **Nenhuma tela mostra dado de duas obras juntas**, a não ser que seja explicitamente um comparativo entre obras. Na v1 não existe tela de comparativo.
- Quem está em uma obra só vê o seletor com o nome dela, sem lista para abrir.

## Ordem de construção

- **Onda 1:** Login, Aguardando liberação, Painel da obra (blocos 1, 2, 3 e 5), Avanço, Pavimento, Programação, Diário, Diário do dia, Medição (lista), Contrato, Medição (detalhe), Estrutura da obra, Usuários, Meu perfil.
- **Onda 2:** Notas, Nota, Estoque, Saída de insumo, Orçamento, Financeiro (e bloco 4 do painel), Solicitações, Suprimentos, Resumo por torre, Resumo do cliente.

As telas da Onda 2 aparecem no menu só quando forem construídas.

## Perfis

O valor entre parênteses é o que fica gravado; o texto antes é o que aparece na tela.

- **Gerente de obras** (`gerente`): entra no Painel da obra. Vê tudo.
- **Engenheiro planejador** (`planejador`): entra no Painel da obra. Vê tudo, inclusive valores; não altera estrutura, não aprova medição.
- **Assistente de engenharia** (`assistente`): entra em Avanço. Não vê nenhum valor em reais.
- **Administrativo** (`administrativo`): entra em Notas. Vê valor de nota; não vê contrato nem medição.
- **Almoxarife** (`almoxarife`): entra em Notas. Vê quantidade e valor de nota, e estoque.
- **Mestre / encarregado** (`mestre`): entra em Diário. Não vê nenhum valor em reais.
- **Diretoria** (`diretoria`): entra em Resumo por torre. Só leitura.
- **Cliente** (`cliente`): entra em Resumo do cliente. Só avanço e fotos publicadas.
- **Aguardando liberação** (`pendente`): só vê a tela de aviso.

## Mapa de navegação

```
Login → Aguardando liberação (conta nova)
└── Gerente / Planejador: Painel · Avanço · Programação · Medição · Mais
        Mais: Diário · Notas · Estoque · Suprimentos · Financeiro · Orçamento* · Solicitações · Estrutura* · Usuários* · Meu perfil
└── Assistente:     Avanço · Diário · Programação · Estoque · Mais (Suprimentos · Meu perfil)
└── Administrativo: Notas · Suprimentos · Financeiro · Meu perfil
└── Almoxarife:     Notas · Estoque · Suprimentos · Meu perfil
└── Mestre:         Diário · Solicitações · Avanço · Suprimentos · Meu perfil
└── Diretoria:      Resumo por torre · Meu perfil
└── Cliente:        Resumo do cliente · Meu perfil
```
`*` só o gerente.

---

## Tela: Login

**Quem acessa:** todos, antes de entrar.

**O que aparece**
Nome do sistema, campo de email, campo de senha, botão Entrar, link Criar conta.

**Ações**
- **Entrar:** valida e leva para a tela inicial do perfil.
- **Criar conta:** pede nome, email e senha; cadastra e leva para Aguardando liberação.

**Estado vazio**
Não se aplica.

---

## Tela: Aguardando liberação

**Quem acessa:** quem tem perfil `pendente` ou não está incluído em nenhuma obra.

**O que aparece**
O texto "Conta aguardando liberação do administrador" e o botão Sair. Nenhum menu.

---

## Tela: Painel da obra

**Quem acessa:** gerente, planejador.
**Chega aqui por:** item Painel do menu; é a tela inicial.

**O que aparece**
No topo, filtro de Fase e de Torre (padrão: Todas). Abaixo, cinco blocos em cartões, nesta ordem. No celular, um embaixo do outro.

1. **Ciclo de laje.** Uma linha por torre: nome da torre, pavimento em execução, etapa em etiqueta colorida (Pilares e escada, Laje, Concretado), "dia X de Y" (dias desde o início do ciclo contra a meta da torre; em vermelho quando passa), e "N de M lajes no mês" (concretadas no mês contra a meta mensal).
2. **Parado.** Uma linha por restrição Aberta: torre, pavimento, serviço, tipo, "há N dias", responsável. Mais antigas primeiro.
3. **Pronto para medir.** Uma linha por empreiteiro com avanço Conferido e ainda não medido: empreiteiro, valor total em reais, e o valor por torre.
4. **Saúde financeira.** (Onda 2) Por fase e por torre: receita prevista, comprometido, incorrido e saldo, em barras horizontais. Responde: "esta torre ainda cabe no orçamento?"
5. **Efetivo.** Efetivo de hoje por empreiteiro, média da semana atual, média da semana anterior, e destaque do empreiteiro com a maior queda.

**Ações**
- **Clicar numa linha do bloco 1:** abre Avanço naquela torre.
- **Clicar numa linha do bloco 2:** abre Programação com a restrição aberta.
- **Clicar numa linha do bloco 3:** abre o Contrato daquele empreiteiro.
- **Clicar no bloco 4:** abre Financeiro.
- **Clicar no bloco 5:** abre o Diário de hoje.

**Regras por perfil**
- Gerente e planejador veem os cinco blocos.

**Estado vazio**
"Ainda não há lançamentos nesta obra. Comece pelo diário de hoje." Cada bloco sem dados mostra o seu: "Nenhuma laje em execução.", "Nada parado.", "Nada pronto para medir.", "Sem orçamento cadastrado.", "Sem diário hoje."

---

## Tela: Avanço

**Quem acessa:** gerente, planejador, assistente (lançam); mestre (só leitura).
**Chega aqui por:** item Avanço do menu, ou linha do bloco 1 do Painel.

**O que aparece**
Seletor de torre no topo. Abaixo, a lista de pavimentos da torre, o mais alto em cima. Cada linha: nome do pavimento, etiqueta da etapa do ciclo (Não iniciado, Pilares e escada, Laje, Concretado), data prevista e real da concretagem, e a contagem de avanços por status (Lançado, Conferido, Medido). Filtros: serviço e empreiteiro.

**Ações**
- **Clicar num pavimento:** abre a tela Pavimento.

**Regras por perfil**
- Mestre: vê tudo desta tela, sem botão de lançar.

**Estado vazio**
"Nenhum avanço lançado nesta torre."

---

## Tela: Pavimento

**Quem acessa:** gerente, planejador, assistente; mestre (só leitura).
**Chega aqui por:** clique num pavimento da tela Avanço.

**O que aparece**
Título com torre e pavimento. Três partes:
1. **Ciclo de laje:** etapa atual e seis datas (prevista e real de pilares e escada, de laje, e de concretagem).
2. **Avanços do pavimento:** lista com serviço, empreiteiro, quantidade e unidade, data, quem lançou, status.
3. **Fotos:** as fotos do diário marcadas com este pavimento, mais recentes primeiro.

**Campos e informações — Novo avanço**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Serviço | lista | sim | serviços da obra |
| Empreiteiro | lista | sim | empreiteiros com contrato Ativo que inclua este serviço nesta torre |
| Quantidade | número | sim | na unidade do serviço; maior que zero |
| Data | data | sim | padrão hoje |
| Observação | texto | não | |

**Campos e informações — Ciclo**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Etapa do ciclo | lista | sim | Não iniciado, Pilares e escada, Laje, Concretado |
| Datas previstas (pilares, laje, concretagem) | data | não | planejador e gerente |
| Datas reais (pilares, laje, concretagem) | data | não | Concretado exige a data real de concretagem |

**Ações**
- **Novo avanço:** abre o formulário; ao salvar, o avanço entra na lista como Lançado.
- **Conferir:** em avanço Lançado; passa para Conferido e entra no "pronto para medir".
- **Desfazer conferência:** em avanço Conferido; volta para Lançado.
- **Editar / Excluir:** só em avanço Lançado.
- **Atualizar ciclo:** grava etapa e datas.

**Regras por perfil**
- Assistente: lança e edita o próprio avanço; atualiza etapa e datas reais; não confere.
- Planejador e gerente: lançam, conferem e editam datas previstas.
- Mestre: só leitura.
- Avanço Medido não mostra nenhum botão.

**Estado vazio**
"Nenhum avanço neste pavimento."

---

## Tela: Programação

**Quem acessa:** gerente, planejador, assistente.
**Chega aqui por:** item Programação do menu, ou linha do bloco 2 do Painel.

**O que aparece**
Seletor de semana (padrão: a atual, de segunda a domingo) e o PPC da semana em destaque (atividades Concluída ÷ total, em %). Duas abas:
- **Semana:** atividades programadas: torre, pavimento, serviço, empreiteiro, status, causa.
- **Restrições:** restrições, as Abertas primeiro e as mais antigas no topo: tipo, torre, pavimento, serviço, descrição, "há N dias", responsável, data prometida, status.
Abaixo, o histórico de PPC das últimas 8 semanas em gráfico de barras. Responde: "a programação está sendo cumprida?"

**Campos e informações — Atividade**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Torre | lista | sim | |
| Pavimento | lista | não | |
| Serviço | lista | sim | |
| Empreiteiro | lista | não | |
| Status | lista | sim | Programada, Concluída, Não concluída |
| Causa | lista | só se Não concluída | Material, Mão de obra, Projeto, Equipamento, Clima, Outro |

**Campos e informações — Restrição**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Tipo | lista | sim | Material, Mão de obra, Projeto, Equipamento |
| Torre | lista | sim | |
| Pavimento | lista | não | |
| Serviço | lista | não | |
| Descrição | texto | sim | |
| Responsável | lista de pessoas da obra | sim | |
| Data prometida | data | não | |
| Status | lista | sim | Aberta, Removida |

**Ações**
- **Nova atividade / Nova restrição:** abre o formulário.
- **Marcar como Concluída / Não concluída:** direto na linha.
- **Remover restrição:** muda para Removida e grava a data de hoje.

**Regras por perfil**
- Planejador e gerente: criam, editam e removem.
- Assistente: cria restrição e muda status de atividade; não cria atividade nem remove restrição.

**Estado vazio**
Semana: "Nenhuma atividade programada para esta semana." Restrições: "Nenhuma restrição registrada."

---

## Tela: Diário

**Quem acessa:** mestre, gerente, planejador, assistente.
**Chega aqui por:** item Diário do menu.

**O que aparece**
Botão Novo diário no topo. Lista de diários, o mais recente primeiro: data, autor, efetivo total, número de fotos, etiqueta de status. Filtro por status.

**Ações**
- **Novo diário:** abre o Diário do dia com a data de hoje. Se já existe diário de hoje, abre o existente.
- **Clicar numa linha:** abre aquele diário.

**Estado vazio**
"Nenhum diário lançado. Toque em Novo diário."

---

## Tela: Diário do dia

**Quem acessa:** mestre, gerente, planejador (lançam); assistente (revisa).
**Chega aqui por:** Novo diário ou clique numa linha da tela Diário.

**O que aparece**
Data e status no topo. Cinco partes, uma embaixo da outra: Clima, Efetivo, Serviços do dia, Fotos, Ocorrências.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Data | data | sim | uma por obra por dia |
| Clima da manhã | lista | sim | Sol, Nublado, Chuva fraca, Chuva forte |
| Clima da tarde | lista | sim | mesma lista |
| Efetivo (várias linhas) | empreiteiro + torre + quantidade | pelo menos uma | quantidade inteira, maior que zero |
| Serviços do dia (várias linhas) | torre + pavimento + serviço + empreiteiro + descrição | não | pavimento, empreiteiro e descrição opcionais |
| Fotos (várias) | imagem + torre + pavimento + serviço + legenda | não | torre obrigatória em cada foto |
| Ocorrências | texto longo | não | |

**Ações**
- **Salvar rascunho:** grava como Rascunho.
- **Enviar:** muda para Enviado; exige clima e pelo menos uma linha de efetivo.
- **Revisar:** muda de Enviado para Revisado e trava o diário.
- **Devolver:** muda de Enviado para Rascunho.
- **Publicar para o cliente:** chave em cada foto; a foto passa a aparecer no Resumo do cliente.
- **Tirar foto / Escolher foto:** no celular abre a câmera.

**Regras por perfil**
- Mestre: cria e edita enquanto estiver em Rascunho; envia.
- Assistente: não cria; revisa ou devolve.
- Planejador e gerente: fazem tudo, e só eles publicam foto para o cliente.
- Diário Revisado: ninguém edita; a chave de publicar foto continua funcionando.

**Estado vazio**
Efetivo: "Adicione o efetivo de cada empreiteiro." Fotos: "Nenhuma foto neste diário."

---

## Tela: Medição (lista de contratos)

**Quem acessa:** gerente, planejador.
**Chega aqui por:** item Medição do menu.

**O que aparece**
Lista de contratos, o de maior valor pronto para medir primeiro: empreiteiro, número do contrato, valor contratado, medido acumulado, saldo, pronto para medir, status do contrato, e a etiqueta da última medição. Filtros: fase, torre, status.

**Ações**
- **Novo contrato:** só o gerente.
- **Clicar numa linha:** abre o Contrato.
- **Exportar:** baixa a lista em Excel.

**Estado vazio**
"Nenhum contrato cadastrado."

---

## Tela: Contrato

**Quem acessa:** gerente, planejador.
**Chega aqui por:** clique numa linha de Medição, ou linha do bloco 3 do Painel.

**O que aparece**
Cabeçalho com empreiteiro, número e status. Duas partes:
1. **Itens do contrato:** serviço, torre, unidade, preço unitário, quantidade contratada, quantidade medida, saldo, quantidade pronta para medir.
2. **Medições:** número, período, valor, status.

**Campos e informações — Contrato**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Empreiteiro | lista | sim | |
| Número | texto | sim | |
| Data de início | data | sim | |
| Status | lista | sim | Ativo, Encerrado |

**Campos e informações — Item**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Serviço | lista | sim | |
| Torre | lista | sim | um item por serviço por torre |
| Preço unitário | dinheiro | sim | |
| Quantidade contratada | número | sim | |

**Ações**
- **Editar contrato / Novo item / Editar item:** só o gerente.
- **Nova medição:** cria uma medição Em preparo e abre a tela Medição.

**Estado vazio**
Itens: "Nenhum serviço neste contrato." Medições: "Nenhuma medição ainda."

---

## Tela: Medição (detalhe)

**Quem acessa:** gerente, planejador.
**Chega aqui por:** Nova medição ou clique numa medição do Contrato.

**O que aparece**
Cabeçalho: empreiteiro, número da medição, período, status. Lista dos avanços Conferidos do empreiteiro ainda sem medição, agrupados por torre e pavimento, cada um com caixa de marcar: serviço, quantidade, preço unitário, valor. Rodapé: subtotal, desconto, total.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Período — início e fim | data | sim | |
| Avanços incluídos | marcação | pelo menos um | só avanços Conferidos |
| Desconto | dinheiro | não | padrão 0 |
| Observação | texto | não | explica o desconto |
| Motivo da devolução | texto | só ao devolver | |

**Ações**
- **Salvar:** mantém Em preparo.
- **Enviar para aprovação:** muda para Aguardando aprovação.
- **Aprovar:** só o gerente; muda para Aprovada, os avanços passam a Medido e a medição trava.
- **Devolver:** só o gerente; pede o motivo e muda para Devolvida. O planejador corrige e envia de novo.
- **Exportar:** baixa a medição em Excel.

**Regras por perfil**
- Planejador: prepara e envia; não aprova.
- Gerente: faz tudo.

**Estado vazio**
"Não há avanço conferido deste empreiteiro para medir."

---

## Tela: Estrutura da obra

**Quem acessa:** gerente.
**Chega aqui por:** Mais → Estrutura.

**O que aparece**
Quatro abas:
- **Obras:** grupos de contrato e obras.
- **Fases e torres:** árvore Fase → Torre → Pavimentos.
- **Serviços:** catálogo de serviços medíveis da obra.
- **Empreiteiros:** lista de empreiteiros da obra.

**Campos e informações**

| Onde | Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| Grupo de contrato | Nome | texto | sim | |
| Obra | Nome | texto | sim | |
| Obra | Código / apelido | texto | sim | curto; aparece no seletor de obra |
| Obra | Grupo de contrato | lista | sim | |
| Obra | Endereço | texto | não | |
| Obra | Cliente | texto | não | |
| Obra | Data de início | data | sim | |
| Obra | Data-meta de entrega | data | não | |
| Obra | Situação | lista | sim | Em andamento, Concluída, Parada |
| Fase | Nome | texto | sim | ex.: Fase 1 |
| Fase | Centro de custo | texto | sim | |
| Torre | Nome | texto | sim | ex.: Torre 1 |
| Torre | Tipo | lista | sim | Torre, Anexo, Garagem, Lazer |
| Torre | Meta de ciclo (dias) | número | não | padrão 7 |
| Torre | Meta de lajes por mês | número | não | padrão 4 |
| Torre | Status | lista | sim | Ativa, Concluída |
| Pavimento | Nome | texto | sim | ex.: 12º pavimento |
| Pavimento | Ordem | número | sim | define a posição na lista |
| Serviço | Nome | texto | sim | |
| Serviço | Unidade | texto | sim | m², m³, kg, un, vb |
| Empreiteiro | Nome | texto | sim | |
| Empreiteiro | CNPJ | texto | não | |

**Ações**
- **Criar, editar** cada item.
- **Gerar pavimentos:** informa de qual a qual número e cria todos de uma vez.
- **Marcar como Concluída:** em torre; na obra, muda-se a Situação. Nada é apagado se já tiver lançamento.

**Estado vazio**
"Cadastre a primeira fase desta obra."

---

## Tela: Usuários

**Quem acessa:** gerente.
**Chega aqui por:** Mais → Usuários.

**O que aparece**
Lista de pessoas: nome, email, perfil, obras, ativo. As que estão aguardando liberação aparecem no topo, destacadas.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Perfil | lista | sim | Gerente de obras, Engenheiro planejador, Assistente de engenharia, Administrativo, Almoxarife, Mestre / encarregado, Diretoria, Cliente |
| Obras | marcação múltipla | pelo menos uma | |
| Ativo | chave | sim | |

**Ações**
- **Liberar:** escolhe perfil e obras; a pessoa passa a entrar.
- **Editar:** troca perfil, obras ou desativa.

**Estado vazio**
"Ninguém se cadastrou ainda."

---

## Tela: Meu perfil

**Quem acessa:** todos os liberados.

**O que aparece**
Nome (editável), email, perfil e obras (só leitura), botão Sair.

---

## Tela: Solicitações (Onda 2)

**Quem acessa:** mestre, planejador, gerente.
**Chega aqui por:** item Solicitações do menu.

**O que aparece**
Lista, Pendentes primeiro e por data necessária: tipo, equipamento, data necessária, torre, quem pediu, status.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Tipo | lista | sim | Máquina, Hora extra de equipamento |
| Equipamento | lista | sim | Escavadeira, Bobcat, Miniescavadeira, Grua, Cremalheira, Outro |
| Data necessária | data | sim | |
| Horas | número | só em Hora extra de equipamento | |
| Torre | lista | não | |
| Justificativa | texto | sim | |
| Resposta | texto | só ao negar | |

**Ações**
- **Nova solicitação:** entra como Pendente.
- **Aprovar / Negar:** planejador ou gerente.

**Regras por perfil**
- Mestre: cria e vê as próprias; edita só enquanto Pendente.

**Estado vazio**
"Nenhuma solicitação aberta."

---

## Tela: Notas (Onda 2)

**Quem acessa:** administrativo, almoxarife, gerente, planejador (só leitura).
**Chega aqui por:** item Notas do menu.

**O que aparece**
Lista, as que aguardam há mais tempo primeiro: fornecedor, número, data de emissão, fase, valor total, "há N dias", status. Filtros: status e fase.

**Ações**
- **Nova nota:** administrativo, almoxarife, gerente.
- **Clicar numa linha:** abre a Nota.

**Estado vazio**
"Nenhuma nota lançada."

---

## Tela: Nota (Onda 2)

**Quem acessa:** administrativo, almoxarife, gerente, planejador (só leitura).

**O que aparece**
Cabeçalho da nota, anexo (foto ou PDF), lista de itens e a linha do tempo dos status.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Fornecedor | lista (com "novo fornecedor") | sim | |
| Número | texto | sim | |
| Data de emissão | data | sim | |
| Fase | lista | sim | centro de custo de destino |
| Anexo | foto ou PDF | não | |
| Itens (várias linhas) | insumo + quantidade + valor unitário | pelo menos uma | |
| Quantidade recebida (por item) | número | na conferência | preenchido pelo almoxarife |
| Observação da conferência | texto | só se Divergente | |

**Ações**
- **Salvar:** entra como Lançada.
- **Marcar como Aguardando material:** quando a nota chegou antes do material.
- **Conferir recebimento:** almoxarife informa a quantidade recebida de cada item. Tudo igual: Recebida conferida. Alguma diferença: Divergente.
- **Validar:** administrativo ou gerente, só em nota Recebida conferida; muda para Validada e os itens entram no estoque.

**Regras por perfil**
- Administrativo: lança e valida; não confere.
- Almoxarife: lança e confere; não valida. Vê quantidade e valor.
- Nota Validada: ninguém edita.

**Estado vazio**
"Adicione pelo menos um item."

---

## Tela: Estoque (Onda 2)

**Quem acessa:** almoxarife, assistente, administrativo, gerente, planejador.
**Chega aqui por:** item Estoque do menu.

**O que aparece**
Duas abas:
- **Saldo:** insumo, unidade, saldo em estoque.
- **Apropriação:** por insumo e por torre, consumido × previsto no orçamento, com o desvio; os maiores desvios primeiro. Abaixo, as transferências entre fases do período. Filtros: fase e torre.
Clicar num insumo abre o histórico de movimentos (data, tipo, quantidade, destino, quem lançou).

**Ações**
- **Nova saída:** abre Saída de insumo.
- **Novo insumo:** almoxarife e gerente (nome e unidade).

**Regras por perfil**
- Nenhum valor em reais aparece nesta tela.
- Administrativo e planejador: só leitura.

**Estado vazio**
"Nenhum insumo cadastrado."

---

## Tela: Saída de insumo (Onda 2)

**Quem acessa:** almoxarife, assistente, gerente.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Tipo | lista | sim | Saída, Transferência, Estorno |
| Insumo | lista | sim | |
| Quantidade | número | sim | não pode passar do saldo |
| Fase de destino | lista | sim | |
| Torre de destino | lista | sim em Saída | |
| Pavimento | lista | não | |
| Fase de origem | lista | só em Transferência | |
| Data | data | sim | padrão hoje |
| Observação | texto | sim em Estorno | |

**Ações**
- **Salvar:** grava e atualiza o saldo. Movimento não é editado nem apagado; o erro se corrige com um Estorno.

---

## Tela: Orçamento (Onda 2)

**Quem acessa:** gerente.
**Chega aqui por:** Mais → Orçamento.

**O que aparece**
Tabela de linhas de orçamento: fase, torre, categoria, insumo, quantidade prevista, valor previsto.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Fase | lista | sim | |
| Torre | lista | não | vazio = vale para a fase inteira |
| Categoria | lista | sim | Receita, Mão de obra, Material, Equipamento, Outros |
| Insumo | lista | só em Material | |
| Quantidade prevista | número | não | |
| Valor previsto | dinheiro | sim | |

**Ações**
- **Importar planilha:** envia um arquivo CSV com as colunas acima; mostra a prévia e o número de linhas antes de gravar.
- **Nova linha / Editar / Excluir.**

**Estado vazio**
"Sem orçamento cadastrado para esta obra."

---

## Tela: Financeiro (Onda 2)

**Quem acessa:** gerente, planejador, diretoria (tudo); administrativo (parcial).
**Chega aqui por:** Mais → Financeiro, ou bloco 4 do Painel.

**O que aparece**
Filtro de período. Tabela por fase, que abre por torre: receita prevista, custo previsto, comprometido, incorrido, saldo, e custo estimado da obra (incorrido + comprometido ainda não incorrido). Botão "Abrir por empreiteiro" mostra contratado, medido e saldo de cada contrato.

**Ações**
- **Exportar:** baixa em Excel.

**Regras por perfil**
- Administrativo: vê só duas colunas, comprometido e incorrido **de notas**, por fase. Não vê receita, contratos, medições nem o botão por empreiteiro.

**Estado vazio**
"Sem lançamentos financeiros no período."

---

## Tela: Resumo por torre (Onda 2)

**Quem acessa:** diretoria.

**O que aparece**
Um cartão por torre: avanço físico (pavimentos concretados ÷ total), etapa do ciclo, atraso em dias (data real − prevista da última concretagem), custo previsto × incorrido. Botão "Abrir por empreiteiro" no cartão. Fotos recentes da obra.

**Estado vazio**
"Ainda não há avanço publicado."

---

## Tela: Resumo do cliente (Onda 2)

**Quem acessa:** cliente.

**O que aparece**
Um cartão por torre com avanço físico (pavimentos concretados ÷ total) e etapa atual. Abaixo, galeria das fotos publicadas, mais recentes primeiro, com torre, pavimento e legenda. Nenhum valor em reais, nenhum nome de empreiteiro.

**Estado vazio**
"Ainda não há avanço publicado."

---

## Tela: Suprimentos (Onda 2)

O cronograma de suprimentos: o que precisa chegar, para onde e até quando.

**Quem acessa:** gerente, planejador (criam e mudam); administrativo (registra pedido); almoxarife (registra chegada); assistente e mestre (só leitura).
**Chega aqui por:** item Suprimentos do menu.

**O que aparece**
Três números no topo: Atrasados, Para pedir em 7 dias, Aguardando chegada. Abaixo, os filtros: etapa (A pedir, Pedido feito, Entregue; padrão: as duas primeiras), tipo, fase e torre. Depois a lista, com os atrasados primeiro e, entre os demais, a menor data limite para pedir no topo. Cada linha mostra: o insumo com a quantidade (ou a descrição do pacote), o local (fase, torre e pavimento), a data que importa agora — "pedir até 14/11", "prometido para 20/11" ou "chegou em 18/11" —, a necessidade na obra, a etiqueta da etapa e a etiqueta da situação. Nenhum valor em reais.

**Como a etapa e a situação são calculadas** (ninguém digita)
- Etapa: **Entregue** se tem chegada real; senão **Pedido feito** se tem data de pedido; senão **A pedir**.
- Limite para pedir = necessidade na obra − prazo de entrega em dias.
- Situação **Atrasado**: A pedir e hoje passou do limite para pedir; ou Pedido feito com data prometida depois da necessidade; ou Pedido feito e hoje passou da data prometida.
- Situação **Atenção**: A pedir e faltam 7 dias ou menos para o limite.
- Situação **Em dia**: os demais. Linha Entregue não tem situação; mostra "no prazo" ou "N dias depois da necessidade".

**Campos e informações — Linha do cronograma**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Tipo | lista | sim | Insumo por torre, Pacote de compra |
| Insumo | lista (com "novo insumo") | só em Insumo por torre | |
| Quantidade | número | só em Insumo por torre | na unidade do insumo; maior que zero |
| Descrição | texto | só em Pacote de compra | ex.: Esquadrias de alumínio · Fase 1 |
| Fase | lista | sim | |
| Torre | lista | sim em Insumo por torre | em Pacote de compra, vazio = a fase inteira |
| Pavimento | lista | não | pavimentos da torre escolhida |
| Necessidade na obra | data | sim | |
| Prazo de entrega (dias) | número | sim | inteiro, zero ou mais |
| Limite para pedir | data | — | calculado; só leitura |
| Observação | texto | não | |

**Campos e informações — Registrar pedido**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Fornecedor | lista (com "novo fornecedor") | sim | |
| Data do pedido | data | sim | padrão hoje; não pode ser no futuro |
| Data prometida | data | sim | não pode ser antes da data do pedido |

**Campos e informações — Registrar chegada**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Chegada real | data | sim | padrão hoje; não pode ser antes da data do pedido |
| Observação | texto | não | ex.: chegou parcial |

**Ações**
- **+ Novo suprimento:** abre o formulário da linha; ao salvar, entra na lista como A pedir.
- **Clicar numa linha:** abre a linha, com as cinco datas e quem registrou o pedido e a chegada.
- **Editar:** muda os campos da linha. Depois de Pedido feito, só necessidade, prazo e observação.
- **Registrar pedido:** em linha A pedir; passa para Pedido feito.
- **Registrar chegada:** em linha Pedido feito; passa para Entregue e sai da lista padrão.
- **Desfazer pedido / Desfazer chegada:** volta uma etapa, para corrigir registro errado.
- **Excluir:** só em linha A pedir.

**Regras por perfil**
- **Gerente e planejador:** tudo.
- **Administrativo:** registra e desfaz o pedido; não cria linha, não muda necessidade, não registra chegada.
- **Almoxarife:** registra e desfaz a chegada; não cria linha nem registra pedido.
- **Assistente e mestre:** só leitura, sem nenhum botão de gravar.
- **Diretoria e cliente:** não têm a tela.

**Estado vazio**
Sem nenhuma linha: "Nenhum suprimento programado. Comece pelo que precisa chegar nas próximas semanas.", com o botão **+ Novo suprimento** para quem pode criar. Com filtro sem resultado: "Nenhum suprimento com estes filtros."

---

## Textos do sistema

- Botões: Salvar, Cancelar, Novo, Editar, Excluir, Enviar, Conferir, Aprovar, Devolver, Validar, Exportar, Sair.
- Confirmação de exclusão: "Excluir este registro? Não dá para desfazer."
- Aviso de conta pendente: "Conta aguardando liberação do administrador"
- Erro genérico: "Não foi possível salvar. Confira a conexão e tente de novo."
- Erro ao aprovar medição: "Não foi possível aprovar. Tente de novo."
- Sem permissão: "Seu perfil não tem acesso a esta área."

## Dados de exemplo

Fictícios, com a estrutura real da obra de partida. Datas relativas a 13/11/2026.

```
Duas obras, para testar a troca no seletor. Todos os dados abaixo são da Obra 1, salvo o bloco "Obra 2".

Grupo de contrato: Residencial Modelo
Obra 1: Residencial Modelo · código RM-01 · cliente Incorporadora Modelo S.A.
        Av. das Palmeiras, 1200 · início 10/03/2025 · meta de entrega 30/06/2028 · Em andamento

Grupo de contrato: Habitacional Modelo
Obra 2: Condomínio Modelo II · código CM-02 · cliente Habitacional Modelo Ltda.
        Rua dos Ipês, 450 · início 01/09/2026 · meta de entrega 20/12/2027 · Em andamento
        Fase única · centro de custo CC-010 · Bloco A, Bloco B, Bloco C, Bloco D (alvenaria estrutural, 5 pavimentos cada)
        Empreiteiros: Alvenaria Sigma · Lajes Ômega
        Ciclo: Bloco A · 3º · Laje · início 10/11 · concretagem prevista 14/11
               Bloco B · 2º · Pilares e escada · início 11/11
               Blocos C e D · Não iniciado
        Contrato CT-101 Alvenaria Sigma · Alvenaria Bloco A R$ 36,00/m² × 9.500
        Avanço 12/11 · Bloco A 3º · Alvenaria · Alvenaria Sigma · 420 m² · Conferido (R$ 15.120,00 pronto para medir)
        Restrição: Material · Bloco B 2º · "Bloco estrutural 14 em falta" · aberta em 11/11 · Aberta
        Diário 13/11 · Sol / Sol · efetivo 41 (Alvenaria Sigma 27, Lajes Ômega 14) · Enviado

Fases
  Fase 1 · centro de custo CC-001 · Torre 1, Torre 2, Anexo F1, Garagem G1
  Fase 2 · centro de custo CC-002 · Torre 3, Torre 4, Torre 5, Anexo F2
  (pavimentos de exemplo: Torre 1 e 2 do 1º ao 24º; Torre 3, 4 e 5 do 1º ao 24º — número real a confirmar)

Serviços: Forma (m²) · Armação (kg) · Concretagem (m³) · Alvenaria (m²) · Contrapiso (m²) · Reboco (m²)

Empreiteiros: Estrutural Alfa · Formas Beta · Alvenaria Gama · Acabamentos Delta

Ciclo de laje (pavimentos)
  Torre 1 · 14º · Laje · início 09/11 · concretagem prevista 14/11
  Torre 1 · 13º · Concretado · previsto 06/11 · real 07/11
  Torre 2 · 12º · Pilares e escada · início 10/11 · concretagem prevista 17/11
  Torre 2 · 11º · Concretado · previsto 05/11 · real 10/11
  Torre 3 · 1º · Não iniciado · concretagem prevista 30/11

Contratos (Ativo)
  CT-001 Estrutural Alfa · Concretagem T1 R$ 95,00/m³ × 4.800 · Concretagem T2 R$ 95,00/m³ × 4.800 · Armação T1 R$ 2,10/kg × 380.000
  CT-002 Formas Beta · Forma T1 R$ 38,00/m² × 26.000 · Forma T2 R$ 38,00/m² × 26.000
  CT-003 Alvenaria Gama · Alvenaria T1 R$ 42,00/m² × 31.000

Avanços
  10/11 · T1 13º · Concretagem · Estrutural Alfa · 195 m³ · Medido (medição 6)
  11/11 · T1 14º · Forma · Formas Beta · 1.050 m² · Conferido
  11/11 · T1 14º · Armação · Estrutural Alfa · 15.200 kg · Conferido
  12/11 · T2 12º · Forma · Formas Beta · 480 m² · Lançado
  12/11 · T1 6º · Alvenaria · Alvenaria Gama · 610 m² · Conferido
  13/11 · T2 11º · Concretagem · Estrutural Alfa · 198 m³ · Lançado

Medições
  CT-001 nº 6 · 01/11 a 10/11 · R$ 18.525,00 · Aprovada
  CT-002 nº 5 · 01/11 a 10/11 · R$ 39.900,00 · Aguardando aprovação
  CT-003 nº 3 · 20/10 a 31/10 · R$ 25.620,00 · Devolvida (motivo: "quantidade do 5º pavimento não confere")
  CT-001 nº 7 · 11/11 a 13/11 · Em preparo

Diários
  13/11 · Sol / Nublado · efetivo 96 · 7 fotos · Rascunho
  12/11 · Sol / Sol · efetivo 104 · 9 fotos · Enviado
  11/11 · Chuva fraca / Nublado · efetivo 88 · 5 fotos · Revisado
  10/11 · Chuva forte / Chuva fraca · efetivo 61 · 3 fotos · Revisado

Efetivo de 12/11: Estrutural Alfa 38 (T1 22, T2 16) · Formas Beta 29 (T1 15, T2 14) · Alvenaria Gama 24 (T1) · Acabamentos Delta 13 (T1)
Efetivo de 13/11: Estrutural Alfa 38 · Formas Beta 21 · Alvenaria Gama 24 · Acabamentos Delta 13   (maior queda: Formas Beta)

Programação da semana 09/11 a 15/11
  T1 14º Forma · Formas Beta · Concluída
  T1 14º Armação · Estrutural Alfa · Concluída
  T1 14º Concretagem · Estrutural Alfa · Programada
  T2 12º Pilares · Estrutural Alfa · Não concluída · causa: Material
  T1 6º Alvenaria · Alvenaria Gama · Concluída
  PPC até agora: 60%

Restrições
  Material · T2 12º · Armação · "Aço CA-50 10 mm não entregue" · aberta em 08/11 · responsável: administrativo · prometida 14/11 · Aberta
  Equipamento · T1 · "Grua em manutenção preventiva" · aberta em 12/11 · responsável: planejador · Aberta
  Projeto · T3 1º · Forma · "Revisão de fôrma do térreo pendente" · aberta em 28/10 · Aberta
  Mão de obra · T1 6º · Alvenaria · "Equipe reduzida" · aberta em 03/11 · removida em 06/11 · Removida

Solicitações
  Máquina · Miniescavadeira · para 16/11 · Anexo F2 · Pendente
  Hora extra de equipamento · Grua · 4 h · para 14/11 · Torre 1 · Aprovada
  Máquina · Bobcat · para 09/11 · Garagem G1 · Negada (resposta: "já há uma na obra")

Insumos: Aço CA-50 10 mm (kg) · Cimento CP-II (saco) · Bloco de concreto 14 (un) · Argamassa estabilizada (m³)

Notas
  NF 4410 · Aços Norte · 06/11 · Fase 1 · R$ 148.200,00 · Aguardando material
  NF 9912 · Cimentos Sul · 09/11 · Fase 1 · R$ 21.450,00 · Validada
  NF 2031 · Blocos Leste · 11/11 · Fase 1 · R$ 37.800,00 · Divergente ("faltaram 2 paletes")
  NF 5520 · Cimentos Sul · 12/11 · Fase 2 · R$ 9.750,00 · Recebida conferida
  NF 7781 · Argamassas Oeste · 13/11 · Fase 1 · R$ 12.300,00 · Lançada

Movimentos de estoque
  10/11 · Entrada · Cimento CP-II · 650 sacos · Fase 1 (NF 9912)
  11/11 · Saída · Cimento CP-II · 120 sacos · Fase 1 · Torre 1 · 6º
  12/11 · Saída · Cimento CP-II · 90 sacos · Fase 1 · Torre 2 · 3º
  12/11 · Transferência · Cimento CP-II · 60 sacos · Fase 1 → Fase 2
  13/11 · Estorno · Cimento CP-II · 10 sacos · Torre 2 ("lançado em dobro")

Cronograma de suprimentos (hoje = 13/11/2026)
  Insumo por torre · Aço CA-50 10 mm · 18.000 kg · Fase 1 · Torre 2 · 13º · necessidade 24/11 · prazo 12 dias · limite 12/11 · sem pedido · A pedir · Atrasado
  Insumo por torre · Cimento CP-II · 400 sacos · Fase 1 · Torre 1 · necessidade 27/11 · prazo 5 dias · limite 22/11 · sem pedido · A pedir · Em dia
  Insumo por torre · Bloco de concreto 14 · 12.000 un · Fase 1 · Torre 1 · 7º · necessidade 23/11 · prazo 6 dias · limite 17/11 · sem pedido · A pedir · Atenção
  Insumo por torre · Argamassa estabilizada · 30 m³ · Fase 1 · Torre 1 · 6º · necessidade 18/11 · prazo 3 dias · pedido 11/11 · Argamassas Oeste · prometido 17/11 · Pedido feito · Em dia
  Insumo por torre · Aço CA-50 10 mm · 15.000 kg · Fase 1 · Torre 2 · 12º · necessidade 09/11 · prazo 12 dias · pedido 27/10 · Aços Norte · prometido 14/11 · Pedido feito · Atrasado
  Pacote de compra · Esquadrias de alumínio · Fase 1 · necessidade 15/03/2027 · prazo 90 dias · limite 15/12/2026 · sem pedido · A pedir · Em dia
  Pacote de compra · Elevadores · Fase 1 · Torre 1 · necessidade 01/06/2027 · prazo 240 dias · pedido 20/09/2026 · Elevadores Modelo · prometido 20/05/2027 · Pedido feito · Em dia
  Pacote de compra · Fôrmas do térreo · Fase 2 · Torre 3 · necessidade 23/11 · prazo 10 dias · limite 13/11 · sem pedido · A pedir · Atenção
  Insumo por torre · Cimento CP-II · 650 sacos · Fase 1 · necessidade 12/11 · prazo 5 dias · pedido 06/11 · Cimentos Sul · prometido 10/11 · chegou 10/11 · Entregue · no prazo
  Obra 2: Insumo por torre · Bloco estrutural 14 · 9.000 un · Bloco B · 2º · necessidade 16/11 · prazo 7 dias · limite 09/11 · sem pedido · A pedir · Atrasado

Orçamento (valor previsto)
  Fase 1 · Receita · R$ 96.000.000,00
  Fase 1 · Torre 1 · Mão de obra · R$ 9.400.000,00
  Fase 1 · Torre 1 · Material · R$ 14.800.000,00
  Fase 1 · Torre 2 · Mão de obra · R$ 9.400.000,00
  Fase 1 · Torre 2 · Material · R$ 14.800.000,00
  Fase 1 · Torre 1 · Material · Cimento CP-II · 18.000 sacos
  Fase 1 · Torre 2 · Material · Cimento CP-II · 18.000 sacos
```

Usuários de exemplo, um de cada perfil, todos na obra Residencial Modelo; o gerente e o planejador também estão na Condomínio Modelo II:
`gerente@exemplo.test`, `planejador@exemplo.test`, `assistente@exemplo.test`, `administrativo@exemplo.test`, `almoxarife@exemplo.test`, `mestre@exemplo.test`, `diretoria@exemplo.test`, `cliente@exemplo.test`, e `novo@exemplo.test` aguardando liberação.

## Critérios de aceite

Onda 1
- [ ] O gerente entra e cai no Painel da obra, com a obra inteira selecionada.
- [ ] O seletor de obra aparece no topo de todas as telas, com o nome e o código da obra em uso.
- [ ] Trocar a obra no seletor recarrega a tela com os dados só daquela obra; nada da outra obra aparece.
- [ ] Fechar e abrir o app volta na mesma obra que estava escolhida.
- [ ] Um lançamento feito na Obra 1 não aparece em nenhuma tela da Obra 2.
- [ ] O mestre lança o diário de hoje no celular, com efetivo e foto com torre, e ele aparece na lista sem recarregar a página.
- [ ] Lançar um avanço faz ele aparecer no pavimento como Lançado; conferir faz o valor aparecer no bloco "Pronto para medir" do Painel.
- [ ] Aprovar uma medição tira os avanços do "Pronto para medir" e eles passam a Medido, sem botão de editar.
- [ ] Mudar a etapa do ciclo de um pavimento muda a linha da torre no bloco "Ciclo de laje".
- [ ] Uma restrição Aberta aparece no bloco "Parado" com a contagem de dias certa; ao ser removida, some.
- [ ] O PPC da semana bate com atividades Concluída ÷ total.
- [ ] O bloco Efetivo aponta o empreiteiro com a maior queda entre a semana anterior e a atual.
- [ ] Mestre e assistente não veem nenhum valor em reais em nenhuma tela.
- [ ] O mestre não tem no menu Medição, Notas, Financeiro nem Estrutura.
- [ ] Conta nova só vê "Conta aguardando liberação do administrador".
- [ ] Todas as telas funcionam no celular sem rolagem horizontal.
- [ ] Cada lista tem estado vazio com texto próprio.

Onda 2
- [ ] Nota só pode ser validada depois de Recebida conferida; validar aumenta o saldo dos insumos.
- [ ] Saída de insumo sem torre de destino não salva.
- [ ] A aba Apropriação mostra o consumo por torre contra o previsto, e as transferências entre fases.
- [ ] O almoxarife vê o valor da nota; o assistente não vê Notas.
- [ ] O administrativo vê no Financeiro só comprometido e incorrido de notas.
- [ ] A diretoria vê o custo por torre e consegue abrir por empreiteiro.
- [ ] O cliente vê só fotos publicadas e nenhum valor.
- [ ] Em Suprimentos, a linha sem pedido que passou do limite para pedir aparece como Atrasado, no topo da lista.
- [ ] Mudar a necessidade ou o prazo de entrega recalcula o limite para pedir na hora.
- [ ] Registrar o pedido passa a linha para Pedido feito; registrar a chegada passa para Entregue e ela sai da lista padrão.
- [ ] O administrativo não vê o botão de criar linha nem o de registrar chegada; o almoxarife não vê o de registrar pedido.
- [ ] Assistente e mestre veem a lista de Suprimentos sem nenhum botão de gravar, e nenhum valor em reais aparece na tela.
- [ ] Um suprimento lançado na Obra 1 não aparece na Obra 2.

## A conta que vai chegar depois

- `[PENDENTE: número real de pavimentos de cada torre e lista de serviços medíveis]` — custo: os dados de exemplo usam números ilustrativos.
- `[PENDENTE: formato da planilha de orçamento / exportação do UAU]` — custo: as colunas da importação de CSV podem mudar.
- `[PENDENTE: data em que quer estar usando]` — custo: não dá para dizer quando a Onda 2 começa.

## Decidir depois de usar

- `[DESCOBRIR NO USO: retenção, adiantamento e descontos na medição]` — por enquanto ficou: um campo de desconto e uma observação.
- `[DESCOBRIR NO USO: avanço por quantidade ou por percentual]` — por enquanto ficou: quantidade na unidade do serviço.
- `[DESCOBRIR NO USO: efetivo por função]` — por enquanto ficou: só quantidade por empreiteiro e torre.
- `[DESCOBRIR NO USO: referências de interface]` — por enquanto ficou: tema claro, identidade Azul Vertex, estilo Painel.
