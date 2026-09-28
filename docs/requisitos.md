# Requisitos — rastreabilidade Engenharia

Este documento existe para provar, com referência a commit real, que **o que foi
combinado é o que foi programado**. Cada requisito abaixo aponta para o commit
(ou commits) da sprint em que foi implementado, o arquivo onde a regra vive hoje
e como verificar manualmente.

Convenção: `RF` = requisito funcional, `RNF` = requisito não funcional.

## Requisitos funcionais

| ID | Requisito | Sprint / commit | Onde está implementado | Como verificar |
|---|---|---|---|---|
| RF01 | Visitante lista conteúdos publicados, filtrando por categoria, faixa etária e busca textual, com paginação | Sprint 2 (`8bee005`) | `conteudo.controller.js` → `conteudo.service.js` → `conteudo.repository.js#listarComFiltros` | Acessar `/conteudos?categoria=...&faixa=...&q=...` |
| RF02 | Visitante abre o detalhe de um conteúdo publicado com fontes, tempo estimado de leitura e conteúdos relacionados | Sprint 2 (`8bee005`), Sprint 6 (`7f83038`) | `conteudo.controller.js#detalhe`, `conteudo.service.js` | Acessar `/conteudos/:slug` de um conteúdo existente |
| RF03 | Todo conteúdo exige campo `fontes` preenchido antes de salvar | Sprint 3 (`7fdb614`) | `admin.routes.js` (`validarConteudo`), `schema.sql` (`fontes TEXT NOT NULL`) | Tentar salvar conteúdo no admin sem preencher fontes → erro de validação |
| RF04 | Admin autentica com e-mail/senha e sessão expira após período definido | Sprint 3 (`7fdb614`) | `auth.controller.js`, `auth.service.js`, `app.js` (`cookie.maxAge`) | Logar em `/admin/login`; sessão expira após 2h (`app.js`) |
| RF05 | Admin com papel `admin` ou `editor` faz CRUD de conteúdo (criar, editar, publicar/despublicar, remover) | Sprint 3 (`7fdb614`) | `admin.controller.js`, `conteudo-admin.service.js`, `conteudo.repository.js` | Criar conteúdo em `/admin/conteudos/novo`, publicar e conferir em `/conteudos` |
| RF06 | Corpo HTML de conteúdo é sanitizado no servidor antes de gravar (tags/scripts não permitidos são removidos) | Sprint 3 (`7fdb614`) | `conteudo-admin.service.js` (`sanitizeHtml`, `OPCOES_SANITIZACAO`) | Ver `tests/conteudo-admin.service.test.js` |
| RF07 | Visitante joga um quiz e recebe a correção calculada inteiramente no servidor; a resposta certa nunca é enviada ao navegador antes do envio | Sprint 4 (`0579afe`) | `quiz.controller.js`, `quiz-player.service.js#buscarParaPlayer/corrigir`, `quiz.repository.js#buscarQuestoesParaPlayer` (sem coluna `correta`) x `#buscarGabarito` (com) | Ver `tests/quiz-player.service.test.js`; inspecionar payload de `/quiz/:id` no DevTools — não deve haver campo `correta` |
| RF08 | Admin cadastra quizzes, questões e alternativas, marcando qual alternativa é a correta | Sprint 4 (`0579afe`) | `quiz-admin.controller.js`, `quiz.repository.js` | `/admin/quizzes` → novo quiz → questões → alternativas |
| RF09 | Visitante envia dúvida anônima (sem login, sem campo de nome/e-mail) | Sprint 5 (`5cb8ddc`) | `duvida.controller.js#enviar`, `duvida.service.js#enviarDuvida`, `schema.sql` (tabela `duvida` sem colunas de identificação) | Ver [RNF08](#requisitos-não-funcionais) e `tests/duvida.service.test.js` |
| RF10 | Dúvida enviada passa por filtro de conteúdo impróprio (palavrão, link, spam de caracteres) antes de ser aceita | Sprint 5 (`5cb8ddc`) | `duvida.service.js#contemConteudoBloqueado` | Ver `tests/duvida.service.test.js` |
| RF11 | Envio de dúvida é limitado a poucas tentativas por sessão em uma janela de tempo (anti-spam) | Sprint 5/6 | `rate-limit.middleware.js#limitarPorSessao`, `site.routes.js` (`POST /duvidas`) | Ver `tests/rate-limit.middleware.test.js`; enviar 4 dúvidas em sequência na mesma sessão |
| RF12 | Admin modera dúvidas: responde, rejeita, publica ou despublica no FAQ | Sprint 5 (`5cb8ddc`) | `duvida-admin.controller.js`, `duvida-admin.service.js` | `/admin/duvidas` |
| RF13 | Visitante consulta glossário com busca alfabética | Sprint 5 (`5cb8ddc`) | `glossario.controller.js`, `glossario.service.js` | `/glossario?letra=A` |
| RF14 | Toda página exibe o aviso "este conteúdo é educativo e não substitui consulta com profissional de saúde" | Sprint 6 (`54370ba`) | `views/partials/footer.ejs`, incluído em todo layout | Ver rodapé de qualquer página; conferido também no build estático (`scripts/build-estatico.js#injetarAvisoEstatico`) |
| RF15 | Visitante ajusta tamanho de fonte (3 níveis) e ativa alto contraste, preferência persistida entre sessões | Sprint 1/6 (`3882f7c`, `54370ba`) | `barra-acessibilidade.ejs`, `public/js/acessibilidade.js` (`localStorage`) | Ativar alto contraste, recarregar a página — deve continuar ativo |
| RF16 | Vitrine estática (somente leitura) do catálogo é publicada automaticamente no GitHub Pages a cada push em `master` | `35c0109`, `1bc9510` | `.github/workflows/deploy-pages.yml`, `scripts/build-estatico.js` | Ver Actions do repositório após push em `master` |
| RF17 | Visitante percorre uma trilha por categoria: os artigos publicados daquela categoria em ordem de leitura, com progresso, e o quiz da categoria liberado somente depois que todos forem lidos | Sprint 7 (`c1cd49c`) | `categoria.controller.js` → `categoria.service.js`; `views/site/categoria.ejs` e `categorias.ejs`; `public/js/trilha-categoria.js` (reusa a chave `progresso-leitura-lidos` do `localStorage`) | Acessar `/categorias/prevencao-ists`, ler os 3 artigos e voltar — o cadeado do quiz some. Ver `tests/categoria.service.test.js` |
| RF18 | Questão de quiz pode apontar o artigo de origem; no resultado, a questão errada exibe "Reveja: <artigo>" com link para o conteúdo | Sprint 7 (`c1cd49c`) | `schema.sql` (`questao.conteudo_id`), `quiz.repository.js#buscarGabarito`, `quiz-player.service.js#corrigir`, `public/js/quiz.js`; migração idempotente em `database/migrar.js` (`npm run migrar`), necessária porque `schema.sql` usa `CREATE TABLE IF NOT EXISTS` e não altera tabela existente | Errar uma questão em `/quiz/4` e conferir o link; ver `tests/quiz-player.service.test.js` e `tests/quiz-admin.service.test.js` |

## Requisitos não funcionais

| ID | Requisito | Onde está garantido |
|---|---|---|
| RNF01 | Stack fixa: Node + Express + EJS + SQLite, sem framework front-end, sem bundler | `package.json` (dependências fechadas), `CLAUDE.md` |
| RNF02 | 100% das queries SQL usam prepared statements — nunca concatenação de string | Todos os `*.repository.js` usam `db.prepare(...).run/get/all(...)` com `?` |
| RNF03 | Senha de admin sempre com bcrypt, custo 10, nunca texto plano (nem em seed) | `auth.service.js` (`bcrypt.compare`), `database/seed.js#seedAdmin` (`bcrypt.hash(..., 10)`) |
| RNF04 | Saída no EJS sempre escapada (`<%= %>`); `<%- %>` só para `corpo_html` já sanitizado | Views em `src/views/` |
| RNF05 | Cabeçalhos de segurança HTTP ativos | `app.js` (`helmet()`) |
| RNF06 | Cookie de sessão `secure: true` em produção, `false` em desenvolvimento, controlado por `NODE_ENV` | `app.js` |
| RNF07 | `trust proxy` habilitado em produção para funcionar atrás do Nginx | `app.js` |
| RNF08 | Canal de dúvidas não grava IP, e-mail, nome ou qualquer vínculo com usuário | `schema.sql` (tabela `duvida`: apenas `pergunta`, `status`, `publicada`, `criado_em`); Express não tem middleware de log de IP configurado |
| RNF09 | Nenhuma tabela do banco armazena dado de saúde do usuário (só conteúdo educativo) | `schema.sql` — todas as tabelas guardam conteúdo/estrutura, nunca resposta de saúde de indivíduo |
| RNF10 | Sem caminho absoluto hardcoded — todo caminho via `.env` ou `path.join(__dirname, ...)` | `src/config/database.js`, `app.js`, `scripts/build-estatico.js` |
| RNF11 | Acessibilidade WCAG 2.1 nível AA: HTML semântico, skip link, foco visível, `alt` obrigatório, `label` associado, contraste mínimo 4.5:1 | `src/views/partials/*`, `src/public/css/acessibilidade.css` |
| RNF12 | Layout mobile-first, funcional de 320px a 1920px | `src/public/css/main.css` |
| RNF13 | `.env` nunca versionado | `.gitignore` (`.env`), confirmado: só `.env.example` está rastreado no Git |

## Fora de escopo (confirmado como não implementado, por decisão de projeto)

Diagnóstico/triagem clínica, chatbot ou IA generativa, teleatendimento, app mobile
nativo, integração com SUS, rede social/comentários públicos, upload de arquivo por
usuário final — nenhum desses itens existe no código, por decisão registrada no
`CLAUDE.md` ("Fora de escopo").

## Gaps conhecidos (a decidir com a banca/orientadora)

- Sessão de admin usa `MemoryStore` do Express (não sobrevive a restart do processo em
  produção). Fase de deploy prevê `connect-sqlite3` para persistir sessão — ainda não
  integrado.
- **A numeração de requisitos deste documento não coincide com a usada no quadro do
  Trello e no Documento de Requisitos formal.** Aqui os funcionais vão até RF18 e os
  não funcionais até RNF13, e não existe a categoria `RN` (regras de negócio). O quadro
  cita RF19, RNF14 e RN01/RN08/RN09/RN10, que não têm correspondente aqui — e alguns IDs
  batem em requisitos diferentes (o card da trilha cita RF14/RF15, que neste documento
  são o aviso do rodapé e os controles de acessibilidade). Como este documento existe
  justamente para provar a rastreabilidade entre o combinado e o programado, é preciso
  eleger uma numeração oficial e alinhar a outra antes da entrega.

- Rate limit hoje é só por sessão (`rate-limit.middleware.js`), aplicado apenas em
  `POST /duvidas`. `POST /admin/login` não tem proteção contra força bruta. Fase de
  deploy prevê `express-rate-limit` — ainda não integrado.
