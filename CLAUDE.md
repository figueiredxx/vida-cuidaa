# Plataforma Web Educativa — Saúde Sexual e Reprodutiva e Planejamento Familiar

TCC de Sistemas de Informação (CEUNI FAMETRO). Plataforma web educativa com conteúdo
curado de fontes oficiais, quiz interativo, canal de dúvidas anônimas e painel admin.

## Stack — NÃO ALTERAR

- Frontend: HTML5, CSS3 e JavaScript vanilla (ES6+). SEM React, Vue, Tailwind, TypeScript ou bundler.
- Backend: Node.js + Express + EJS (renderização no servidor).
- Banco: SQLite3 via `better-sqlite3`.
- Dependências permitidas: express, ejs, better-sqlite3, bcrypt, express-session,
  dotenv, helmet, express-validator, sanitize-html. Na fase de deploy entram também
  connect-sqlite3 e express-rate-limit. Qualquer outra exige aprovação antes.

## Motivo da stack

É um TCC. O código precisa ser legível e explicável em banca por dois alunos.
Prefira sempre a solução mais simples e explícita à mais elegante ou "moderna".
Nada de abstração prematura.

## Arquitetura em camadas

routes → controllers → services → repositories → SQLite

- `routes/` só declara rotas e middlewares.
- `controllers/` lê req, chama service, devolve res. Sem SQL, sem regra de negócio.
- `services/` concentra a regra de negócio.
- `repositories/` é o único lugar com SQL.
- `views/` contém EJS. Nada de lógica de negócio no template.

## Estrutura de pastas

```
src/
  app.js
  config/database.js
  routes/{site,admin,api}.routes.js
  controllers/
  services/
  repositories/
  middlewares/{auth,errorHandler}.js
  views/{partials,site,admin}/
  public/{css,js,img}/
database/{schema.sql,seed.js,migrar.js,importar-cnes.js,cnes-manaus.json,database.sqlite}
```

## Ambientes

- **Desenvolvimento:** local, na máquina dos alunos. `npm run dev`, banco em `database/database.sqlite`.
- **Produção:** VPS Linux (Ubuntu), Node LTS, processo gerenciado por systemd, Nginx
  como proxy reverso na frente, HTTPS via Let's Encrypt.
- Nada de caminho absoluto hardcoded. Todo caminho sai de `process.env` ou de
  `path.join(__dirname, ...)`, para o mesmo código rodar nos dois ambientes.
- Porta, secret de sessão, caminho do banco e `NODE_ENV` sempre via `.env`.
  O `.env` nunca vai para o Git.
- Em produção, `app.set('trust proxy', 1)` e cookie de sessão com `secure: true`.
  Em desenvolvimento, `secure: false`. Controlar pela `NODE_ENV`.

## Convenções

- Todo o código, comentários, nomes de variáveis, tabelas e mensagens em **português**.
- Nomes de arquivo em kebab-case; funções em camelCase; tabelas no singular.
- 100% das queries com prepared statements (`?`). Nunca concatenar SQL.
- Senhas sempre com bcrypt, custo 10. Nunca em texto plano, nem em seed.
- Escapar toda saída no EJS com `<%= %>`. Usar `<%- %>` apenas em `corpo_html` já sanitizado.
- Comentários curtos explicando o *porquê*, não o *o quê*.

## Acessibilidade — requisito de nota, não opcional

Meta: WCAG 2.1 nível AA.

- HTML semântico (`header`, `nav`, `main`, `article`, `footer`), um `h1` por página.
- Skip link, foco visível, navegação completa por teclado.
- `alt` obrigatório em toda imagem; `label` associado a todo input.
- Contraste mínimo 4.5:1.
- Controles de tamanho de fonte (3 níveis) e alto contraste, persistidos em `localStorage`.
- Layout mobile-first, funcional de 320px a 1920px.

## Regras de conteúdo (tema sensível de saúde)

- Toda página exibe o rodapé: "Este conteúdo é educativo e não substitui consulta
  com profissional de saúde."
- Todo conteúdo tem campo `fontes` obrigatório (Ministério da Saúde, OMS/OPAS, FEBRASGO).
- O canal de dúvidas é anônimo: não gravar IP, e-mail, nome ou vínculo com usuário.
- Nenhuma tabela armazena dado de saúde do usuário.

## Fora de escopo — não implementar, mesmo que pareça útil

Diagnóstico ou triagem clínica, chatbot ou IA generativa, teleatendimento,
app mobile nativo, rede social ou comentários públicos livres,
upload de arquivos por usuário final.

Sobre integração com o SUS: nada de agendamento, prontuário, cartão SUS ou
qualquer troca de dado de paciente. Consultar **base pública de dados abertos**
do Ministério da Saúde é permitido e está no escopo — é o caso do CNES, usado
para listar unidades de saúde de Manaus (RF24 a RF30 do Documento de Requisitos). A
extração roda fora da aplicação (`npm run extrair:cnes`) e o resultado fica
versionado em `database/cnes-manaus.json`, para o site nunca depender da API
externa estar no ar.

## Como trabalhar

- Antes de codar uma tarefa nova, apresentar o plano em tópicos e esperar confirmação.
- Uma sprint por vez. Não adiantar trabalho de sprints futuras.
- Ao terminar, informar como testar (comando + URL + o que deve aparecer na tela).
- Se um requisito estiver ambíguo, perguntar em vez de assumir.
