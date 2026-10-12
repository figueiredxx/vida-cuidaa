# BPMN — Fluxo do administrador/editor

Raias: **Admin/Editor** e **Sistema (servidor)**.

```mermaid
flowchart TD
    Inicio([Início: admin acessa /admin]) --> TemSessao{Sessão de login válida?}
    TemSessao -->|Não| Login[Abrir /admin/login e enviar credenciais]
    Login --> Autentica{E-mail e senha<br/>conferem via bcrypt?}
    Autentica -->|Não| ErroLogin[Exibir erro de credenciais inválidas]
    ErroLogin --> Login
    Autentica -->|Sim| CriaSessao[Criar sessão com papel do usuário]
    CriaSessao --> Dashboard

    TemSessao -->|Sim| Dashboard[Abrir dashboard com contadores]
    Dashboard --> Papel{Papel tem permissão<br/>para a rota pedida?}
    Papel -->|Não, papel fora da lista| Negado[Responder 403 - acesso negado]
    Negado --> FimNegado([Fim: acesso bloqueado])

    Papel -->|Sim| Escolha{O que o admin/editor<br/>quer fazer?}

    Escolha -->|Gerenciar conteúdo| FormConteudo[Abrir formulário de conteúdo]
    FormConteudo --> ValidaConteudo{Fontes, título, resumo<br/>e faixa etária válidos?}
    ValidaConteudo -->|Não| ErroConteudo[Exibir erros de validação]
    ErroConteudo --> FormConteudo
    ValidaConteudo -->|Sim| Sanitiza[[Sanitizar corpo HTML no servidor<br/>sanitize-html]]
    Sanitiza --> SalvaConteudo[Gravar conteúdo com slug único]
    SalvaConteudo --> PublicaConteudo{Publicar agora?}
    PublicaConteudo -->|Sim| Publicado[Conteúdo visível em /conteudos]
    PublicaConteudo -->|Não| Rascunho[Conteúdo salvo como rascunho]
    Publicado --> FimConteudo([Fim: conteúdo publicado])
    Rascunho --> FimConteudo

    Escolha -->|Gerenciar quiz| FormQuiz[Criar/editar quiz]
    FormQuiz --> Questoes[Cadastrar questões e alternativas<br/>marcando a alternativa correta]
    Questoes --> FimQuiz([Fim: quiz pronto para jogar])

    Escolha -->|Moderar dúvidas| ListaDuvidas[Abrir /admin/duvidas]
    ListaDuvidas --> DecideDuvida{Decisão sobre a dúvida pendente}
    DecideDuvida -->|Responder| Responde[Gravar resposta em resposta_duvida]
    Responde --> PublicaFaq{Publicar no FAQ público?}
    PublicaFaq -->|Sim| FaqPublico[Dúvida aparece em /duvidas]
    PublicaFaq -->|Não| FaqOculto[Resposta salva, FAQ não exibe]
    FaqPublico --> FimDuvida([Fim: dúvida respondida e publicada])
    FaqOculto --> FimDuvida
    DecideDuvida -->|Rejeitar| Rejeita[Marcar status rejeitada]
    Rejeita --> FimRejeitada([Fim: dúvida rejeitada, não aparece no FAQ])

    Escolha -->|Sair| Logout[POST /admin/logout]
    Logout --> FimLogout([Fim: sessão encerrada])
```

## Notas do fluxo

- O gateway **"Papel tem permissão para a rota pedida?"** corresponde a
  `auth.middleware.js#requireRole` (RF20 e RF23) — coberto por
  `tests/auth.middleware.test.js`.
- O sub-processo **"Sanitizar corpo HTML no servidor"** corresponde a
  `conteudo-admin.service.js` com `sanitize-html` (RNF25) — coberto por
  `tests/conteudo-admin.service.test.js`.
- O caminho de moderação de dúvida (**responder → publicar/ocultar** ou
  **rejeitar**) nunca expõe nenhum dado de quem perguntou ao admin — a tabela
  `duvida` não guarda essa informação (RNF21 e RN11), então não há atividade possível
  nesse fluxo que vaze identidade do visitante.
