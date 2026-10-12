# Plataforma Web Educativa — Saúde Sexual e Reprodutiva e Planejamento Familiar

TCC de Sistemas de Informação (CEUNI FAMETRO). Plataforma web educativa com conteúdo
curado de fontes oficiais, quiz interativo, canal de dúvidas anônimas e painel admin.

## Funcionalidades

- Catálogo de conteúdo educativo com filtros por categoria/faixa etária e busca textual
- Quiz interativo com correção feita inteiramente no servidor
- Canal de dúvidas 100% anônimo, com moderação e FAQ pública
- Glossário com busca alfabética
- Painel administrativo com autenticação e CRUD de conteúdo/quizzes
- Acessibilidade WCAG 2.1 AA (barra de alto contraste e tamanho de fonte, navegação por teclado)

## Instalação local

1. `npm install`
2. Copie `.env.example` para `.env` e ajuste os valores (principalmente `ADMIN_EMAIL` e `ADMIN_PASSWORD`)
3. `npm run seed` (cria o schema e popula categorias, conteúdos, glossário e o usuário admin)
4. `npm start` (ou `npm run dev` para reiniciar automaticamente a cada alteração)

O servidor sobe em `http://localhost:3000` por padrão (porta configurável em `PORT`).

## Deploy em VPS (Ubuntu)

Pré-requisitos: um VPS Ubuntu com acesso root/sudo e um domínio apontando para o IP do servidor.

1. **Instalar o Node.js LTS** (via NodeSource ou nvm) e o Nginx:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt install -y nodejs nginx
   ```

2. **Enviar o código pro servidor** (ex.: `git clone` ou `rsync`) em `/var/www/plataforma` e instalar as dependências de produção:
   ```bash
   cd /var/www/plataforma
   npm install --omit=dev
   ```

3. **Criar o `.env` de produção** em `/var/www/plataforma/.env` com `NODE_ENV=production`, `SESSION_SECRET` forte e único, `DB_PATH` apontando pra um caminho persistente, e as credenciais do admin. Rodar o seed uma única vez:
   ```bash
   npm run seed
   ```

4. **Registrar o serviço com systemd** — copie `deploy/plataforma.service` para `/etc/systemd/system/plataforma.service`, ajustando `WorkingDirectory` e `User` se necessário, depois:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now plataforma
   sudo systemctl status plataforma
   ```

5. **Configurar o Nginx como proxy reverso** — copie `deploy/nginx.conf` para `/etc/nginx/sites-available/plataforma`, ajuste `server_name` pro seu domínio, e ative:
   ```bash
   sudo ln -s /etc/nginx/sites-available/plataforma /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

6. **Emitir o certificado HTTPS com Let's Encrypt**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d seu-dominio.com.br
   ```

Com `NODE_ENV=production`, a aplicação automaticamente ativa `trust proxy` e marca o cookie
de sessão como `secure` — por isso o HTTPS via Nginx/Let's Encrypt precisa estar na frente
antes de ativar produção, senão o cookie de sessão não é enviado pelo navegador.

## Unidades de saúde (CNES)

A página `/servicos` lista unidades de saúde de Manaus ordenadas pela distância até
quem acessa, com filtro por bairro, por tipo de unidade e por atendimento pelo SUS.
Quem não quiser (ou não puder) compartilhar a localização escolhe o bairro na lista. Os dados vêm
da API de dados abertos do Ministério da Saúde (CNES). A coleta **não acontece em
tempo de execução**: o site lê a tabela `unidade_saude` do próprio banco, para não
depender de a API externa estar no ar durante a apresentação.

```bash
npm run extrair:cnes    # consulta a API e grava database/cnes-manaus.json
npm run migrar          # cria a tabela unidade_saude em bancos já existentes
npm run importar:cnes   # carrega o JSON na tabela
```

Quem clonar o repositório roda só os dois últimos: o JSON já está versionado.
A extração só precisa ser repetida quando se quiser atualizar os dados.

Detalhes da API, levantados na marra porque a documentação é escassa:

- Base: `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos` (sem prefixo de versão)
- Manaus é o código IBGE `130260`
- `limit` tem teto de 20 — paginar por `offset` é obrigatório (~87 requisições)
- Dos 1.735 estabelecimentos ativos, 659 são de tipos que atendem ao público e
  todos têm coordenada; 284 atendem pelo SUS
- A listagem traz só o **código** do tipo de unidade; a descrição oficial vem do
  endpoint `/cnes/tipounidades`
- A distância é calculada por Haversine, **em linha reta** — não é distância de
  percurso, e a página diz isso em cada item (RN21)
- O campo de bairro vem **truncado em 20 caracteres** (`NOSSA SENHORA DAS GR`) e ainda
  traz erro de digitação, abreviação e subdivisão informal: 95 grafias para cerca de
  63 bairros. A correção fica em `src/services/bairro.service.js`, e um teste quebra
  se uma reextração trouxer valor fora da tabela

## Quadro do Trello

Ferramenta de apoio da dupla para consultar e atualizar o quadro de tarefas do TCC
pela linha de comando. **Não faz parte da aplicação** e não é usada em produção —
o site funciona sem isso.

### Obter as credenciais (uma vez)

1. Acesse <https://trello.com/power-ups/admin> e clique em **New** / **Novo** para
   criar um Power-Up. Preencha nome (ex.: `TCC CLI`), área de trabalho, e-mail e
   autor. A **URL de conector Iframe é obrigatória** para o botão Criar liberar —
   use `https://example.com/`, já que o Power-Up nunca será instalado em um quadro
   (ele existe só para emitir a API key).
2. Aberto o Power-Up, no menu da esquerda vá em **Autorização → Autenticação do
   Trello** (*Trello authentication*, na interface em inglês). **Não** use a tela
   de OAuth 2.0: é outro fluxo, que pede URL de retorno e não serve aqui.
3. Gere a API key e copie. Ao lado dela há o link **Token**: clique, confirme em
   **Allow** / **Permitir** e copie o token gerado.
4. No `.env` do projeto, preencha:

   ```
   TRELLO_API_KEY=sua-api-key
   TRELLO_TOKEN=seu-token
   ```

O `.env` está no `.gitignore` e nunca vai para o repositório. A API key identifica
o Power-Up; o token dá acesso à sua conta — trate os dois como senha.

### Comandos

```bash
node scripts/trello.js quadros                       # lista os quadros e seus IDs
node scripts/trello.js colunas <quadroId>            # lista as colunas e seus IDs
node scripts/trello.js cards <quadroId>              # lista os cards agrupados por coluna
node scripts/trello.js criar <colunaId> "Título" "Descrição opcional"
node scripts/trello.js mover <cardId> <colunaId>
node scripts/trello.js comentar <cardId> "Texto do comentário"
node scripts/trello.js arquivar <cardId>
```

Comece por `quadros` para descobrir o ID do quadro do TCC; com ele, `cards` mostra
o quadro inteiro e os IDs necessários para os demais comandos.

## Estrutura

```
src/
  app.js
  config/database.js
  routes/{site,admin,api}.routes.js
  controllers/
  services/
  repositories/
  middlewares/{auth,error-handler,rate-limit}.js
  views/{partials,site,admin}/
  public/{css,js,img}/
database/{schema.sql,seed.js,migrar.js,importar-cnes.js,cnes-manaus.json,database.sqlite}
deploy/{plataforma.service,nginx.conf}
docs/
  der.md                      -- diagrama entidade-relacionamento (Mermaid)
  requisitos.md               -- rastreabilidade RF/RNF -> commit -> arquivo
  testes.md                   -- estrategia de testes
  governanca.md
  pdca.md
  roteiro-demonstracao.md
  bpmn/{fluxo-visitante,fluxo-admin}.md
```

Ver `CLAUDE.md` para stack, convenções e regras do projeto.
