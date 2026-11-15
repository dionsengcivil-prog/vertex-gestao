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
