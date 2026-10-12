# DER — Diagrama Entidade-Relacionamento

Modelo lógico do banco, espelhando `database/schema.sql`. Desenhado em Mermaid
(`erDiagram`) para renderizar direto no GitHub, sem ferramenta externa — mesma
decisão dos diagramas BPMN em `docs/bpmn/`.

Notação de cardinalidade do Mermaid:

| Símbolo | Significado |
|---|---|
| `\|\|` | exatamente um |
| `\|o` | zero ou um |
| `o{` | zero ou muitos |

O banco tem **doze tabelas**. Todas as chaves primárias são `INTEGER PRIMARY KEY
AUTOINCREMENT` (o `rowid` do SQLite).

```mermaid
erDiagram
    CATEGORIA ||--o{ CONTEUDO : classifica
    CATEGORIA |o--o{ QUIZ : "pode ter"
    CONTEUDO |o--o{ QUESTAO : origina
    QUIZ ||--o{ QUESTAO : contem
    QUESTAO ||--o{ ALTERNATIVA : oferece
    QUIZ ||--o{ TENTATIVA_QUIZ : registra
    USUARIO |o--o{ TENTATIVA_QUIZ : "pode ter feito"
    DUVIDA ||--o| RESPOSTA_DUVIDA : recebe
    USUARIO ||--o{ RESPOSTA_DUVIDA : escreve

    USUARIO {
        INTEGER id PK
        TEXT nome
        TEXT email UK
        TEXT senha_hash "bcrypt custo 10"
        TEXT papel "admin ou editor"
        TEXT criado_em
    }

    CATEGORIA {
        INTEGER id PK
        TEXT nome UK
        TEXT slug UK
        TEXT descricao
    }

    CONTEUDO {
        INTEGER id PK
        INTEGER categoria_id FK "obrigatorio"
        TEXT titulo
        TEXT slug UK
        TEXT resumo
        TEXT corpo_html "sanitizado antes de gravar"
        TEXT fontes "obrigatorio - RF03"
        TEXT faixa_etaria "adolescente, adulto ou todas"
        INTEGER publicado "0 ou 1"
        INTEGER visualizacoes
        TEXT criado_em
        TEXT atualizado_em
    }

    QUIZ {
        INTEGER id PK
        INTEGER categoria_id FK "anulavel - quiz geral nao tem categoria"
        TEXT titulo
        TEXT descricao
    }

    QUESTAO {
        INTEGER id PK
        INTEGER quiz_id FK "ON DELETE CASCADE"
        INTEGER conteudo_id FK "anulavel - artigo de origem da pergunta"
        TEXT enunciado
        TEXT explicacao "exibida no acerto e no erro"
        INTEGER ordem
    }

    ALTERNATIVA {
        INTEGER id PK
        INTEGER questao_id FK "ON DELETE CASCADE"
        TEXT texto
        INTEGER correta "0 ou 1 - nunca enviado ao navegador"
    }

    TENTATIVA_QUIZ {
        INTEGER id PK
        INTEGER quiz_id FK
        INTEGER usuario_id FK "anulavel - visitante anonimo"
        INTEGER pontuacao
        INTEGER total
        TEXT criado_em
    }

    DUVIDA {
        INTEGER id PK
        TEXT pergunta
        TEXT status "pendente, respondida ou rejeitada"
        INTEGER publicada "0 ou 1"
        TEXT criado_em
    }

    RESPOSTA_DUVIDA {
        INTEGER id PK
        INTEGER duvida_id FK "UNIQUE - no maximo uma resposta por duvida"
        INTEGER usuario_id FK "quem respondeu, do lado do admin"
        TEXT resposta
        TEXT criado_em
    }

    GLOSSARIO {
        INTEGER id PK
        TEXT termo UK
        TEXT definicao
    }

    UNIDADE_SAUDE {
        INTEGER id PK
        TEXT codigo_cnes UK "codigo do estabelecimento no CNES"
        TEXT nome
        TEXT logradouro
        TEXT numero
        TEXT bairro "valor cru do CNES, preservado para auditoria"
        TEXT bairro_normalizado "nome corrigido, usado na busca e na exibicao"
        TEXT telefone
        REAL latitude
        REAL longitude
        INTEGER tipo_unidade "codigo do tipo no CNES"
        TEXT tipo_descricao "descricao oficial do tipo, de /cnes/tipounidades"
        INTEGER atende_sus "0 ou 1"
        TEXT turno_atendimento
    }

    EXTRACAO_CNES {
        INTEGER id PK
        TEXT data_extracao "RN22 - exibida ao usuario em /servicos"
    }
```

## Relacionamentos e por que cada um é assim

| Relacionamento | Cardinalidade | Justificativa |
|---|---|---|
| `categoria` → `conteudo` | 1 : N | `conteudo.categoria_id` é `NOT NULL`: todo artigo pertence a exatamente uma categoria, o que sustenta a trilha por categoria (RF01 e RF14). |
| `categoria` → `quiz` | 0..1 : N | `quiz.categoria_id` é **anulável** por causa do quiz geral, que atravessa temas e não pertence a nenhuma categoria. |
| `conteudo` → `questao` | 0..1 : N | `questao.conteudo_id` é **anulável**: a pergunta pode citar o artigo de origem (e aí o resultado mostra "Reveja: …" — recurso da Sprint 7, sem RF próprio na especificação) ou ser uma pergunta geral da categoria. |
| `quiz` → `questao` | 1 : N | `ON DELETE CASCADE` — apagar um quiz apaga suas questões, que não fazem sentido sozinhas. |
| `questao` → `alternativa` | 1 : N | `ON DELETE CASCADE`, pelo mesmo motivo. A coluna `correta` vive só aqui e nunca é enviada ao navegador antes da resposta (RF08). |
| `quiz` → `tentativa_quiz` | 1 : N | Cada tentativa registra pontuação e total de um quiz. |
| `usuario` → `tentativa_quiz` | 0..1 : N | `usuario_id` é **anulável**: o site é usado sem login, então a maioria das tentativas é anônima. |
| `duvida` → `resposta_duvida` | 1 : 0..1 | `duvida_id` é `UNIQUE`: uma dúvida recebe no máximo uma resposta oficial. `ON DELETE CASCADE`. |
| `usuario` → `resposta_duvida` | 1 : N | Identifica **quem respondeu** (admin ou editor) — nunca quem perguntou. |

## Três ausências propositais de relacionamento

Estas não são esquecimento de modelagem; são requisitos:

- **`duvida` não tem nenhuma FK para `usuario`, nem coluna de IP, e-mail ou nome.**
  O canal de dúvidas é anônimo por projeto (RNF21 e RN11). O vínculo com `usuario` existe
  apenas do lado da resposta, para saber qual administrador respondeu.
- **`glossario` é uma tabela isolada, sem relacionamento.** É um verbete independente,
  sem ligação com categoria ou conteúdo — simplicidade deliberada.
- **`extracao_cnes` guarda uma linha só, sem relacionamento.** Registra a data da
  extração da base (RN22). Não se liga a `unidade_saude` porque a base é substituída
  inteira a cada importação: a data vale para a carga toda, não para cada unidade.
- **`unidade_saude` também é isolada.** É um espelho local de uma base pública externa
  (o CNES, do Ministério da Saúde), recarregado inteiro a cada importação
  (`npm run importar:cnes`). Ligá-la a `categoria` ou `conteudo` criaria uma dependência
  entre dado nosso e dado de terceiro que a recarga quebraria. `codigo_cnes` é `UNIQUE`
  para a importação ser idempotente.
- **`bairro` e `bairro_normalizado` convivem de propósito.** O CNES trunca o nome do
  bairro em 20 caracteres e traz erro de digitação, abreviação e subdivisão informal —
  95 grafias para cerca de 63 bairros. A busca e a tela usam `bairro_normalizado`,
  corrigido na importação pela tabela de `src/services/bairro.service.js`; o valor cru
  fica em `bairro` para a origem do dado continuar verificável. Não é redundância: uma
  coluna é o que o Ministério publicou, a outra é o que a plataforma afirma.

Vale registrar também que **nenhuma tabela armazena dado de saúde de indivíduo**
(RNF21). `tentativa_quiz` guarda apenas acertos e total, sem as respostas
individuais e, na prática, sem identificação de quem respondeu.

## Manutenção

Este diagrama reflete `database/schema.sql`. Ao alterar o schema, altere aqui também —
e lembre que `schema.sql` usa `CREATE TABLE IF NOT EXISTS`, portanto não modifica tabela
já existente: mudanças de coluna precisam de entrada correspondente em
`database/migrar.js` (`npm run migrar`), como foi feito para `questao.conteudo_id`.
