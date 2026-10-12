# Governança — suporte (ITIL), metas (COBIT) e riscos

Este documento cobre o pilar **Governança**: como o projeto pensa o uso no
dia a dia depois de "pronto", quais metas mostram se está dando certo, e quais
riscos foram avaliados para a plataforma passar na banca sem susto.

## ITIL — suporte e operação

O escopo do TCC não inclui um service desk formal, mas os processos essenciais
de suporte de um sistema pequeno em produção estão definidos:

### Gestão de incidentes

| Nível | O que é | Exemplo | Quem resolve | Onde olhar primeiro |
|---|---|---|---|---|
| Crítico | Site fora do ar | `systemctl status plataforma` falhando, Nginx 502 | Responsável técnico da dupla | `sudo journalctl -u plataforma -f` (logs do serviço), `sudo nginx -t` |
| Alto | Funcionalidade principal quebrada | Quiz não corrige, dúvida não envia | Responsável técnico | Rodar `npm test` localmente para isolar se é regressão de código; conferir `NODE_ENV` e `.env` em produção |
| Baixo | Cosmético/conteúdo | Erro de digitação em conteúdo, categoria mal nomeada | Qualquer um com acesso ao admin | Corrigir direto em `/admin/conteudos` |

Procedimento de restauração do serviço (documentado também no `README.md`):
`sudo systemctl restart plataforma` → conferir `systemctl status` → conferir
`/var/log` do Nginx se o erro persistir no proxy.

### Gestão de mudanças

Toda mudança de código segue: branch (se for além de ajuste trivial) → commit
com mensagem descritiva em português → teste manual guiado pelo
`docs/roteiro-demonstracao.md` (ou `npm test` quando a mudança tocar
`services/`) → deploy via `git pull` + `npm install --omit=dev` +
`sudo systemctl restart plataforma` no VPS (passos já descritos no `README.md`).
Não há ambiente de homologação separado — plataforma pequena, dev local já
cumpre esse papel antes do deploy em produção.

### Gestão de nível de serviço (SLA simplificado, apropriado ao porte do TCC)

| Item | Meta |
|---|---|
| Disponibilidade do site | Best effort — sem contrato de SLA formal (projeto acadêmico, VPS única, sem redundância) |
| Tempo de moderação de dúvida pendente | Meta interna: até 48h entre pergunta enviada e resposta/moderação, para o FAQ não ficar defasado |
| Backup do banco | `database/database.sqlite` deve ter cópia (`cp` ou snapshot do VPS) antes de qualquer `npm run seed` em produção, porque o seed pode recriar dados |

### Gestão de acesso

Só existem os papéis `admin` e `editor` (`usuario.papel`, ver `schema.sql`).
Não há autoatendimento de cadastro — usuário admin é criado via seed/script,
nunca por formulário público. Reduz superfície de ataque por design.

## COBIT — metas e indicadores

Adaptado ao porte do projeto (não é uma corporação — são metas mensuráveis que
provam à banca que o sistema entrega o que promete).

### Metas de negócio (o "porquê" do sistema)

| Meta | Indicador | Como medir hoje |
|---|---|---|
| Educar sobre saúde sexual/reprodutiva com fonte confiável | % de conteúdos com campo `fontes` preenchido | 100% — é `NOT NULL` no schema, impossível salvar sem (RF03) |
| Canal de dúvida acessível sem barreira de identificação | % de dúvidas enviadas sem qualquer dado identificável gravado | 100% por construção de schema (RNF21), não por auditoria manual |
| Conteúdo acessível a diferentes públicos | Cobertura de faixa etária (`adolescente`/`adulto`/`todas`) nos 14 conteúdos publicados | Consultável via `SELECT faixa_etaria, COUNT(*) FROM conteudo GROUP BY faixa_etaria` |
| Engajamento com aprendizado ativo (quiz) | Nº de tentativas de quiz registradas (`tentativa_quiz`) | Zero até o Ciclo 9 (`docs/pdca.md`); indicador só passa a existir de fato quando visitantes começarem a jogar em produção |

### Metas de TI (o "como" técnico é sustentado)

| Meta | Indicador | Situação atual |
|---|---|---|
| Qualidade de código sustentável para 2 alunos manterem | Cobertura de teste automatizado nos services críticos de segurança | 6 suítes, 24 testes, focados em auth/quiz/dúvida/rate-limit (`docs/testes.md`) |
| Segurança de dados sensíveis | Nenhuma tabela com dado de saúde do usuário; senha sempre com hash | Verificado no schema (`RNF23`, `RNF21`) |
| Portabilidade dev → produção sem retrabalho | Zero caminho absoluto hardcoded | Verificado — garantia técnica do projeto, ver `docs/requisitos.md` — todo caminho via `.env`/`path.join` |
| Continuidade do serviço | Processo gerenciado por systemd com reinício automático em falha | `deploy/plataforma.service` (`Restart=always`, a confirmar no arquivo antes do deploy real) |

### Matriz de risco

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Sessão de admin em `MemoryStore` some a cada restart do processo em produção | Média | Baixo (só afeta admin, não visitante) | Trocar por `connect-sqlite3` (já na lista de dependências aprovadas para deploy) antes de ir a produção real |
| `POST /admin/login` sem limite de tentativas — força bruta possível | Baixa (site pequeno, sem valor de ataque óbvio) | Médio (comprometeria o único papel privilegiado) | Aplicar `express-rate-limit` (já aprovado para a fase de deploy) nessa rota especificamente |
| Conteúdo de saúde sensível publicado sem fonte oficial por erro humano no admin | Baixa | Alto (credibilidade do projeto) | Campo `fontes` obrigatório no banco (RF03) — risco já mitigado estruturalmente, não depende de disciplina do editor |
| Dúvida anônima usada para abuso/spam | Média | Baixo | Filtro de conteúdo bloqueado + rate limit por sessão (RF17 e RNF24), já implementados e testados |
| Perda de dado por rodar `npm run seed` em produção sem perceber que recria tabelas | Baixa | Alto (perda de conteúdo real) | Seed é idempotente e verifica `tabelaVazia()` antes de inserir (não sobrescreve dado existente) — mas backup antes de qualquer operação de banco em produção continua sendo prática recomendada |
| ~~Quiz sem dado de exemplo quebra a demonstração para a banca~~ | ~~Alta~~ | ~~Alto~~ | **Mitigado no Ciclo 9** (`docs/pdca.md`): `database/seed.js#seedQuizzes` popula 1 quiz de exemplo e `/quiz/1` foi testado manualmente com 200 OK |

## Conformidade — fora de escopo mantido por decisão de governança

O projeto define explicitamente, no `CLAUDE.md`, o que **não** será
implementado mesmo que pareça útil: diagnóstico/triagem clínica, chatbot ou IA
generativa, teleatendimento, app mobile nativo, integração com SUS, rede
social/comentários públicos, upload de arquivo por usuário final. Essa lista
existe para reduzir risco regulatório e de escopo — um projeto de saúde que
tentasse fazer triagem clínica ou teleatendimento sairia da categoria "conteúdo
educativo" e entraria em terreno que exigiria validação clínica/regulatória
muito além do TCC. Manter esse limite é, em si, uma decisão de governança de
risco, não só de escopo técnico.
