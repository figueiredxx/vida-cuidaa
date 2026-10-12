# Requisitos — rastreabilidade Engenharia

Este documento existe para provar, com referência a commit real, que **o que foi
combinado é o que foi programado**. Cada requisito abaixo aponta para o commit
(ou commits) da sprint em que foi implementado, o arquivo onde a regra vive hoje
e como verificar manualmente.

Convenção: `RF` = requisito funcional, `RNF` = requisito não funcional,
`RN` = regra de negócio.

**A numeração segue o Documento de Requisitos formal** (anexo `vida-cuida-requisitos-completos`
do card "Requisitos Gerais" do Trello), que vai até RF36, RNF27 e RN23. As descrições são
as da especificação; as colunas de implementação e verificação são deste repositório.

## Requisitos funcionais

### Educação

| ID | Requisito | Sprint / commit | Onde está implementado | Como verificar |
|---|---|---|---|---|
| RF01 | Listar as categorias de conteúdo educativo disponíveis | Sprint 7 (`c1cd49c`) | `categoria.controller.js#listar` → `categoria.service.js`; `views/site/categorias.ejs` | Acessar `/categorias` |
| RF02 | Filtrar artigos por faixa etária: adolescente, adulto ou todas as idades | Sprint 2 (`8bee005`) | `conteudo.repository.js#montarFiltros` (`faixa_etaria`) | `/conteudos?faixa=adolescente` |
| RF03 | Exibir o artigo completo contendo título, texto, fonte oficial e data de revisão | Sprint 2 (`8bee005`), Sprint 6 (`7f83038`) | `conteudo.controller.js#detalhe`, `conteudo.service.js#buscarDetalhe`; `schema.sql` (`fontes TEXT NOT NULL`) | `/conteudos/:slug` de um conteúdo publicado |
| RF04 | Exibir aviso de finalidade educativa e canal oficial de orientação em todas as telas de conteúdo | Sprint 6 (`54370ba`), Sprint 8 | `views/partials/footer.ejs`, incluído em todo layout: aviso de finalidade educativa e Disque Saúde 136, com link `tel:` | Rodapé de qualquer página. Ver `tests/rodape.view.test.js` |
| RF05 | Permitir busca textual por palavra-chave no acervo de artigos | Sprint 2 (`8bee005`) | `conteudo.repository.js#montarFiltros` (parâmetro `busca`, com `LIKE` em prepared statement) | `/conteudos?q=camisinha`. **O documento formal lista este requisito como não implementado; está desatualizado** |
| RF06 | Disponibilizar glossário de termos técnicos em linguagem acessível | Sprint 5 (`5cb8ddc`) | `glossario.controller.js`, `glossario.service.js` | `/glossario?letra=A` |

### Avaliação

| ID | Requisito | Sprint / commit | Onde está implementado | Como verificar |
|---|---|---|---|---|
| RF07 | Disponibilizar questionário interativo de múltipla escolha, vinculado ao conteúdo educativo | Sprint 4 (`0579afe`), Sprint 7 (`c1cd49c`) | `quiz.controller.js#player`, `quiz-player.service.js#buscarParaPlayer`; vínculo pela coluna `questao.conteudo_id` | `/quiz/:id` |
| RF08 | Registrar a alternativa selecionada e indicar acerto ou erro sem viés punitivo | Sprint 4 (`0579afe`) | `quiz-player.service.js#corrigir`, `public/js/quiz.js`. A correção é feita no servidor e a resposta certa nunca viaja antes do envio: `quiz.repository.js#buscarQuestoesParaPlayer` não seleciona a coluna `correta` | Inspecionar o payload de `/quiz/:id` no DevTools — não deve haver campo `correta`. Ver `tests/quiz-player.service.test.js` |
| RF09 | Exibir bloco com explicação detalhada imediatamente após a submissão, tanto em caso de acerto quanto de erro | Sprint 4 (`0579afe`) | `schema.sql` (`questao.explicacao`), `public/js/quiz.js` (`.quiz-explicacao`) | Responder um quiz e conferir a explicação sob cada questão |
| RF10 | Calcular e exibir a porcentagem de aproveitamento obtida no questionário | Sprint 4 (`0579afe`) | `quiz-player.service.js#corrigir` | Ver `tests/quiz-player.service.test.js` |
| RF11 | Registrar o artigo como concluído mediante a submissão do questionário | **Implementado de outra forma** | `public/js/progresso-leitura.js` marca o artigo como lido **ao abrir a página do artigo**, não ao submeter o questionário | Abrir `/conteudos/:slug` e voltar à listagem: o selo "lido" aparece sem passar pelo quiz. A divergência precisa ser resolvida — ver "Gaps conhecidos" |
| RF12 | Permitir refazer o questionário sem limite de tentativas | Sprint 4 (`0579afe`) | Não há contagem nem bloqueio de tentativa em `quiz-player.service.js`; `tentativa_quiz` grava todas | Refazer `/quiz/:id` quantas vezes quiser |
| RF13 | Exibir explicação específica por alternativa incorreta nas questões do tipo mito ou verdade | **Não implementado** | A tabela `alternativa` tem `texto` e `correta`, sem coluna de explicação. A explicação existe por questão (RF09), não por alternativa | — |

Além do previsto na especificação, a Sprint 7 (`c1cd49c`) acrescentou o vínculo entre
questão e artigo de origem: no resultado, a questão errada exibe "Reveja: &lt;artigo&gt;"
com link para o conteúdo (`questao.conteudo_id`, `quiz.repository.js#buscarGabarito`).

### Evolução

| ID | Requisito | Sprint / commit | Onde está implementado | Como verificar |
|---|---|---|---|---|
| RF14 | Exibir indicador de progresso de leitura, informando a quantidade de conteúdos lidos em relação ao total | Sprint 6/7 (`54370ba`, `c1cd49c`) | `public/js/progresso-leitura.js#atualizarBarra`, `views/site/categoria.ejs` | Ler um artigo e voltar a `/categorias/:slug` — "Você já leu X de Y conteúdos" |
| RF15 | Identificar visualmente, nas listagens, os conteúdos já lidos pelo usuário | Sprint 6/7 (`54370ba`, `c1cd49c`) | `public/js/progresso-leitura.js#marcarCardsLidos` (`.badge-lido`) | O selo "lido" aparece no card do artigo já aberto |
| RF16 | Permitir ao usuário apagar integralmente o histórico de leitura do armazenamento local | **Não implementado** | A chave `progresso-leitura-lidos` do `localStorage` é escrita e lida, mas não há controle na interface para apagá-la | — |

A trilha por categoria (Sprint 7, `c1cd49c`) apoia-se nestes dois requisitos: os artigos
publicados da categoria aparecem em ordem de leitura e o quiz só é liberado depois que
todos forem lidos (`categoria.service.js`, `public/js/trilha-categoria.js`, que reusa a
mesma chave do `localStorage`). Ver `tests/categoria.service.test.js`.

### Orientação

| ID | Requisito | Sprint / commit | Onde está implementado | Como verificar |
|---|---|---|---|---|
| RF17 | Permitir ao usuário enviar dúvidas em texto livre, de forma anônima | Sprint 5 (`5cb8ddc`) | `duvida.controller.js#enviar`, `duvida.service.js#enviarDuvida`; `schema.sql` (tabela `duvida` sem coluna de identificação). Toda dúvida passa por filtro de conteúdo impróprio (`#contemConteudoBloqueado`) | `/duvidas`. Ver RN11 e `tests/duvida.service.test.js` |
| RF18 | Disponibilizar área pública com o acervo de dúvidas respondidas e publicadas | Sprint 5 (`5cb8ddc`) | `duvida.controller.js#exibir`, `duvida.repository.js` | `/duvidas` |
| RF19 | Disponibilizar mecanismo, ao final de cada artigo, para o relato de erros de conteúdo | **Não implementado** | Não há rota, formulário nem tabela para relato de erro | — |

### Administração

| ID | Requisito | Sprint / commit | Onde está implementado | Como verificar |
|---|---|---|---|---|
| RF20 | Autenticar o acesso de administradores à área administrativa do sistema | Sprint 3 (`7fdb614`) | `auth.controller.js`, `auth.service.js`, `middlewares/auth.js`; a sessão expira em 2h (`app.js`, `cookie.maxAge`) | `/admin/login`. Ver `tests/auth.service.test.js` e `tests/auth.middleware.test.js` |
| RF21 | Permitir ao administrador moderar as dúvidas recebidas, aprovando-as ou rejeitando-as | Sprint 5 (`5cb8ddc`) | `duvida-admin.controller.js`, `duvida-admin.service.js` | `/admin/duvidas` |
| RF22 | Permitir ao administrador redigir e publicar respostas embasadas em fontes oficiais | Sprint 5 (`5cb8ddc`) | `duvida-admin.service.js` | `/admin/duvidas` → responder → publicar |
| RF23 | Permitir ao administrador cadastrar, editar, publicar e despublicar artigos e questionários | Sprint 3/4 (`7fdb614`, `0579afe`) | `admin.controller.js`, `conteudo-admin.service.js`, `quiz-admin.controller.js`, `quiz.repository.js` | `/admin/conteudos/novo` e `/admin/quizzes` |
| RF36 | Exibir painel administrativo com indicadores de conteúdo publicado e de dúvidas pendentes | Sprint 3 (`7fdb614`) | `admin.controller.js#dashboard` → `dashboard.service.js#montarContadores` (total, publicados, rascunhos e dúvidas pendentes) | `/admin`, depois do login |

### Localização

| ID | Requisito | Sprint / commit | Onde está implementado | Como verificar |
|---|---|---|---|---|
| RF24 | Solicitar autorização de acesso à geolocalização do dispositivo do usuário | Sprint 8 (`33ddde7`) | `public/js/servicos.js` (`navigator.geolocation.getCurrentPosition`), `views/site/servicos.ejs` | Abrir `/servicos` e clicar em "Usar minha localização" |
| RF25 | Calcular a distância e listar os estabelecimentos de saúde ordenados por proximidade | Sprint 8 (`d55dab2`) | `unidade-saude.service.js#calcularDistanciaKm` (Haversine) e `#buscarProximas` | `/servicos?lat=-3.1302&lon=-60.0233`. Ver `tests/unidade-saude.service.test.js` |
| RF26 | Exibir nome, endereço, bairro, telefone, tipo de unidade, turno de atendimento, indicação de atendimento pelo SUS e distância em linha reta | Sprint 8 (`33ddde7`) | `views/site/servicos.ejs`; a descrição oficial do tipo vem do endpoint `/cnes/tipounidades` | Conferir um item da lista em `/servicos` com coordenada |
| RF27 | Permitir filtrar os estabelecimentos por tipo de unidade e por atendimento pelo SUS | Sprint 8 (`33ddde7`) | `unidade-saude.repository.js#montarFiltros`, `#listarTiposDisponiveis` | `/servicos?lat=..&lon=..&tipo=5` e `&sus=nao` |
| RF28 | Permitir busca por bairro quando a autorização de geolocalização for negada ou estiver indisponível | Sprint 8 (`f564a76`) | `bairro.service.js#normalizarBairro`, `unidade-saude.service.js#listarPorBairro` e `#listarBairrosDisponiveis`, coluna `unidade_saude.bairro_normalizado`, seletor em `views/site/servicos.ejs` | `/servicos?bairro=Centro`; negar a permissão leva o foco ao seletor. Ver `tests/bairro.service.test.js` |
| RF29 | Exibir os estabelecimentos em mapa interativo, sincronizado com os filtros aplicados à listagem | Sprint 8 (`6037090`) | `public/js/mapa-servicos.js` (Leaflet + OpenStreetMap), seção do mapa em `views/site/servicos.ejs`, CSP em `app.js` | `/servicos?bairro=Centro` — um marcador por item da lista. Ver `tests/servicos.view.test.js` |
| RF30 | Permitir abrir a rota até o estabelecimento selecionado em aplicativo de mapas externo | Sprint 8 (`33ddde7`) | `views/site/servicos.ejs` (link `maps/dir/?api=1&destination=`) | Clicar em "Ver rota até…" em qualquer item |

### Acessibilidade

| ID | Requisito | Sprint / commit | Onde está implementado | Como verificar |
|---|---|---|---|---|
| RF31 | Permitir ao usuário aumentar e reduzir o tamanho do texto exibido | Sprint 1/6 (`3882f7c`, `54370ba`) | `views/partials/barra-acessibilidade.ejs`, `public/js/acessibilidade.js`, `public/js/preferencias.js` (aplica antes da pintura) | Barra de acessibilidade, três níveis de fonte; recarregar mantém a escolha |
| RF32 | Permitir ao usuário ativar e desativar o modo de alto contraste | Sprint 1/6 (`3882f7c`, `54370ba`) | Idem RF31; `public/css/acessibilidade.css` (`html.alto-contraste`) | Ativar e recarregar — deve continuar ativo |
| RF33 | Disponibilizar teclas de atalho para acesso ao conteúdo, ao menu, à busca e ao rodapé | **Não implementado** | Existe skip link para o conteúdo principal, mas nenhum `accesskey` nas views | — |
| RF34 | Disponibilizar página de mapa do sítio, com a estrutura completa de navegação | **Não implementado** | Não há rota nem view de mapa do sítio | — |
| RF35 | Disponibilizar página descritiva dos recursos de acessibilidade existentes na aplicação | **Não implementado** | Não há rota nem view de acessibilidade | — |

## Requisitos não funcionais

| ID | Requisito | Situação | Onde está garantido |
|---|---|---|---|
| RNF01 | Conclusão da tarefa principal por usuário sem treinamento prévio, já na primeira tentativa | A validar | Depende de teste com usuários, ainda não realizado |
| RNF02 | Nenhum conteúdo a mais de três acionamentos da página inicial | Atendido | O menu de `views/partials/header.ejs` leva em um clique a Conteúdos, Categorias, Dúvidas, Glossário e Serviços |
| RNF03 | Satisfação percebida avaliada positivamente por ao menos oitenta por cento dos participantes | A validar | Depende de teste com usuários, ainda não realizado |
| RNF04 | Retorno explicativo em toda questão respondida; nenhuma linguagem punitiva na interface | Atendido | `questao.explicacao` exibida em acerto e em erro (`public/js/quiz.js`); não há penalidade nem bloqueio por erro |
| RNF05 | Interface pública em WCAG 2.1 nível AA e e-MAG 3.1 | Parcial | `views/partials/*` e `public/css/acessibilidade.css`: HTML semântico, skip link, foco visível, `alt` obrigatório, `label` associado, contraste ≥ 4.5:1. **Faltam os itens de e-MAG cobertos pelos RF33 a RF35** |
| RNF06 | Indicador de foco visível e alcance por teclado em todo elemento interativo | Atendido | `public/css/acessibilidade.css` (`:focus-visible`); `/servicos` leva o foco ao resultado e ao seletor de bairro |
| RNF07 | Texto legível e layout íntegro com ampliação de até duzentos por cento | A verificar | `public/css/main.css` é mobile-first e usa unidades relativas; a ampliação a 200% ainda não foi medida |
| RNF08 | Nenhuma informação essencial transmitida exclusivamente por cor | Atendido | A unidade particular tem selo textual "Não atende pelo SUS" **e** borda tracejada (`main.css`); o balão do mapa repete o texto; o selo "lido" é texto |
| RNF09 | Páginas de conteúdo carregam em até três segundos em conexão móvel limitada | A medir | Renderização no servidor, sem framework de front-end nem bundler; não medido em rede real |
| RNF10 | Auditoria automatizada de desempenho com pontuação mínima de oitenta | A medir | Não executada |
| RNF11 | Ordenação dos estabelecimentos por distância sem latência perceptível | Atendido | `unidade-saude.service.js#buscarProximas` ordena 659 registros em memória, no servidor, a cada requisição |
| RNF12 | A indisponibilidade de serviço externo não interrompe as funcionalidades educativas | Atendido | A base do CNES é extraída fora da aplicação (`npm run extrair:cnes`) e versionada em `database/cnes-manaus.json`; o site nunca chama a API do Ministério em tempo de execução |
| RNF13 | Conteúdo educativo já visitado permanece acessível sem conexão | **Não atendido** | Não há service worker nem cache offline |
| RNF14 | Suíte de testes automatizados cobrindo as regras críticas de cálculo e de registro | Atendido | `npm test` roda **106 testes** em `tests/`, cobrindo Haversine, filtros, correção de quiz, autenticação, rate limit e a tabela de bairros. **O documento formal afirma que este requisito permanece descumprido; está desatualizado** |
| RNF15 | Toda falha de carregamento apresenta mensagem explicativa e alternativa de navegação | Atendido | `middlewares/error-handler.js`; `/servicos` explica a falha de geolocalização e oferece a busca por bairro; o mapa se esconde e avisa quando os ladrilhos não carregam |
| RNF16 | Publicação da versão em produção automatizada, com registro das execuções concluídas | Atendido | `.github/workflows/deploy-pages.yml` publica a cada push em `master`; histórico nas Actions do repositório |
| RNF17 | Sistema acessível por endereço eletrônico público, sem instalação nem cadastro | Atendido | GitHub Pages; nenhuma funcionalidade pública exige login |
| RNF18 | Arquitetura comporta o crescimento do acervo sem alteração estrutural do modelo de dados | Atendido | `database/schema.sql`: conteúdo é linha em tabela, não arquivo nem código |
| RNF19 | Camada de persistência isolada em repositórios | Atendido | Todo SQL vive em `src/repositories/*.repository.js`; nenhum controller ou service executa consulta |
| RNF20 | Base de estabelecimentos atualizável por rotina própria, sem intervenção no código | Atendido | `npm run extrair:cnes` e `npm run importar:cnes`; a aplicação não é tocada para atualizar a base |
| RNF21 | Nenhum dado que identifique o usuário final é transmitido ou armazenado | Atendido | `schema.sql`: `duvida` guarda apenas `pergunta`, `status`, `publicada` e `criado_em`; `tentativa_quiz` grava usuário nulo nas sessões públicas; não há log de IP |
| RNF22 | Comunicação entre cliente e servidor sobre protocolo criptografado | Parcial | O GitHub Pages serve em HTTPS; na VPS, o HTTPS via Let's Encrypt está previsto na fase de deploy e ainda não foi executado |
| RNF23 | Senhas de acesso administrativo armazenadas por função de resumo criptográfico | Atendido | `auth.service.js` (`bcrypt.compare`) e `database/seed.js` (`bcrypt.hash(..., 10)`); nunca em texto plano, nem no seed |
| RNF24 | Envio de dúvidas limitado por sessão, prevenindo uso abusivo do canal | Atendido | `rate-limit.middleware.js#limitarPorSessao`, aplicado em `POST /duvidas`. Ver `tests/rate-limit.middleware.test.js` |
| RNF25 | Todo conteúdo submetido pelo usuário é sanitizado antes de ser armazenado ou exibido | Atendido | `conteudo-admin.service.js` (`sanitizeHtml`, `OPCOES_SANITIZACAO`); a saída no EJS usa sempre `<%= %>`, e `<%- %>` apenas em `corpo_html` já sanitizado |
| RNF26 | Acervo de conteúdo educativo mantido desvinculado do código-fonte | Atendido | O conteúdo vive no banco e é editável pelo painel; `database/seed.js` apenas semeia exemplos |
| RNF27 | Separação em camadas entre rotas, controladores, serviços e repositórios | Atendido | `src/routes` → `src/controllers` → `src/services` → `src/repositories`, sem atalho entre camadas |

## Regras de negócio do módulo de localização

Esta seção cobre apenas RN19 a RN23. As regras RN01 a RN18 constam do documento formal
e ainda não foram rastreadas aqui — ver "Gaps conhecidos".

| ID | Regra | Onde está garantido |
|---|---|---|
| RN19 | Estabelecimentos obtidos do CNES, restritos aos ativos e com coordenada geográfica válida | `scripts/extrair-cnes.js#ehUtil` (descarta sem latitude/longitude; a consulta já pede `status=1`) |
| RN20 | Estabelecimentos que não realizam atendimento pelo SUS são exibidos com identificação visual distinta | `views/site/servicos.ejs` (selo "Não atende pelo SUS") e `main.css` (`.servicos-lista__item--particular`, borda tracejada — a distinção não depende só de cor) |
| RN21 | Toda distância apresentada é identificada como medida em linha reta, e não como distância de percurso | `views/site/servicos.ejs`: o texto "em linha reta" acompanha cada distância, além da nota no topo da lista |
| RN22 | A base de estabelecimentos registra a data de sua extração, exibida ao usuário | `extracao_cnes` no `schema.sql`; `extrair-cnes.js` grava `extraido_em` no JSON, `importar-cnes.js` registra e o rodapé de `/servicos` exibe |
| RN23 | O sistema não informa disponibilidade de medicamentos ou insumos por estabelecimento | Não há campo de medicamento ou insumo em `unidade_saude` nem na página |

## Garantias técnicas do projeto

Compromissos assumidos no `CLAUDE.md` que não constam da especificação formal, mas
sustentam vários dos requisitos acima e valem registro próprio.

| Garantia | Onde está garantido |
|---|---|
| Stack fixa: Node + Express + EJS + SQLite, sem framework de front-end e sem bundler | `package.json` (dependências fechadas), `CLAUDE.md` |
| 100% das queries com prepared statements — nunca concatenação de string | Todos os `*.repository.js` usam `db.prepare(...)` com `?` |
| Cabeçalhos de segurança HTTP ativos, com CSP sem `unsafe-inline` | `app.js` (`helmet`); `public/js/preferencias.js` existe justamente para o script de preferências não precisar ser inline |
| Cookie de sessão `secure: true` em produção e `false` em desenvolvimento, controlado por `NODE_ENV` | `app.js` |
| `trust proxy` habilitado em produção, para funcionar atrás do Nginx | `app.js` |
| Nenhum caminho absoluto fixo no código — tudo via `.env` ou `path.join(__dirname, ...)` | `src/config/database.js`, `app.js`, `scripts/build-estatico.js` |
| Layout mobile-first, funcional de 320px a 1920px | `src/public/css/main.css` |
| `.env` nunca versionado | `.gitignore`; confirmado por `git rev-list --all --objects` — só `.env.example` está rastreado |
| Nenhum script de terceiro executa na plataforma | Leaflet servido de `src/public/vendor`; o CSP mantém `script-src 'self'` |

### Nota sobre o mapa (RF29)

O requisito pede o mapa **sincronizado com os filtros aplicados à listagem**. Em vez de
consultar o banco uma segunda vez para o mapa, cada item da lista carrega a própria
coordenada em atributos `data-*`, e o `mapa-servicos.js` monta os marcadores a partir
desses itens. Não existe segunda consulta, segundo filtro nem segunda ordenação: mapa e
lista são o mesmo resultado desenhado de dois jeitos, e não há como divergirem.

O Leaflet é servido pelo próprio site (`src/public/vendor/leaflet`, versão 1.9.4), e não
por CDN. O motivo é o `Content-Security-Policy` do helmet, que traz `script-src 'self'`:
aceitar script de CDN exigiria abrir essa diretiva para um domínio de terceiro. Servindo
local, a única abertura necessária é `img-src` para `https://*.tile.openstreetmap.org`,
de onde vêm os ladrilhos.

O mapa é melhoria progressiva: se o Leaflet não carregar, ou se os ladrilhos falharem
(testado com o domínio do OpenStreetMap bloqueado), o mapa se esconde, um aviso em
`role="status"` explica o que houve e a listagem permanece completa.

A atribuição ao OpenStreetMap aparece duas vezes de propósito: no controle do Leaflet,
exigido pela licença ODbL, e em parágrafo estático no HTML, que sobrevive à falha do
mapa. Um teste garante que a menção não seja removida por descuido.

### Nota sobre o nome do bairro (RF28)

O CNES não devolve o bairro em forma utilizável: os 659 estabelecimentos de Manaus
chegam com **95 grafias distintas** para cerca de 63 bairros, somando truncamento em
20 caracteres (`NOSSA SENHORA DAS GR`), erro de digitação (`ADRIANNOPOLIS`, `CHPADA`),
abreviação (`N SRA DAS GRACAS`) e subdivisão informal (`COMPENSA I/II/III`).

A correção fica em `src/services/bairro.service.js`, cobrindo os 95 valores. O valor
cru permanece na coluna `unidade_saude.bairro` e o corrigido em `bairro_normalizado`,
de modo que a origem do dado continue auditável. Um teste percorre
`database/cnes-manaus.json` e falha se uma reextração trouxer valor fora da tabela —
a falha aparece no `npm test`, não na tela do usuário.

Quatro valores usados pelo CNES não constam da divisão oficial de bairros de Manaus
(`Km 08`, `Nossa Senhora de Fátima`, `Ponta Pelada` e `Zona Rural`). Estão marcados no
código e mantidos apenas com a grafia corrigida: descartá-los esconderia unidades que
atendem gente de verdade.

## Fora de escopo (confirmado como não implementado, por decisão de projeto)

Diagnóstico ou triagem clínica, chatbot ou IA generativa, teleatendimento, app mobile
nativo, rede social ou comentários públicos, upload de arquivo por usuário final —
nenhum desses itens existe no código, por decisão registrada no `CLAUDE.md`.

Sobre o SUS: não há agendamento, prontuário, cartão SUS nem troca de dado de paciente.
A consulta à base pública de dados abertos do Ministério da Saúde (CNES) está no escopo
e é o que sustenta os RF24 a RF30.

## Gaps conhecidos (a decidir com a banca/orientadora)

- **Requisitos funcionais ainda não implementados:** RF13 (explicação por alternativa),
  RF16 (apagar o histórico de leitura), RF19 (relato de erro em conteúdo) e RF33 a RF35
  (teclas de atalho, mapa do sítio e página de acessibilidade, exigidos pelo e-MAG).
- **RF11 diverge do código:** o requisito diz que o artigo é concluído ao submeter o
  questionário; o sistema o marca como lido ao abrir o artigo. Ou o código muda, ou o
  requisito muda, mas os dois não podem continuar como estão.
- **As regras RN01 a RN18 ainda não foram rastreadas** neste documento. Só o módulo de
  localização (RN19 a RN23) tem a coluna de evidência preenchida.
- **O documento formal está desatualizado em dois pontos**, ambos nas "Notas de revisão"
  que ele mesmo manda apagar antes da entrega: afirma que o RF05 (busca textual) não está
  implementado e que o RNF14 (suíte de testes) permanece descumprido. Os dois estão
  atendidos — `/conteudos?q=` funciona e `npm test` roda 106 testes.
- Sessão de admin usa `MemoryStore` do Express, que não sobrevive a restart do processo
  em produção. A fase de deploy prevê `connect-sqlite3` — ainda não integrado.
- Rate limit hoje é só por sessão (`rate-limit.middleware.js`), aplicado apenas em
  `POST /duvidas`. `POST /admin/login` não tem proteção contra força bruta. A fase de
  deploy prevê `express-rate-limit` — ainda não integrado.
