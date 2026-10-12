# PDCA — ciclos de melhoria do projeto

Este documento reconstrói, a partir do histórico real de commits, cada ciclo
**Plan → Do → Check → Act** do projeto. Não é um processo paralelo inventado
para a banca: é a leitura formal do que o Git já registra.

## Ciclo 0 — Fundação

- **Plan**: definir stack (Node/Express/EJS/SQLite), arquitetura em camadas e
  convenções de projeto antes de escrever a primeira feature.
- **Do**: `66c7697` (initial commit), `45fdbaa` (scaffold Express/EJS/SQLite),
  `4b4c995` (CLAUDE.md com as convenções).
- **Check**: revisão de que a estrutura de pastas batia com
  `routes → controllers → services → repositories → views` combinada.
- **Act**: convenções travadas em `CLAUDE.md` para não haver deriva de
  arquitetura nas sprints seguintes.

## Ciclo 1 — Sprint 1: schema e layout base

- **Plan**: schema do banco completo desde o início (evitar migração
  incremental dolorosa depois), seed idempotente, layout acessível de base.
- **Do**: `3882f7c` — `database/schema.sql`, `database/seed.js`, partials de
  layout (`head`, `header`, `footer`, `barra-acessibilidade`).
- **Check**: rodar `npm run seed` duas vezes seguidas sem erro (idempotência),
  inspecionar HTML gerado com leitor de estrutura semântica.
- **Act**: schema ficou estável — nenhuma sprint seguinte precisou de
  migração, só popular mais tabelas (quiz, glossário).

## Ciclo 2 — Sprint 2: catálogo de conteúdo

- **Plan**: listagem pública com filtro por categoria/faixa etária, busca
  textual e paginação, sem JavaScript de framework.
- **Do**: `8bee005` — `conteudo.repository.js#listarComFiltros/montarFiltros`,
  `conteudo.controller.js`, view `conteudos.ejs`.
- **Check**: testar manualmente combinações de filtro (categoria só, faixa só,
  busca só, os três juntos) e paginação nos extremos (página 1, última página).
- **Act**: consolidado como RF02, RF03 e RF05 em `docs/requisitos.md`.

## Ciclo 3 — Sprint 3: autenticação e CRUD

- **Plan**: login de admin com bcrypt, CRUD de conteúdo com sanitização de
  HTML e validação de campos obrigatórios (fontes é o mais crítico, dado o
  tema sensível).
- **Do**: `7fdb614` — `auth.service.js`, `auth.middleware.js`,
  `conteudo-admin.service.js` (sanitize-html), `admin.routes.js`
  (`validarConteudo` com `express-validator`).
- **Check**: naquele momento, checagem só manual (login errado, campo
  obrigatório vazio, tentativa de injetar `<script>` no corpo). **Lacuna
  identificada nesta sessão de documentação**: não havia teste automatizado —
  corrigido no Ciclo 8 (`tests/auth.service.test.js`,
  `tests/conteudo-admin.service.test.js`, `tests/auth.middleware.test.js`).
- **Act**: regra "sanitizar sempre no service, nunca confiar no formulário"
  virou convenção para qualquer entrada HTML futura.

## Ciclo 4 — Sprint 4: quiz com correção no servidor

- **Plan**: quiz interativo em que o gabarito nunca é exposto ao cliente antes
  do envio — decisão de segurança tomada no planejamento, não corrigida depois.
- **Do**: `0579afe` — `quiz-player.service.js` (`buscarParaPlayer` sem coluna
  `correta` x `buscarGabarito` com ela), `quiz-admin.controller.js`.
- **Check**: inspeção manual do payload JSON de `/quiz/:id` no DevTools para
  confirmar ausência do campo `correta`. **Lacuna identificada nesta sessão**:
  virou verificação repetível em `tests/quiz-player.service.test.js`.
- **Act**: padrão "repository expõe duas consultas separadas — uma para jogar,
  uma para corrigir" documentado como referência para qualquer módulo de
  avaliação futuro.

## Ciclo 5 — Sprint 5: dúvidas anônimas e glossário

- **Plan**: canal de dúvida sem qualquer campo de identificação, com filtro
  anti-abuso e limite de tentativas — decisão de schema (não código) para
  garantir anonimato: a tabela `duvida` fisicamente não tem coluna para IP/nome/e-mail.
- **Do**: `5cb8ddc` — `duvida.service.js` (`contemConteudoBloqueado`),
  `rate-limit.middleware.js` (`limitarPorSessao`), `glossario.service.js`.
- **Check**: manual (enviar dúvida com link, com palavrão, com spam de
  caracteres, mais de 3 vezes seguidas). **Lacuna identificada nesta sessão**:
  automatizado em `tests/duvida.service.test.js` e
  `tests/rate-limit.middleware.test.js` — inclusive um teste que lê as colunas
  reais da tabela para provar o anonimato (RNF21), não só confiar no schema
  visualmente.
- **Act**: "anonimato garantido pelo schema, não por convenção de código" virou
  princípio de projeto — mais forte que checklist, porque não depende de
  ninguém lembrar de não gravar o dado.

## Ciclo 6 — Sprint 6: acessibilidade e fechamento

- **Plan**: auditoria de acessibilidade (WCAG 2.1 AA), página `/sobre`,
  revisão geral antes da entrega da disciplina.
- **Do**: `54370ba` — rodapé com aviso legal em toda página, barra de
  acessibilidade com persistência em `localStorage`, `sobre.ejs`.
- **Check**: navegação manual só com teclado a partir do skip link,
  verificação de contraste, teste de reload com preferência de fonte ativa.
- **Act**: checklist de acessibilidade formalizado no `CLAUDE.md` como
  requisito de nota, não opcional.

## Ciclo 7 — Pós-entrega: identidade visual, conteúdo real e vitrine pública

- **Plan**: substituir conteúdo de exemplo por conteúdo pesquisado em fontes
  oficiais, dar identidade visual própria ("Maré") e publicar uma vitrine
  estática pública para acesso fácil da banca sem precisar rodar o servidor.
- **Do**: `df3cf8b` (redesign), `8c1fe22` (conteúdo real dos 14 tópicos),
  `35c0109` (workflow de build estático + GitHub Pages).
- **Check**: `dbce2aa` (fix de curvas visuais inconsistentes) e `1bc9510`
  (fix de segfault do `better-sqlite3` no build do GitHub Actions) são,
  literalmente, o "C" do PDCA acontecendo em público — um problema encontrado
  em execução real (build do CI) gerando correção rastreável.
- **Act**: `better-sqlite3` precisa ser compilado do source no CI
  (`npm_config_build_from_source: true` em `deploy-pages.yml`) — decisão
  registrada para não se perder na próxima vez que o workflow for mexido.

## Ciclo 8 — Esta sessão: documentação de Engenharia/Qualidade/Governança

- **Plan**: mapear o projeto aos três pilares pedidos pela orientação
  (Engenharia, Qualidade, Governança) e cobrir os gaps de qualidade antes de
  qualquer sprint nova de produto.
- **Do**: `docs/requisitos.md` (rastreabilidade requisito→commit), suíte
  `tests/` com `node:test` (24 testes, 0 dependência nova), `docs/testes.md`,
  `docs/bpmn/` (fluxo visitante e fluxo admin), este documento, e
  `docs/governanca.md` (próximo).
- **Check**: `npm test` → 24/24 passando.
- **Act**: gaps que ficaram registrados para decisão da dupla/banca antes da
  próxima sprint de código (ver `docs/requisitos.md#gaps-conhecidos`):
  1. ~~`database/seed.js` não popula quiz/questão/alternativa — `/quiz/1`
     retorna 404 hoje~~ — resolvido no Ciclo 9, mesma sessão;
  2. ~~não há link de quiz no menu público~~ — resolvido no Ciclo 9, mesma sessão;
  3. sessão de admin em `MemoryStore` (não sobrevive a restart em produção);
  4. `POST /admin/login` sem rate limit.

## Ciclo 9 — Esta sessão: corrigir o furo do quiz encontrado no Ciclo 8

- **Plan**: o Ciclo 8 encontrou o risco de maior impacto para a apresentação —
  `/quiz/1` em 404 porque o seed nunca populou quiz/questão/alternativa, apesar
  do roteiro de demonstração (`docs/roteiro-demonstracao.md`) mandar abrir essa
  rota no minuto 3:15. Decisão de escopo: um único quiz de demonstração (não
  uma lista de quizzes), coerente com o README ("quiz interativo", no
  singular) — evita construir uma página de listagem que não foi pedida.
- **Do**: `database/seed.js#seedQuizzes` — 1 quiz, 6 questões (uma por tema já
  coberto pelos 14 conteúdos: ciclo menstrual, preservativo, DIU, PrEP,
  consentimento, testagem de ISTs), cada uma com explicação e uma alternativa
  correta; `src/views/partials/header.ejs` — link "Quiz" apontando direto para
  `/quiz/1`, com comentário explicando por que é um link fixo e não uma
  listagem.
- **Check**: banco de dev recriado do zero (`npm run seed`) e testado
  manualmente: `GET /quiz/1` → 200; página não expõe a palavra "correta" em
  nenhum lugar do HTML (gabarito não vaza); `POST /api/quiz/1/responder`
  devolve `acertos`/`total`/`detalhes` calculados no servidor; link `/quiz/1`
  presente na home. `npm test` seguiu em 24/24 (a suíte já usava fixtures
  próprias, isolada do seed de desenvolvimento).
- **Act**: como o build estático (`scripts/build-estatico.js#gerarQuizzes`) já
  lê os quizzes existentes via `quizRepository.listarTodos()`, nenhuma mudança
  de código foi necessária ali — a próxima vitrine publicada no GitHub Pages
  passa a incluir `/quiz/1` automaticamente. Gaps 3 e 4 seguem pendentes para
  a fase de deploy.
