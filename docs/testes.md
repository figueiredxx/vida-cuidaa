# Testes — estratégia de qualidade (referência ISO/IEC 25010 e ISO/IEC/IEEE 29119)

Este documento cobre o pilar **Qualidade** da metodologia do TCC: como o projeto
garante que o sistema não quebra na hora da apresentação, e a quais características
de qualidade de software (ISO/IEC 25010) cada teste automatizado se relaciona.

## Por que `node --test` e não uma lib externa

O `CLAUDE.md` fecha a lista de dependências permitidas (express, ejs,
better-sqlite3, bcrypt, express-session, dotenv, helmet, express-validator,
sanitize-html + connect-sqlite3/express-rate-limit no deploy). Qualquer outra
exige aprovação prévia. `node:test` e `node:assert` são **nativos do Node.js**
(disponíveis desde a v18, usados aqui na v24) — zero dependência nova, zero
`node_modules` adicional, mantendo a stack "explicável em banca por dois alunos".

## Estrutura

```
tests/
  ajuda/
    banco-teste.js          -- cria um SQLite temporário isolado por arquivo de teste
  auth.service.test.js
  auth.middleware.test.js
  categoria.service.test.js
  conteudo-admin.service.test.js
  duvida.service.test.js
  quiz-admin.service.test.js
  quiz-player.service.test.js
  rate-limit.middleware.test.js
```

Cada arquivo de teste roda em processo próprio (comportamento padrão do
`node --test` ao receber múltiplos arquivos), e `tests/ajuda/banco-teste.js`
define `DB_PATH` para um arquivo `.sqlite` temporário **antes** de qualquer
`require` de repository/service — isso garante que os testes nunca tocam
`database/database.sqlite` (o banco real de desenvolvimento).

## Como rodar

```bash
npm test
```

Saída esperada (resumo): `24 tests`, `24 pass`, `0 fail`.

## O que cada suíte cobre e por quê

| Arquivo | Característica ISO/IEC 25010 | O que garante |
|---|---|---|
| `quiz-player.service.test.js` | **Segurança (confidencialidade)** + **Funcionalidade (correção)** | A alternativa correta nunca é enviada ao navegador antes da resposta (RF08); a pontuação é calculada certo em acerto/erro/questão em branco; a tentativa é registrada mesmo para visitante anônimo |
| `duvida.service.test.js` | **Segurança (privacidade)** + **Funcionalidade** | Validações de tamanho/conteúdo bloqueado funcionam (RF17); e o teste mais importante do arquivo — a linha gravada no banco **não tem nenhuma coluna capaz de identificar quem perguntou** (RNF21), testado inspecionando as colunas reais da tabela |
| `auth.service.test.js` | **Segurança (autenticação, confidencialidade)** | Login falha para e-mail/senha incorretos; quando autentica, o hash bcrypt nunca sai do service |
| `auth.middleware.test.js` | **Segurança (controle de acesso)** | Rota admin redireciona sem sessão; papel fora da lista permitida recebe 403 |
| `conteudo-admin.service.test.js` | **Segurança (integridade)** + **Funcionalidade** | `<script>` e outras tags não permitidas são removidas do corpo do conteúdo antes de gravar (RNF25); dois conteúdos com o mesmo título geram slugs distintos (evita colisão de URL) |
| `rate-limit.middleware.test.js` | **Confiabilidade (tolerância a falhas/abuso)** | O limite de tentativas por sessão realmente bloqueia depois do Nº configurado e libera depois que a janela de tempo expira (RNF24) |
| `categoria.service.test.js` | **Funcionalidade (correção)** | A trilha lista só os artigos **publicados** daquela categoria, na ordem de leitura (mais antigo primeiro), e devolve o quiz correto — ou `null` quando a categoria ainda não tem quiz (RF01 e RF14) |
| `quiz-admin.service.test.js` | **Funcionalidade (integridade referencial)** | O vínculo questão→artigo é gravado e trocado corretamente na edição, e o admin só pode vincular artigos **da categoria daquele quiz**, nunca de outro assunto — recurso da Sprint 7, sem RF próprio |

## O que fica fora do automatizado (verificação manual, por decisão de escopo)

Coerente com a stack "sem bundler, sem framework de front-end": não há um test
runner de UI (Cypress/Playwright) no projeto. Os itens abaixo continuam sendo
verificados manualmente, com roteiro fixo em `docs/roteiro-demonstracao.md`:

- Acessibilidade de fato percebida (navegação por teclado, leitor de tela) —
  automatizável no futuro com `axe-core`, mas isso é dependência nova e ficou
  fora do escopo desta sprint de documentação.
- Renderização visual das views EJS (checada visualmente/pelo roteiro de demo).
- Fluxo de ponta a ponta via HTTP (checado manualmente subindo `npm start` e
  testando cada rota — ver `docs/pdca.md` para o registro desses ciclos).

## Ciclo de vida do teste dentro do PDCA

Cada suíte nova entra no ciclo **Check** do PDCA do projeto (ver `docs/pdca.md`):
sempre que uma sprint futura mexer em `services/`, a expectativa é rodar
`npm test` antes de abrir o commit, para pegar regressão cedo — especialmente
em `duvida.service.js` e `quiz-player.service.js`, que carregam os dois
requisitos de segurança mais sensíveis do projeto (anonimato e não vazamento de
gabarito).
