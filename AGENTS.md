# VERTEX - Gestão de Obras

Gestão de obra multi-obra: todo lançamento do canteiro nasce amarrado a obra, fase, torre e pavimento, para fechar medição de empreiteiro, ciclo de laje e apropriação por torre. Usado pelo gerente de obras e sua equipe (8 perfis).

React + Vite, sem biblioteca de componentes; Supabase e Vercel entram nas etapas seguintes. Uma shell só para todos os perfis (`src/pages/AppShell.jsx`); o que muda entre eles é o menu, em `src/lib/perfis.js`.

Fonte das decisões: `PLANO-DO-PROJETO.md`, `PRD-FRONTEND.md`, `PRD-BACKEND.md`. Referência visual aprovada: `preview.html` (estilo Painel; as cores e a fonte do app mudaram depois dele).

## Este app é multi-obra

O sistema guarda várias obras e nunca mistura os dados delas. Vale para tudo o que já existe e para todo módulo novo.

1. **Entidade `obras`:** nome, código/apelido, endereço, cliente, data de início, data-meta de entrega e situação (`Em andamento`, `Concluída`, `Parada`).
2. **Toda tabela de lançamento tem `obra_id`, obrigatório**, apontando para `obras`. Tabela nova sem `obra_id` está errada. As únicas exceções são `profiles`, `grupos_contrato` e a própria `obras`.
3. **Toda leitura e toda gravação filtra por `obra_id`** da obra em uso. Consulta sem esse filtro está errada, mesmo que a tela "funcione" com uma obra só.
4. **Seletor de obra no topo do app, sempre visível.** Trocar de obra recarrega a tela inteira com os dados daquela obra.
5. **A obra escolhida fica guardada no aparelho.** Ao fechar e abrir, o app volta na mesma obra.
6. **Nenhuma tela mostra dado de duas obras juntas**, a não ser que seja explicitamente um comparativo entre obras.
7. **Permissão:** cada pessoa só alcança as obras em que está na tabela `membros`.

Como isso está no código:

- **A camada de dados injeta a obra; as telas não passam `obra_id`.** `lib/dados.js` guarda a obra em uso (`definirObraAtual`) e toda função filtra com `daObra(...)` por dentro. Função nova em `dados.js` que lê uma tabela de lançamento sem `daObra` está errada.
- **Trocar de obra remonta as telas.** Em `AppShell.jsx`, `<Telas key={obraId}>`. Não guarde lista, filtro ou cache fora dessa árvore sem a obra na chave.
- **Os dados de exemplo têm duas obras diferentes** (`o1` RM-01, completa; `o2` CM-02, com pouca coisa). Teste toda tela nova nas duas.

### Antes de dar um módulo novo por pronto

- [ ] A tabela nova tem `obra_id` obrigatório.
- [ ] Toda consulta do módulo filtra por `obra_id`.
- [ ] Com as duas obras de exemplo (`RM-01` e `CM-02`), um lançamento feito em uma não aparece na outra.
- [ ] Trocar a obra no seletor muda os dados da tela nova.

## Onde o código novo vai

Uma pergunta decide: **"isto continuaria verdade se a tela fosse outra?"**

- **Sim → `src/lib/*.js`.** Regra pura: cálculo, recorte, decisão, formatação. Sem React, sem banco, sem `window`. Roda no Node sem bundler (import com `.js` explícito). É a única camada com teste.
- **Não → `src/screens/*.jsx`.** Estado de interface, layout, o que se toca. A tela **pede a decisão à lib**; não decide.
- `src/lib/dados.js` — **única porta dos dados.** Nenhuma tela lê `mockData.js` nem o Supabase direto.
- `src/lib/supabase.js` — a conexão (nula enquanto não houver `.env.local`).

Três consequências práticas:

1. **`if` de negócio dentro de tela vai para `lib`**, mesmo com três linhas — se a linha decide *o que é verdade*, e não *o que aparece*.
2. **Constante compartilhada tem um dono só.** Perfis, menus e permissões moram em `lib/perfis.js`; etapas do ciclo em `lib/ciclo.js`. Os textos de status são idênticos aos CHECK do `PRD-BACKEND.md`, com acento e maiúscula.
3. **Arquivo grande não é problema; arquivo confuso é.** Quebre quando o arquivo passar a ter dois motivos para mudar.

**Dinheiro:** quem não pode ver valor (`pode.verValores` em `lib/perfis.js`) não recebe tela com preço. Avanço, diário e fotos não carregam valor nenhum; preço só existe em contrato e medição.

## Régua de verificação

```bash
npm run check
```

Build + lint + testes. **Fecha em zero** — não há linha de base herdada aqui. Aviso novo é seu e é de agora; conserte no mesmo lote.

Nada disso prova que a tela funciona. Verde com a tela em branco é rotina: a tela se confere olhando, nas duas obras.

**Todo bug corrigido em `src/lib/` nasce com teste junto**, no mesmo lote, em `tests/`.

## Antes de subir pro GitHub

Diff que toca em `src/lib/supabase.js`, `src/lib/dados.js`, políticas RLS, migrations ou fluxo de dinheiro (`src/lib/medicao.js`, contratos, medições, notas) → rodar a revisão de código (`/code-review` no Claude Code, `/review` no Codex) antes de subir. É por caminho, não por julgamento: nesses arquivos o erro não aparece na tela.

## Deploy

Ainda não publicado. O padrão combinado: a pessoa diz "sobe pro GitHub", o agente sobe com git, e a Vercel publica sozinha. A pessoa não digita comando.

## Armadilhas desta base

- **A entrada é de mentira.** `pages/Login.jsx` deixa escolher um perfil de exemplo; não há senha. Sai na etapa do Supabase.
- **"Hoje" é fixo nos dados de exemplo** (`HOJE_MOCK` em `mockData.js`, lido por `hoje()` em `dados.js`). Use sempre `hoje()`, nunca `new Date()`, ou os dias de ciclo e de restrição parada saem errados no exemplo.
- **O que se grava vale só até recarregar a página.** `dados.js` trabalha numa cópia em memória dos dados de exemplo; não há banco ainda. Foto anexada também some ao recarregar.
- **A permissão é conferida em dois lugares, de propósito:** a tela esconde o botão (`pode.*`) e `dados.js` recusa a gravação (`negado(...)`). Ao criar uma gravação nova, faça os dois; só esconder o botão não protege nada quando o banco entrar.
- **Mudança de status passa por `lib/fluxos.js`** (avanço, diário, medição). Não mude `status` direto numa tela nem em `dados.js` sem perguntar à transição.
- **Tela em branco logo depois de editar um arquivo, só no `npm run dev`:** neste Windows o servidor de desenvolvimento às vezes serve a versão anterior de um arquivo editado duas vezes em seguida (aparece como "X is not defined" no console, com o `npm run check` verde). Reinicie o servidor antes de procurar defeito no código.
- **Cores:** vêm da logo da empresa (identidade "Azul Vertex"), todas como variáveis no topo de `src/index.css`. Não escreva cor solta em tela nem em componente. A logo branca (`public/logo.png`) só funciona sobre o marinho; a colorida está guardada em `design/logo-cor.png`, fora do app.
- **Visual:** fonte Barlow e Barlow Condensed, guardadas em `src/fonts` (o app não depende de internet para a fonte). Só existem os pesos 400, 600 e 700; pedir outro peso no CSS faz o navegador inventar um negrito falso. Status sempre com ícone + texto (`Tag`), nunca só cor.
- **Exportar para Excel ainda não existe.** Os botões Exportar mostram um aviso.
- **Telas com `onda: 2` em `lib/perfis.js`** estão no menu mas abrem "em breve".
- **Tabela nova nasce fechada para o app** (vale a partir da etapa do banco). Toda tabela precisa de `grant` escrito na migration, só para `authenticated`. Erro "permission denied for table (42501)" é GRANT faltando, não RLS. Nunca `grant all`, nunca `to anon`.

## Higiene de código (vale para toda mudança)

Cada função morta é uma mentira que o próximo leitor precisa desmascarar.

- **Ao remover um recurso, cace a cadeia inteira no mesmo lote:** a função em `lib/dados.js` → a exposição no contexto → os chamadores nas telas → a query. Função exposta que nenhuma tela chama é lixo.
- **Zero avisos novos de lint.** Aviso antigo que você encontrar, limpe se já estiver tocando no arquivo.
- **Código comentado não é backup, o git é.** Comentário explica *por quê*. Bloco comentado sem explicação, apague.
- **Antes de apagar, prove que está morto:** grep pelo símbolo no projeto inteiro, e verifique quem chama o *wrapper*, não só a função. Depois confira órfãos: quem só era chamado pelo que você removeu morre no mesmo commit.
- **Estado que nunca muda ou nunca é lido é lixo** — `useState` sem setter, prop que ninguém consome, flag que ninguém liga.
- **Limpeza NUNCA toca no banco nem em arquivo de dado.** Tabela ou coluna órfã continua existindo até decisão de quem é dono. Na dúvida, pergunte.

## O que entra neste arquivo

Ele é lido inteiro em toda sessão — cada linha custa em todas elas. Só entra o que o código não conta sozinho: armadilha, o porquê de uma decisão, convenção que difere do padrão, proibição, comando não óbvio. Não entra árvore de pastas, lista de dependências nem histórico do que foi feito.

## Checklist de testes vivo

Combinado com o dono do projeto em 15/11/2026. Vale em toda conversa.

Eu (o dono do projeto, gerente de obras) não programo: decido o produto e testo na tela. Você constrói. Para eu saber
**o que testar** e você saber **o que deu errado**, a gente usa uma página de testes viva,
que você mantém e eu marco.

### 1. A página

Na primeira melhoria que precisar de teste, crie uma página publicada chamada
**"Testes do VERTEX - Gestão de Obras"**, com um banco de dados próprio (as marcas ficam guardadas no
servidor, não no navegador). Se não existir ferramenta de página publicada nesta conversa,
crie um arquivo `testes.html` na pasta do projeto que guarde as marcas no próprio navegador, e
me diga que, nesse caso, você precisa que eu cole o resultado de volta.

A página tem:

- **No topo, a rodada:** nome ("Rodada 2 · Cadastros no banco · 21/10"), uma nota curta do que
  mudou e o que fazer antes de começar (por exemplo, "aperte Ctrl+F5").
- **Um cartão por item a testar**, agrupado por módulo, com:
  - **título**: o que se testa, em uma linha;
  - **passos**: numerados, uma ação por passo, com os nomes exatos que aparecem na tela
    ("Clique em **+ Empresa**", e não "crie uma empresa");
  - **esperado**: o que eu devo ver se deu certo, de forma que eu consiga dizer sim ou não
    sem interpretar;
  - **três botões**: `A testar` · `Funcionou` · `Problema`;
  - **um campo de observação**, para eu escrever o que vi.
- Sem enfeite: a página é ferramenta. Funciona no celular.

### 2. O ciclo

1. **Você constrói** a melhoria.
2. **Antes de me passar**, você confere o que dá para conferir sozinho: roda os testes e o
   "portão" do projeto (o comando que diz se está tudo verde; aqui, `npm run check`), olha a tela no navegador, e
   quando mexer no banco, roda o teste de permissões. **Só me passa o que passou.** Se algo
   você não conseguiu conferir (por exemplo, porque exige a minha senha), diga qual.
3. **Você escreve os itens** na página e me manda o link com um resumo de uma linha por item.
4. **Eu testo** e marco cada item, escrevendo o que vi nos que deram problema.
5. **Eu aviso** ("atualizei os testes"). Você lê as marcas direto da página: eu não preciso
   copiar nada para o chat.
6. **Para cada problema**, você descobre a causa antes de mexer: lê o código, os registros do
   servidor e o banco. Me explica em uma linha o que estava acontecendo e o que mudou.
7. **Você limpa a página**: o que passou **sai**; o que deu problema volta como `A testar`, com
   os passos ajustados; o que é novo entra. Atualiza a nota da rodada.
8. Repete até não sobrar nada. Aí a rodada fecha, e a página diz "nada a testar agora".

**Nada morto fica guardado.** A página mostra só o que falta testar. Se você quiser manter
histórico, uma linha por item aprovado vai para um diário em texto no projeto
(`docs/DIARIO.md`: data, o que mudou, o que passou), nunca na página.

### 3. Como escrever um bom item

- **Um comportamento por item.** "Cadastrar e editar empresa" são dois, se puderem falhar
  separados.
- **Passos que qualquer pessoa repete** sem saber programar, na ordem da tela.
- **Esperado observável:** "a empresa aparece na lista com o telefone novo", e não "salva
  corretamente".
- **Teste o caminho errado também:** o campo vazio, o e-mail inválido, o botão clicado duas
  vezes, a coisa que não deveria ser permitida.
- **Diga qual conta usar** quando importar (admin, usuário comum, outro perfil).
- **Diga se o teste grava dado de verdade**, e como desfazer depois.

### 4. Quando o banco de dados entra: os itens que nunca faltam

Ligar o banco é o momento em que mais coisa quebra calada. Para cada tela que passa a gravar,
inclua itens que provem:

| Prova | O item pergunta | Por que |
|---|---|---|
| **Ficou gravado** | Depois de salvar, **aperte F5**: continua lá? | O protótipo guardava na memória; o banco pode não ter gravado e a tela fingir que sim |
| **Gravou certo** | O que voltou do F5 é exatamente o que eu digitei (acento, data, número, ordem)? | Tradução entre a tela e o banco perde campo sem avisar |
| **Cada um vê o seu** | Com a conta de outro perfil (e de outro cliente, obra ou empresa, se o app tiver vários), eu vejo só o que devo? | A regra de permissão do banco é a única tranca de verdade; esconder botão não protege nada |
| **Quem não pode, não consegue, e é avisado** | O perfil sem permissão tenta gravar: o banco recusa **e a tela diz por quê**? | Recusa calada parece bug; aviso claro é produto |
| **Nada duplica** | Salvar duas vezes, importar de novo, tirar e pôr de volta: aparece repetido? | Botão clicado duas vezes e reimportação são as duplicatas mais comuns |
| **Apagar não some com histórico** | Desativar algo que outra tela usa: a outra tela continua funcionando? | Registro que outro lugar lê se desativa, não se apaga |
| **Lista vazia e lista grande** | A tela sem nenhum dado diz o que fazer? Com muitos dados, aparece tudo? | O banco corta listas grandes sem avisar (no Supabase, 1.000 linhas) |
| **Erro de rede** | Se a internet cair no meio, a tela diz que não salvou? | Gravação perdida sem aviso é o pior defeito possível |

E do seu lado, antes de me passar qualquer item de banco:

- **Toda mudança no banco é um arquivo versionado** no projeto, nunca um clique no painel.
- **Um teste de permissões automático**: cada perfil tenta ler e gravar no que é seu e no que é
  do vizinho, dentro de uma transação desfeita no fim (nada fica no banco). Roda depois de
  qualquer mudança de permissão.
- **Revisão de código** em toda mudança que toca a camada de dados, as regras de permissão ou o
  login, antes de subir.
- **Os avisos de segurança do painel do banco** conferidos depois de cada mudança, com cada
  aviso explicado (intencional ou a corrigir).

### 5. O que você nunca faz

- Digitar senha, chave ou token, nem criar conta em meu nome. Se um teste precisa disso, o
  passo diz "entre com a sua conta" e eu faço.
- Colocar qualquer segredo (chave, senha, `.env`) no código, no Git ou na página de testes.
- Usar dado real de cliente como exemplo. Exemplo é sempre fictício.
- Dizer que algo está pronto sem ter rodado o portão e olhado a tela; e, se não conseguiu
  olhar, dizer isso.
- Apagar dado de verdade para "limpar o teste". Desativar, sim; apagar, só com o meu ok.

### 6. Como me responder

Depois de cada rodada, uma resposta curta:

- o que passou e saiu da página;
- uma tabela com cada problema: **o que estava acontecendo** · **o que mudou**;
- o que voltou para teste e o que é novo;
- o que você não conseguiu conferir e por quê;
- o que está esperando uma decisão minha.

Em português simples, sem jargão. Se precisar de uma decisão minha, pergunte uma coisa de cada
vez, com a sua recomendação.

## Onde paramos (atualizado em 16/11/2026)

Esta seção é a passagem de bastão entre conversas. Ao retomar, leia, confira com `git log` e `npm run check`, e reescreva-a no fim da conversa seguinte.

### Pronto

- **Plano e PRDs:** `PLANO-DO-PROJETO.md`, `PRD-FRONTEND.md` e `PRD-BACKEND.md`, com 13 módulos em duas ondas.
- **Onda 1 construída e gravando em memória:** Painel, Avanço, Pavimento, Programação, Diário, Medição (contratos e medições), Estrutura (inclui abrir obra nova) e Usuários. Entrada de mentira por perfil; oito perfis com menus próprios; seletor de obra com duas obras de exemplo.
- **Identidade:** Azul Vertex (cores da logo), fonte Barlow, logo no menu e no cabeçalho. Nome do app: VERTEX - Gestão de Obras.
- **Notas e almoxarifado (primeiro módulo da Onda 2):** telas Notas e Nota, com lançar, itens, aguardando material, conferência do almoxarife, divergência e validação. 37 testes automáticos.
- **GitHub:** repositório privado `dionsengcivil-prog/vertex-gestao`, ramo `main`. Autor dos envios: o e-mail da conta do GitHub do dono, configurado só neste repositório.
- **Cópia de segurança de 15/11/2026** em `C:\Projetos\copias-de-seguranca\`, com `COMO-RESTAURAR.txt` ao lado.
- **Página de testes:** "Testes do VERTEX - Gestão de Obras", publicada em https://claude.ai/artifact/Fs6Z7EjjCYYFcUUe3LT4EK (privada do dono). As marcas ficam no banco da página: coleção `itens`, documento `rodada/atual`. Itens aprovados saem da página e viram linha em `docs/DIARIO.md`.

### Pela metade

- **Rodada 1 de testes (Notas):** 1 de 13 itens aprovado pelo dono. Faltam 12 na página, de `n02` a `n13`. O dono escreveu "Funcionou" no chat, mas só o item da lista estava marcado.
- **Revisão de código de Notas feita em 16/11, nada corrigido ainda.** O dono pediu só o relatório. Achados que pedem decisão ou conserto:
  - **Gerente não confere recebimento.** O plano (matriz, linha "Conferir recebimento") diz que não; a proposta aprovada pelo dono dizia "gerente faz tudo". O código segue a matriz. Precisa de decisão do dono. Efeito colateral: na obra CM-02 só há gerente e planejador, então a nota de exemplo de lá nunca sai de Lançada.
  - **Nota pode ficar sem item.** O PRD pede pelo menos um; o código só cobra isso na conferência.
  - **Cabeçalho da nota não se edita** depois de criada (fornecedor, número, data, fase, anexo).
  - **Regra de negócio dentro das telas de nota**, contra a seção "Onde o código novo vai": lista de status e `tomDaNota` em `screens/notas.jsx`; quando conferir, quais botões aparecem e o que é item divergente em `screens/nota.jsx`; a ordenação da lista. Devem ir para `lib/fluxos.js`.
  - **Testes de nota não cobrem o gerente** nem o planejador sem botões.
- **Cronograma de suprimentos:** está no plano (módulo 13) e no PRD-FRONTEND (tela Suprimentos). Falta a tabela `suprimentos` no `PRD-BACKEND.md`. Nada construído.
- **Combinados de Notas ainda não feitos:** validar não dá entrada no estoque (vem com o Estoque); anexo só em foto, sem PDF; Financeiro de notas do administrativo.
- **Nome do dono:** o plano não traz; na seção do checklist está "o dono do projeto, gerente de obras".

### Próximo passo

1. Perguntar ao dono se o gerente confere recebimento, e alinhar plano e código com a resposta.
2. Corrigir os achados da revisão de Notas, rodar `npm run check`, atualizar os itens da página de testes e pedir ao dono para terminar a rodada 1.
3. Depois, seguir a Onda 2 na ordem em que um depende do outro: Estoque e apropriação (que liga a nota validada à entrada), Orçamento e Financeiro, Solicitações, Cronograma de suprimentos, resumos da Diretoria e do Cliente.
4. Só com a Onda 1 testada pelo dono: etapa do banco (Supabase) da skill `criar-app-v3`, seguindo a tabela "Quando o banco de dados entra" do checklist acima.

### Para quem retoma

- Skills usadas: `criar-app-v3` (construção), `ponytail` (o menor caminho que funciona, sem biblioteca nova), `code-review` (duas frentes: padrões e especificação).
- Este computador não tem Python nem `zip`; use Node e o `tar.exe` do Windows.
- Se um `.md` do projeto não gravar ("EBUSY"), ele está aberto no Word: peça ao dono para fechar, sem salvar.
