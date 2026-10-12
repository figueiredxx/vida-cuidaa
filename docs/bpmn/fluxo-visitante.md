# BPMN — Fluxo do visitante (anônimo)

Notação: evento de início/fim em círculo, atividade em retângulo, decisão em
losango — equivalente às formas BPMN padrão (Start Event, Task, Gateway),
desenhado em Mermaid para renderizar direto no GitHub sem ferramenta externa.

Raias (swimlanes): **Visitante** e **Sistema (servidor)**.

```mermaid
flowchart TD
    Inicio([Início: visitante acessa o site]) --> Home[Abrir página inicial]
    Home --> Escolha{O que o visitante quer fazer?}

    Escolha -->|Ler conteúdo| Catalogo[Abrir /conteudos com filtros<br/>categoria, faixa etária, busca]
    Catalogo --> Detalhe[Abrir detalhe do conteúdo]
    Detalhe --> FimLeitura([Fim: conteúdo lido])

    Escolha -->|Fazer quiz| AbrirQuiz[Abrir /quiz/:id]
    AbrirQuiz --> Responder[Responder todas as questões]
    Responder --> EnviarRespostas[Enviar respostas via POST /api/quiz/:id/responder]
    EnviarRespostas --> Corrigir[[Servidor corrige no backend<br/>gabarito nunca sai do servidor]]
    Corrigir --> Resultado[Exibir acertos, total e explicação]
    Resultado --> FimQuiz([Fim: resultado exibido])

    Escolha -->|Enviar dúvida| AbrirDuvidas[Abrir /duvidas]
    AbrirDuvidas --> Escrever[Escrever pergunta<br/>sem nome, sem e-mail]
    Escrever --> EnviarDuvida[POST /duvidas]
    EnviarDuvida --> LimiteOk{Dentro do limite<br/>de tentativas da sessão?}
    LimiteOk -->|Não| Bloqueado[Exibir aviso: tente novamente mais tarde]
    Bloqueado --> FimBloqueado([Fim: envio bloqueado])
    LimiteOk -->|Sim| FiltroOk{Passa no filtro de<br/>conteúdo impróprio?}
    FiltroOk -->|Não| Rejeitada[Exibir erro de validação]
    Rejeitada --> FimRejeitada([Fim: dúvida rejeitada])
    FiltroOk -->|Sim| Gravada[Gravar dúvida com status pendente]
    Gravada --> FimEnviada([Fim: dúvida aguardando moderação])

    Escolha -->|Consultar termo| Glossario[Abrir /glossario e filtrar por letra]
    Glossario --> FimGlossario([Fim: termo consultado])
```

## Notas do fluxo

- O gateway **"Passa no filtro de conteúdo impróprio?"** corresponde a
  `duvida.service.js#contemConteudoBloqueado` (RF17) — coberto por
  `tests/duvida.service.test.js`.
- O gateway **"Dentro do limite de tentativas da sessão?"** corresponde a
  `rate-limit.middleware.js#limitarPorSessao` (RNF24) — coberto por
  `tests/rate-limit.middleware.test.js`.
- A atividade **"Servidor corrige no backend"** é destacada como sub-processo
  porque é o ponto de maior sensibilidade de segurança do fluxo público: o
  gabarito (`alternativa.correta`) nunca trafega para o navegador antes do
  envio da resposta (RF08) — coberto por `tests/quiz-player.service.test.js`.
- Em nenhum ponto deste fluxo o visitante se identifica — não há tela de login
  nem campo de nome/e-mail em qualquer atividade da raia "Visitante".
