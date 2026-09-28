require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.join(__dirname, 'database.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(schemaPath, 'utf8'));

function tabelaVazia(nomeTabela) {
    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM ${nomeTabela}`).get();
    return total === 0;
}

const CATEGORIAS = [
    { nome: 'Saúde Sexual', slug: 'saude-sexual', descricao: 'Informações sobre saúde sexual, ISTs e prevenção.' },
    { nome: 'Saúde Reprodutiva', slug: 'saude-reprodutiva', descricao: 'Ciclo reprodutivo, gestação e cuidados.' },
    { nome: 'Planejamento Familiar', slug: 'planejamento-familiar', descricao: 'Métodos contraceptivos e planejamento familiar.' },
    { nome: 'Puberdade e Adolescência', slug: 'puberdade-adolescencia', descricao: 'Mudanças do corpo e da mente na adolescência.' },
    { nome: 'Consentimento e Relacionamentos', slug: 'consentimento-relacionamentos', descricao: 'Relacionamentos saudáveis, consentimento e respeito.' },
    { nome: 'Prevenção e ISTs', slug: 'prevencao-ists', descricao: 'Prevenção, testagem e tratamento de ISTs.' },
];

function seedCategorias() {
    if (!tabelaVazia('categoria')) return;
    const inserir = db.prepare('INSERT INTO categoria (nome, slug, descricao) VALUES (?, ?, ?)');
    const transacao = db.transaction((categorias) => {
        categorias.forEach((c) => inserir.run(c.nome, c.slug, c.descricao));
    });
    transacao(CATEGORIAS);
    console.log(`Categorias inseridas: ${CATEGORIAS.length}`);
}

function seedConteudos() {
    // Aditivo por slug: insere o que ainda nao existe, sem tocar no que ja esta
    // gravado. Assim um artigo novo chega tambem em quem ja rodou o seed antes,
    // e edicoes feitas pelo admin nao sao sobrescritas.
    const categoriaIdPorSlug = Object.fromEntries(
        db.prepare('SELECT id, slug FROM categoria').all().map((c) => [c.slug, c.id])
    );

    const CONTEUDOS = [
        {
            categoriaSlug: 'prevencao-ists',
            titulo: 'O que são ISTs',
            slug: 'o-que-sao-ists',
            resumo: "Entenda o que são as infecções sexualmente transmissíveis, seus principais tipos e por que a prevenção é essencial.",
            corpoHtml: "<p>As <strong>Infecções Sexualmente Transmissíveis (ISTs)</strong> são causadas por vírus, bactérias, fungos ou outros microrganismos e podem ser transmitidas principalmente por meio do contato sexual sem proteção, seja oral, vaginal ou anal, com uma pessoa infectada. Desde 2016, o Ministério da Saúde adotou o termo \"IST\" no lugar do antigo \"DST\" (Doença Sexualmente Transmissível), justamente para reforçar que uma pessoa pode estar infectada e transmitir o agente causador mesmo sem apresentar nenhum sintoma — por isso a palavra \"infecção\" é mais precisa do que \"doença\" nesses casos.</p><p>Existem diversos tipos de ISTs, causadas por agentes diferentes. Entre as mais conhecidas estão a <strong>sífilis</strong>, a <strong>gonorreia</strong> e a <strong>clamídia</strong> (causadas por bactérias), o <strong>HIV</strong>, o <strong>HPV</strong> e as <strong>hepatites B e C</strong> (causadas por vírus), além da <strong>tricomoníase</strong> (causada por um parasita) e do <strong>cancro mole</strong>. Cada uma tem características próprias, mas todas compartilham a via de transmissão sexual como principal forma de contágio.</p><p>Além da transmissão sexual, algumas ISTs também podem ser transmitidas de forma vertical, ou seja, da pessoa gestante para o bebê durante a gestação, o parto ou a amamentação — é o caso do HIV, da sífilis e da hepatite B, por exemplo. Mais raramente, algumas infecções também podem ser transmitidas pelo contato de mucosas ou pele com feridas com sangue ou secreções contaminadas, fora do contexto sexual.</p><p>Os sintomas variam bastante de uma IST para outra: podem aparecer feridas, verrugas, corrimentos, coceira, dor ao urinar ou dor pélvica, mas <strong>muitas ISTs não causam sintoma nenhum durante um bom tempo</strong>, especialmente em estágios iniciais. Isso significa que a única forma segura de saber se uma pessoa está infectada é por meio de exames, o que reforça a importância da testagem regular, principalmente para quem tem vida sexual ativa.</p><p>A boa notícia é que a prevenção é simples e acessível. O uso correto do preservativo (masculino ou feminino/interno) em todas as relações sexuais é o método mais eficaz para evitar a transmissão da maioria das ISTs, e o SUS distribui preservativos gratuitamente em unidades de saúde. Muitas ISTs também têm tratamento gratuito e disponível pelo SUS, e quanto mais cedo o diagnóstico, mais simples costuma ser o tratamento e menor o risco de complicações e de transmissão para outras pessoas.</p><p>Cuidar da própria saúde sexual não é motivo de vergonha: envolve informação, prevenção, testagem periódica e diálogo aberto com parceiros e parceiras e com profissionais de saúde. Conhecer os fatos é o primeiro passo para se proteger e proteger quem está ao seu redor.</p>",
            fontes: "Ministério da Saúde",
            faixaEtaria: 'todas',
        },
        {
            categoriaSlug: 'prevencao-ists',
            titulo: 'Uso correto do preservativo',
            slug: 'uso-correto-do-preservativo',
            resumo: "Passo a passo real de como usar a camisinha masculina e a interna/feminina do jeito certo, e os erros mais comuns.",
            corpoHtml: "<p>A camisinha (preservativo) é o único método que protege ao mesmo tempo contra gravidez não planejada e contra a maioria das ISTs, incluindo o HIV. Mas ela só funciona de verdade se for usada do jeito certo, do começo ao fim da relação. Existem dois tipos disponíveis gratuitamente pelo SUS: a <strong>camisinha masculina (externa)</strong>, que cobre o pênis, e a <strong>camisinha feminina (interna)</strong>, que é inserida na vagina ou no ânus antes da relação.</p><p><strong>Passo a passo da camisinha masculina:</strong></p><ul><li>Confira a validade e se a embalagem não está furada ou ressecada antes de abrir.</li><li>Abra a embalagem com cuidado usando os dedos, nunca com os dentes, tesoura ou unhas — isso pode rasgar o preservativo sem você perceber.</li><li>Coloque a camisinha apenas quando o pênis já estiver ereto, e antes de qualquer contato genital, já que o líquido pré-ejaculatório também pode transmitir ISTs.</li><li>Aperte a ponta da camisinha para tirar o ar (isso evita que ela estoure) e desenrole até a base do pênis.</li><li>Se for usar lubrificante, use apenas os à base de água ou silicone — vaselina, óleos e cremes danificam a borracha e podem romper a camisinha.</li><li>Logo após a ejaculação, segure a base da camisinha e retire o pênis ainda ereto, evitando vazamentos.</li><li>Dê um nó na camisinha usada e jogue no lixo — nunca reutilize.</li></ul><p><strong>Passo a passo da camisinha feminina/interna:</strong></p><ul><li>Pode ser inserida até algumas horas antes da relação, o que dá mais autonomia a quem a usa.</li><li>Ela tem dois anéis flexíveis: aperte o anel menor (fechado) e insira na vagina com o dedo indicador, empurrando o mais fundo possível.</li><li>O anel maior (aberto) deve ficar para fora, cobrindo parte da região externa.</li><li>Durante a penetração, guie o pênis para dentro do anel externo, garantindo que ele não escorregue para o lado de fora da camisinha.</li><li>Depois da relação, gire o anel externo para fechar e retire com cuidado, jogando fora em seguida.</li></ul><p>Alguns erros são muito comuns e reduzem a proteção quase a zero: usar duas camisinhas juntas (masculina e feminina, ou duas masculinas), pois o atrito entre elas aumenta o risco de rompimento; guardar a camisinha na carteira ou no porta-luvas do carro por muito tempo, onde o calor e o atrito danificam a borracha; abrir a embalagem com os dentes; não verificar a validade; e reutilizar uma camisinha já usada. Também é um erro comum colocar a camisinha só um pouco antes da ejaculação — o ideal é usá-la do início ao fim de toda a relação.</p><p>Vale lembrar: camisinha nenhuma funciona 100% se usada errado, mas usada corretamente e em toda relação, ela é extremamente eficaz. Se romper durante a relação, procure uma unidade de saúde o quanto antes para avaliar a necessidade de profilaxia pós-exposição (PEP) e contracepção de emergência, se for o caso. E não tem problema perguntar, pedir orientação ou pegar camisinhas de graça no posto de saúde — isso é parte de se cuidar.</p>",
            fontes: "Ministério da Saúde",
            faixaEtaria: 'adolescente',
        },
        {
            categoriaSlug: 'planejamento-familiar',
            titulo: 'Métodos contraceptivos',
            slug: 'metodos-contraceptivos',
            resumo: "Conheça os métodos contraceptivos oferecidos gratuitamente pelo SUS e como escolher o mais adequado com orientação médica.",
            corpoHtml: "<p>O Sistema Único de Saúde (SUS) oferece gratuitamente diversos métodos contraceptivos na atenção primária (postos e unidades básicas de saúde) e em serviços especializados. A escolha do método ideal deve sempre ser feita em consulta com um profissional de saúde, que vai considerar histórico clínico, rotina de vida, presença de filhos, planos reprodutivos e possíveis contraindicações. Não existe um método \"melhor\" de forma universal — existe o método mais adequado para cada pessoa em cada momento da vida.</p><p>Entre os <strong>métodos hormonais</strong> disponíveis estão a pílula anticoncepcional combinada e a minipílula (progestágeno isolado), que impedem a ovulação e/ou espessam o muco cervical, além dos injetáveis: o mensal (combinado) e o trimestral (apenas progestágeno). Também está disponível o implante subdérmico, inserido no braço, que libera hormônio continuamente e tem altíssima eficácia por não depender de uso diário.</p><p>O <strong>DIU (dispositivo intrauterino)</strong> de cobre é oferecido pelo SUS e é um dos métodos mais eficazes que existem, com duração de até 10 anos e sem uso de hormônios. Pode ser colocado em qualquer mulher em idade reprodutiva, inclusive em quem nunca teve filhos. Já os <strong>preservativos</strong> masculino e externo e feminino/interno são distribuídos gratuitamente nas unidades de saúde e têm a vantagem exclusiva de proteger também contra infecções sexualmente transmissíveis (ISTs), por isso o Ministério da Saúde recomenda a chamada \"dupla proteção\": um método contraceptivo de sua escolha associado ao preservativo.</p><p>Para quem deseja um método definitivo, o SUS oferece a <strong>laqueadura tubária</strong> (esterilização feminina) e a <strong>vasectomia</strong> (esterilização masculina). Pela legislação brasileira, esses procedimentos podem ser solicitados por pessoas maiores de 21 anos ou que já tenham pelo menos dois filhos vivos, sem necessidade de autorização do cônjuge ou parceiro(a). É exigido um prazo mínimo de 60 dias entre a manifestação de vontade e a realização da cirurgia, período usado para reflexão e esclarecimento de dúvidas com a equipe de saúde.</p><ul><li><strong>Hormonais:</strong> pílula combinada, minipílula, injetável mensal, injetável trimestral, implante subdérmico</li><li><strong>Dispositivo intrauterino:</strong> DIU de cobre</li><li><strong>Barreira:</strong> preservativo externo e interno</li><li><strong>Definitivos:</strong> laqueadura tubária e vasectomia (mediante critérios legais)</li></ul><p>Independentemente do método escolhido, é fundamental buscar acompanhamento em uma unidade de saúde para orientação individualizada, esclarecimento de dúvidas e avaliação periódica. O planejamento familiar é um direito garantido pelo SUS, e todos os métodos devem ser oferecidos sem distinção de raça, classe social, orientação sexual ou estado civil.</p>",
            fontes: "Ministério da Saúde",
            faixaEtaria: 'adulto',
        },
        {
            categoriaSlug: 'saude-reprodutiva',
            titulo: 'Pré-natal: por que é importante',
            slug: 'pre-natal-por-que-e-importante',
            resumo: "Entenda por que o acompanhamento pré-natal salva vidas, quantas consultas fazer e quais são seus direitos no SUS.",
            corpoHtml: "<p>O acompanhamento pré-natal é o conjunto de consultas, exames e orientações oferecidos à gestante durante toda a gravidez, com o objetivo de garantir a saúde da mãe e do bebê. É por meio dele que profissionais de saúde acompanham a evolução da gestação, identificam precocemente situações de risco (como hipertensão gestacional, diabetes gestacional, infecções e alterações no crescimento fetal) e orientam sobre alimentação, vacinação e sinais de alerta. Iniciar o pré-natal ainda no primeiro trimestre é fundamental, pois é nesse período que se define grande parte do plano de cuidado da gestação.</p><p>O Ministério da Saúde recomenda um número mínimo de seis consultas de pré-natal, distribuídas ao longo da gestação: idealmente uma no primeiro trimestre, duas no segundo e três no terceiro. A frequência aumenta conforme a gravidez avança: as consultas costumam ser mensais até a 28ª semana, quinzenais entre a 28ª e a 36ª semana, e semanais a partir da 36ª semana até o parto. Esse cronograma permite um monitoramento mais próximo justamente na reta final da gestação, quando o risco de intercorrências é maior.</p><p>Durante as consultas, é comum a solicitação de exames de rotina, como hemograma, tipagem sanguínea, glicemia, exames para sífilis, HIV, hepatites B e C, toxoplasmose, além de exame de urina e ultrassonografias obstétricas. Também são avaliados a pressão arterial, o peso, a altura uterina e os batimentos cardíacos fetais em cada consulta. O acompanhamento odontológico também faz parte do pré-natal completo, já que alterações na saúde bucal podem impactar a gestação.</p><p>No Sistema Único de Saúde (SUS), a gestante tem uma série de direitos garantidos por lei. Entre eles está o direito a um acompanhante de sua escolha durante consultas, exames e, principalmente, durante o trabalho de parto, parto e pós-parto imediato, conforme a Lei Federal nº 11.108/2005. A gestante também tem direito a receber a Caderneta da Gestante, documento do Ministério da Saúde onde são registrados todos os dados da gestação, resultados de exames, vacinas e informações importantes para qualquer atendimento de urgência.</p><p>Outro direito importante é a Declaração de Comparecimento, documento que comprova a presença em consultas e exames pré-natais e que justifica eventuais faltas ao trabalho, sem desconto de salário. A gestante tem ainda direito à realização de todos os exames necessários de forma gratuita pelo SUS, e a ser orientada com clareza sobre o andamento da gestação e o plano de parto.</p><p><strong>Fazer o pré-natal completo e nas datas recomendadas é uma das formas mais eficazes de prevenir complicações na gravidez e no parto, reduzindo significativamente os riscos de mortalidade materna e neonatal.</strong> Buscar a unidade de saúde assim que houver suspeita de gravidez é o primeiro passo para uma gestação mais segura e tranquila.</p>",
            fontes: "Ministério da Saúde",
            faixaEtaria: 'adulto',
        },
        {
            categoriaSlug: 'puberdade-adolescencia',
            titulo: 'Mudanças do corpo na puberdade',
            slug: 'mudancas-do-corpo-na-puberdade',
            resumo: "Puberdade traz mudanças físicas e emocionais diferentes para cada corpo, e isso é completamente normal.",
            corpoHtml: "<p>A puberdade é a fase em que o corpo de uma criança vai se transformando até chegar à forma adulta. Segundo a Sociedade Brasileira de Pediatria (SBP), em corpos com ovários essas mudanças costumam começar entre 8 e 13 anos, e em corpos com testículos, entre 9 e 14 anos. Não existe um dia certo em que a puberdade \"liga\": ela é controlada por hormônios, verdadeiros mensageiros químicos que vão sendo liberados aos poucos, e cada corpo segue o próprio ritmo.</p><p>Em corpos que menstruam, a sequência mais comum é: primeiro aparece um pequeno crescimento das mamas (chamado de telarca), depois surgem os pelos pubianos e axilares, em seguida vem um estirão de crescimento em altura, e só depois de tudo isso, em média cerca de dois anos após o início das mamas, acontece a primeira menstruação (menarca). Já em corpos que não menstruam, a puberdade costuma começar com o aumento do volume dos testículos, seguido do crescimento do pênis, do surgimento de pelos pubianos e, mais tarde, de pelos no rosto e nas axilas. A voz fica mais grave por causa do crescimento da laringe, e pode acontecer a primeira ejaculação, inclusive durante o sono — isso também é normal e faz parte do desenvolvimento.</p><p>Além dessas mudanças, existem transformações que acontecem em praticamente todo mundo: a pele fica mais oleosa e pode surgir acne, aparece um novo odor nas axilas, o corpo cresce rápido em um curto período (o chamado \"estirão\") e há ganho de massa muscular, principalmente em braços, pernas e tórax, sendo esse ganho geralmente mais acentuado em corpos com testículos.</p><p>As mudanças não são só no corpo. É comum sentir os humores mais instáveis, ter dias de mais irritação, insegurança com a própria aparência, ansiedade ou até vergonha com essas novidades. Isso acontece com praticamente todo adolescente e tem explicação: os mesmos hormônios que mudam o corpo também influenciam o cérebro e as emoções.</p><p>Um ponto muito importante: <strong>cada corpo tem seu próprio tempo</strong>. Ter a puberdade começando mais cedo ou mais tarde que os colegas, ou passar por essas etapas em uma ordem ou velocidade um pouco diferente, normalmente não é motivo de preocupação. Ainda assim, se a puberdade começar antes dos 8 anos (em corpos com ovários) ou antes dos 9 (em corpos com testículos), ou se não houver nenhum sinal de mudança até os 13-14 anos, vale conversar com um médico ou médica para avaliar com calma.</p><ul><li>Toda mudança faz parte de um processo natural, não é \"errado\" nem motivo de vergonha.</li><li>Ter dúvidas é normal — conversar com um adulto de confiança, ou com um profissional de saúde, ajuda a entender melhor o próprio corpo.</li><li>Cuidar da higiene, do sono e da alimentação ajuda o corpo a passar por essa fase com mais conforto.</li></ul>",
            fontes: "Sociedade Brasileira de Pediatria",
            faixaEtaria: 'adolescente',
        },
        {
            categoriaSlug: 'consentimento-relacionamentos',
            titulo: 'O que é consentimento',
            slug: 'o-que-e-consentimento',
            resumo: "Consentimento é a permissão livre, informada e específica que pode ser retirada a qualquer momento em qualquer relação.",
            corpoHtml: "<p>Consentimento é a permissão clara e voluntária que uma pessoa dá para participar de qualquer tipo de contato ou atividade afetiva ou sexual com outra pessoa. O consentimento é a base de qualquer relação respeitosa: sem ele, qualquer contato físico ou sexual configura violência, independentemente do vínculo entre as pessoas envolvidas, incluindo namorados, cônjuges ou parceiros de longa data.</p><p><strong>Para ser válido, o consentimento precisa ser livre, informado, específico, entusiasmado e reversível.</strong> Livre significa que não pode existir pressão, manipulação, ameaça, chantagem emocional ou uso de álcool/drogas para obter a concordância de alguém. Informado quer dizer que a pessoa entende claramente o que está sendo proposto. Específico significa que concordar com uma coisa (por exemplo, um beijo) não significa concordar com outra (como uma relação sexual) — cada etapa exige uma nova concordância.</p><p>Um ponto essencial, muitas vezes mal compreendido, é que <strong>o consentimento pode ser retirado a qualquer momento</strong>, inclusive durante a própria atividade. Dizer \"sim\" antes não obriga ninguém a continuar se mudar de ideia depois, e isso deve ser respeitado imediatamente, sem questionamentos ou insistência. Da mesma forma, silêncio, ausência de reação, estar dormindo, inconsciente, sob efeito de substâncias ou em posição de vulnerabilidade (como diferença de poder, idade ou dependência) nunca podem ser interpretados como consentimento.</p><p>É importante lembrar que, no Brasil, crianças e adolescentes menores de 14 anos são legalmente incapazes de consentir com qualquer ato sexual, conforme o Código Penal — trata-se de estupro de vulnerável independentemente de aparente concordância. Esse limite existe justamente para proteger quem ainda está em desenvolvimento e pode não ter plena compreensão ou autonomia para decidir sobre esse tipo de situação.</p><p>Praticar o consentimento no dia a dia envolve perguntar, ouvir e respeitar a resposta do outro, além de estar atento a sinais não-verbais de desconforto. Conversar abertamente sobre limites, desejos e vontades fortalece a confiança entre as pessoas e é um hábito saudável em qualquer tipo de relação, desde as primeiras experiências afetivas na adolescência até relacionamentos adultos duradouros.</p>",
            fontes: "Ministério da Saúde; Código Penal Brasileiro (crimes contra a dignidade sexual)",
            faixaEtaria: 'todas',
        },
        {
            categoriaSlug: 'consentimento-relacionamentos',
            titulo: 'Sinais de um relacionamento saudável',
            slug: 'sinais-de-um-relacionamento-saudavel',
            resumo: "Respeito, confiança, comunicação aberta e limites bem definidos são a base de um relacionamento saudável na adolescência.",
            corpoHtml: "<p>Relacionamentos saudáveis, sejam eles de namoro, amizade ou família, se constroem sobre alguns pilares fundamentais: respeito mútuo, confiança, comunicação aberta e liberdade para ser quem você é. Um relacionamento saudável é aquele em que ambas as pessoas se sentem seguras, valorizadas e livres para expressar opiniões, sentimentos e desejos sem medo de julgamento ou represália.</p><p><strong>Respeito</strong> significa que o outro valoriza suas opiniões, seu tempo, seu corpo e suas escolhas, mesmo quando discorda delas. Isso inclui respeitar seu espaço pessoal, suas amizades, sua família e seus outros interesses, sem tentar controlar ou diminuir essas partes da sua vida. Já a <strong>confiança</strong> permite que cada pessoa tenha sua própria individualidade, sem a necessidade constante de vigiar o celular do outro, verificar localização o tempo todo ou exigir explicações para cada momento do dia.</p><p>A <strong>comunicação aberta</strong> é outro sinal importante: em um relacionamento saudável, é possível conversar sobre desacordos, inseguranças e limites sem que isso vire motivo de brigas explosivas, silêncio prolongado como punição ou ameaças. Divergências são normais em qualquer relação — o que diferencia um vínculo saudável é a forma como os conflitos são resolvidos, buscando entendimento em vez de vencer o outro pelo medo ou pela culpa.</p><p>Alguns sinais concretos de que um relacionamento vai bem incluem:</p><ul><li>Você se sente à vontade para dizer \"não\" e essa decisão é respeitada;</li><li>Vocês mantêm amizades e atividades individuais, além das que fazem juntos;</li><li>Erros são reconhecidos e desculpas são genuínas, sem repetição do mesmo padrão de comportamento;</li><li>Não há humilhação, apelidos pejorativos ou comparações constantes com outras pessoas;</li><li>Decisões importantes, incluindo as relacionadas à intimidade, são tomadas em conjunto, com consentimento.</li></ul><p>Vale lembrar que nenhuma relação é perfeita o tempo todo, e sentir ciúmes ou insegurança ocasionalmente faz parte de ser humano. O ponto de atenção é quando esses sentimentos se transformam em controle, cobrança excessiva ou tentativas de isolar a outra pessoa — nesse caso, vale conversar abertamente ou buscar apoio de um adulto de confiança, escola ou serviço de saúde.</p>",
            fontes: "Ministério da Saúde",
            faixaEtaria: 'adolescente',
        },
        {
            categoriaSlug: 'saude-sexual',
            titulo: 'Testagem para ISTs: quando e como fazer',
            slug: 'testagem-para-ists-quando-e-como-fazer',
            resumo: "Testar regularmente é a forma mais eficaz de cuidar da saúde sexual e é gratuito e sigiloso pelo SUS.",
            corpoHtml: "<p>Fazer o teste para infecções sexualmente transmissíveis (ISTs) regularmente é uma das atitudes mais importantes de cuidado com a própria saúde e com a saúde de parceiros e parceiras sexuais. Muitas ISTs, como HIV, sífilis e hepatites B e C, podem não apresentar sintomas visíveis por longos períodos, o que significa que uma pessoa pode estar infectada e transmitir o agente causador sem saber. A testagem regular permite diagnóstico precoce, tratamento no momento certo e redução da cadeia de transmissão na comunidade.</p><p>No Brasil, o Sistema Único de Saúde (SUS) garante o acesso gratuito e sigiloso à testagem. O atendimento pode ser feito nas Unidades Básicas de Saúde (UBS) e nos Centros de Testagem e Aconselhamento (CTA), que oferecem, além dos testes, orientação e acolhimento antes e depois do resultado. Não é necessário apresentar sintomas para procurar esses serviços: qualquer pessoa com vida sexual ativa pode e deve buscar a testagem como parte do cuidado preventivo de rotina.</p><p>Os testes rápidos são uma das principais ferramentas disponibilizadas pelo Ministério da Saúde para o diagnóstico de HIV, sífilis e hepatites virais B e C. Eles são realizados a partir de uma amostra de sangue colhida na ponta do dedo e fornecem resultado em até 30 minutos, o que reduz a espera, evita a evasão do paciente antes do resultado e agiliza o encaminhamento para tratamento quando necessário. Também existe o chamado \"teste duo\", que detecta simultaneamente HIV e sífilis em uma única amostra, ampliando a cobertura diagnóstica em um único atendimento.</p><p>Um ponto importante é a chamada janela imunológica: o período entre a exposição ao vírus ou bactéria e o momento em que o teste é capaz de detectar a infecção com segurança. Para HIV e hepatites, recomenda-se aguardar pelo menos 30 dias após uma exposição de risco antes de realizar o teste, podendo esse intervalo variar conforme o agente infeccioso e o tipo de teste utilizado. Em caso de dúvida sobre o momento ideal para testar, a equipe de saúde do CTA ou da UBS pode orientar sobre o prazo mais adequado.</p><p>Quanto à periodicidade, a recomendação geral é que pessoas sexualmente ativas façam a testagem para HIV, sífilis e hepatites pelo menos uma vez por ano, mesmo sem sintomas. Essa frequência deve ser maior para quem tem múltiplos parceiros(as), não utiliza preservativo com regularidade, ou pertence a grupos com maior exposição ao risco, como recomendado pelos protocolos do Ministério da Saúde. Incorporar a testagem à rotina de cuidados de saúde, da mesma forma que se faz com outros exames preventivos, é um passo simples e acessível que fortalece tanto a saúde individual quanto a saúde coletiva.</p><ul><li>Onde testar: Unidades Básicas de Saúde (UBS) e Centros de Testagem e Aconselhamento (CTA) do SUS</li><li>Testes rápidos disponíveis: HIV, sífilis, hepatites B e C, e teste duo (HIV + sífilis)</li><li>Resultado em até 30 minutos, atendimento gratuito e sigiloso</li><li>Periodicidade recomendada: pelo menos 1 vez ao ano para pessoas sexualmente ativas, com maior frequência em situações de maior exposição ao risco</li></ul>",
            fontes: "Ministério da Saúde",
            faixaEtaria: 'adulto',
        },
        {
            categoriaSlug: 'saude-sexual',
            titulo: 'Saúde sexual e bem-estar emocional',
            slug: 'saude-sexual-e-bem-estar-emocional',
            resumo: "Para a OMS, saúde sexual é bem-estar físico, emocional, mental e social, não apenas ausência de doença.",
            corpoHtml: "<p>Quando se fala em saúde sexual, é comum que a associação imediata seja com prevenção de doenças e uso de métodos contraceptivos. Esses aspectos são fundamentais, mas representam apenas uma parte de um conceito muito mais amplo. A Organização Mundial da Saúde (OMS) define saúde sexual como \"um estado de bem-estar físico, emocional, mental e social relacionado à sexualidade, e não meramente a ausência de doença, disfunção ou enfermidade\". Essa definição reconhece que a sexualidade humana envolve dimensões que vão muito além do corpo, incluindo emoções, pensamentos, vínculos e o contexto social em que a pessoa vive.</p><p>De acordo com a OMS/OPAS, a saúde sexual exige uma abordagem positiva e respeitosa da sexualidade e dos relacionamentos sexuais, com a possibilidade real de se ter experiências prazerosas e seguras, livres de coerção, discriminação e violência. Isso significa que uma pessoa só pode ser considerada plenamente saudável, do ponto de vista sexual, quando seus direitos são respeitados e quando ela pode viver sua sexualidade com liberdade, segurança e consentimento mútuo em todas as etapas da vida.</p><p>A comunicação entre parceiros e parceiras tem papel central nesse equilíbrio. Conversar abertamente sobre desejos, limites, expectativas e preocupações de saúde fortalece a confiança e reduz mal-entendidos que podem gerar frustração, ansiedade ou conflitos. O consentimento claro e contínuo — e não apenas presumido — é uma das bases de relações sexuais saudáveis, e conversar sobre isso deve ser natural, não constrangedor, em qualquer tipo de relacionamento.</p><p>A autoestima também influencia diretamente a vivência da sexualidade. Sentir-se bem com o próprio corpo, respeitar o próprio ritmo e reconhecer o direito de dizer sim ou não sem culpa são elementos que contribuem tanto para o bem-estar emocional quanto para relações mais equilibradas. Da mesma forma, o respeito mútuo — que envolve escutar o outro, aceitar limites e não normalizar pressão ou coação — é indispensável para que a sexualidade seja fonte de bem-estar, e não de sofrimento.</p><p>Esse olhar ampliado sobre saúde sexual vale para todas as idades, adaptando-se às diferentes fases da vida: da educação sexual na infância e adolescência, passando pela vivência da sexualidade na vida adulta, até as mudanças que ocorrem no envelhecimento. Em qualquer momento, cuidar da saúde sexual também é cuidar da saúde emocional e mental, buscando informação de qualidade, apoio quando necessário e relações baseadas em respeito e consentimento.</p>",
            fontes: "OMS/OPAS",
            faixaEtaria: 'todas',
        },
        {
            categoriaSlug: 'saude-reprodutiva',
            titulo: 'Ciclo menstrual: como funciona',
            slug: 'ciclo-menstrual-como-funciona',
            resumo: "Conheça as fases do ciclo menstrual, os hormônios envolvidos, o que é considerado normal e quando buscar um médico.",
            corpoHtml: "<p>O ciclo menstrual é o processo hormonal recorrente que prepara o corpo para uma possível gravidez a cada mês. Ele é contado a partir do primeiro dia de sangramento (dia 1) até o dia anterior ao início da próxima menstruação. Embora o ciclo de 28 dias seja frequentemente citado como referência, ele varia de pessoa para pessoa, e mesmo de um mês para o outro na mesma pessoa, sem que isso represente necessariamente um problema.</p><p>O ciclo pode ser dividido em três fases principais: a fase folicular, a ovulação e a fase lútea. Na fase folicular, que começa no primeiro dia da menstruação, a hipófise libera o hormônio folículo-estimulante (FSH), que estimula o crescimento de vários folículos nos ovários. Um desses folículos se torna dominante e passa a produzir quantidades crescentes de estrogênio, hormônio responsável por espessar o endométrio (a camada interna do útero) em preparação para uma possível implantação de embrião.</p><p>Quando o nível de estrogênio atinge um pico, ocorre um aumento súbito do hormônio luteinizante (LH), o chamado pico de LH, que desencadeia a ovulação: a liberação do óvulo maduro pelo ovário, geralmente por volta do meio do ciclo. Após a ovulação, começa a fase lútea, na qual o folículo rompido se transforma em corpo lúteo e passa a produzir progesterona. Esse hormônio mantém o endométrio espessado e pronto para receber um embrião; se não houver fecundação, os níveis de progesterona e estrogênio caem, o endométrio se desprende e uma nova menstruação se inicia, reiniciando o ciclo.</p><p>Considera-se dentro da faixa de normalidade um ciclo que dura entre 24 e 38 dias, com duração do fluxo menstrual entre 3 e 7 dias. Pequenas variações na duração do ciclo de um mês para outro são comuns e podem ser influenciadas por fatores como estresse, alterações de peso, uso de medicamentos, amamentação, prática intensa de exercícios físicos e mudanças hormonais próprias de diferentes fases da vida, como a adolescência e a perimenopausa.</p><ul><li>Ciclos que duram menos de 21 dias ou mais de 35 a 38 dias de forma persistente;</li><li>Sangramento muito intenso ou muito prolongado (mais de 7 dias);</li><li>Dor pélvica intensa que atrapalha as atividades do dia a dia;</li><li>Sangramento entre um período menstrual e outro;</li><li>Ausência de menstruação por 3 meses ou mais, sem gravidez, amamentação ou menopausa;</li><li>Ausência de primeira menstruação (menarca) aos 15 anos ou mais.</li></ul><p><strong>Diante de qualquer um desses sinais, é recomendado procurar um ginecologista para avaliação.</strong> Acompanhar o próprio ciclo, seja por calendário ou aplicativos, ajuda a identificar o que é padrão para cada pessoa e a perceber mais rapidamente quando algo foge do habitual, permitindo um diagnóstico e tratamento mais precoces quando necessário.</p>",
            fontes: "FEBRASGO; OMS",
            faixaEtaria: 'todas',
        },
        {
            categoriaSlug: 'planejamento-familiar',
            titulo: 'DIU: o que é e como funciona',
            slug: 'diu-o-que-e-e-como-funciona',
            resumo: "Entenda o que é o DIU, seus tipos (cobre e hormonal), como é colocado e sua disponibilidade gratuita no SUS.",
            corpoHtml: "<p>O DIU (dispositivo intrauterino) é um pequeno dispositivo em formato de \"T\", inserido dentro do útero por um profissional de saúde, que oferece contracepção de longa duração com eficácia acima de 99%, comparável à da laqueadura. É considerado um dos métodos mais eficazes disponíveis atualmente, justamente por não depender de lembrar de tomar comprimidos ou repetir aplicações com frequência. Pode ser utilizado por mulheres em qualquer momento da vida reprodutiva, inclusive por quem nunca engravidou.</p><p>Existem dois tipos principais de DIU. O <strong>DIU de cobre</strong>, disponível gratuitamente pelo SUS, não contém hormônios: o cobre provoca uma reação local no útero que danifica os espermatozoides e dificulta sua movimentação, impedindo a fecundação. Ele pode durar entre 3 e 10 anos, dependendo do modelo. Já o <strong>DIU hormonal</strong>, que libera o hormônio levonorgestrel diretamente no útero, atua espessando o muco cervical e, em muitos casos, reduz de forma significativa o fluxo menstrual, podendo até interromper a menstruação em algumas usuárias.</p><p>A colocação do DIU é feita em consultório ou unidade de saúde, por médico ou enfermeiro capacitado, geralmente em poucos minutos. O procedimento pode causar um desconforto passageiro, semelhante a cólicas, e o profissional pode orientar o uso de analgésicos antes ou depois da inserção. O DIU também pode ser colocado logo após o parto ou após um abortamento, conforme avaliação da equipe de saúde.</p><p>Nos primeiros meses após a colocação do DIU de cobre, é comum um leve aumento do fluxo menstrual e das cólicas, que tende a diminuir com o tempo. Existe também uma pequena chance de expulsão do dispositivo, mais frequente no primeiro ano de uso, por isso recomenda-se acompanhamento periódico para verificar seu posicionamento correto. Efeitos adversos importantes, como perfuração uterina, são raros. O DIU não deve ser utilizado em casos de gravidez confirmada, infecções ginecológicas ativas, alterações importantes na anatomia do útero ou alergia ao cobre (no caso do DIU de cobre), por isso a avaliação médica prévia é indispensável.</p><p>A boa notícia é que o DIU de cobre está cada vez mais acessível pelo SUS: o Ministério da Saúde ampliou a distribuição do método nos últimos anos, e o número de inserções em unidades básicas de saúde mais que dobrou entre 2022 e 2023. Quem tem interesse deve procurar a unidade básica de saúde mais próxima para conversar com um profissional, tirar dúvidas e agendar a colocação, que é gratuita e faz parte do direito ao planejamento familiar garantido pelo SUS.</p>",
            fontes: "Ministério da Saúde; FEBRASGO",
            faixaEtaria: 'adulto',
        },
        {
            categoriaSlug: 'puberdade-adolescencia',
            titulo: 'Primeira menstruação: o que esperar',
            slug: 'primeira-menstruacao-o-que-esperar',
            resumo: "Entenda o que é a menarca, quando costuma acontecer e como cuidar da higiene com segurança.",
            corpoHtml: "<p>A primeira menstruação tem um nome próprio: <strong>menarca</strong>. Ela marca o momento em que o corpo, depois de passar por outras mudanças da puberdade (como o desenvolvimento das mamas e o surgimento de pelos pubianos), começa a liberar o revestimento interno do útero através da vagina, em ciclos que se repetem todo mês. É um sinal de que o corpo está amadurecendo, e não tem nada de errado ou sujo nisso — é um processo biológico natural.</p><p>Segundo a Sociedade Brasileira de Pediatria, a menarca costuma acontecer em média por volta dos 12 anos e meio, sendo considerado normal qualquer idade entre 9 e 16 anos. Ela geralmente ocorre cerca de dois anos depois do início do crescimento das mamas, e alguns meses depois do estirão de crescimento em altura. Cada corpo tem seu próprio calendário: fatores como genética (a idade em que a mãe ou irmãs mais velhas menstruaram), alimentação e saúde geral influenciam esse momento, então não faz sentido se comparar com as amigas.</p><p>Nos primeiros dois anos após a menarca, é bastante comum que os ciclos sejam irregulares — vindo antes ou depois do esperado, ou variando na quantidade de sangramento. Isso acontece porque o sistema hormonal ainda está amadurecendo, e normalmente se ajusta sozinho com o tempo, sem precisar de tratamento.</p><p>Para os cuidados de higiene, o mais importante é lavar a região genital externa com água (sem exagerar em sabonetes internos) e trocar o absorvente, coletor menstrual ou outro item de proteção com regularidade, mantendo a área limpa e seca, já que o excesso de umidade favorece o crescimento de fungos e bactérias. Existem diferentes opções de proteção — absorvente externo, interno, calcinha absorvente ou coletor menstrual — e cada pessoa pode descobrir, com calma e informação, qual se sente mais confortável usando.</p><p>Mesmo com as irregularidades sendo normais no começo, existem sinais que merecem atenção de um médico ou médica, como ginecologista ou pediatra: cólicas muito intensas que atrapalham as atividades do dia a dia, sangramento muito abundante (trocar o absorvente a cada hora, por exemplo), ciclos com intervalo maior que 45 dias ou menor que 21 dias já depois dos dois primeiros anos, ausência de menstruação por mais de três meses (sem gravidez), ou qualquer mudança que cause muita preocupação. Buscar orientação de saúde não é exagero — é uma forma de cuidado, e ter esse acompanhamento desde cedo ajuda a entender melhor o próprio corpo ao longo da vida.</p><ul><li>Ciclos irregulares nos primeiros 2 anos após a menarca costumam ser normais.</li><li>Um ciclo saudável costuma durar entre 24 e 38 dias, com sangramento de até 8 dias.</li><li>Dor intensa, sangramento muito abundante ou ausência de menstruação por mais de 3 meses são sinais para procurar avaliação médica.</li></ul>",
            fontes: "Sociedade Brasileira de Pediatria; Federação Brasileira das Associações de Ginecologia e Obstetrícia (FEBRASGO)",
            faixaEtaria: 'adolescente',
        },
        {
            categoriaSlug: 'consentimento-relacionamentos',
            titulo: 'Como identificar relacionamentos abusivos',
            slug: 'como-identificar-relacionamentos-abusivos',
            resumo: "Controle excessivo, ciúme doentio e isolamento são sinais de alerta; Ligue 180 e Disque 100 oferecem ajuda gratuita e sigilosa.",
            corpoHtml: "<p>Nem sempre é fácil perceber quando um relacionamento deixou de ser saudável e passou a ser abusivo, principalmente porque esse processo costuma ser gradual. A violência no namoro ou em outros relacionamentos afetivos pode acontecer de diversas formas — psicológica, física, sexual, patrimonial (relacionada a dinheiro e bens) ou moral — e muitas vezes começa com atitudes que parecem \"prova de amor\" ou preocupação excessiva, mas que na verdade são formas de controle.</p><p>Alguns sinais de alerta merecem atenção: <strong>controle excessivo</strong> sobre roupas, amizades, redes sociais ou horários; <strong>ciúme doentio</strong>, que gera acusações constantes sem motivo; exigência de acesso ao celular e senhas; <strong>isolamento</strong> gradual da pessoa em relação a amigos e família; humilhações, xingamentos ou críticas frequentes à aparência e às capacidades do parceiro; ameaças, inclusive de término, autolesão ou exposição íntima como forma de manipulação; e, em casos mais graves, agressões físicas como empurrões, tapas ou qualquer forma de violência corporal. Pressionar ou forçar contato sexual, mesmo dentro do namoro, também é uma forma grave de violência.</p><p>É importante frisar que abuso não é sinal de amor intenso, e sim de desrespeito e desequilíbrio de poder na relação. Também é comum que quem sofre violência sinta vergonha, medo de não ser acreditado, ou acredite que pode \"mudar\" a outra pessoa — mas ninguém precisa enfrentar isso sozinho, e buscar ajuda é um ato de cuidado consigo mesmo, não um exagero.</p><p>No Brasil, existem canais gratuitos e sigilosos para pedir ajuda ou denunciar situações de violência, disponíveis 24 horas por dia:</p><ul><li><strong>Ligue 180</strong> – Central de Atendimento à Mulher, coordenada pelo Ministério dos Direitos Humanos e da Cidadania, oferece orientação sobre direitos, leis e encaminhamento para a rede de proteção;</li><li><strong>Disque 100</strong> – recebe denúncias de violações de direitos humanos, incluindo contra crianças, adolescentes e outros grupos vulneráveis;</li><li><strong>190</strong> – Polícia Militar, para situações de emergência e risco imediato;</li><li>Delegacias Especializadas de Atendimento à Mulher (DEAMs) e serviços de saúde também podem oferecer apoio e orientação.</li></ul><p>A <strong>Lei Maria da Penha (Lei nº 11.340/2006)</strong> é a principal legislação brasileira de proteção à mulher em situação de violência doméstica e familiar, prevendo medidas protetivas de urgência que podem ser solicitadas para garantir segurança. Conversar com um adulto de confiança, um profissional da escola ou um serviço de saúde também é um passo importante: ninguém deve enfrentar uma situação de abuso sozinho, e existe uma rede pronta para ajudar.</p>",
            fontes: "Ministério dos Direitos Humanos e da Cidadania (Disque 100 e Ligue 180); Lei Maria da Penha (Lei nº 11.340/2006)",
            faixaEtaria: 'adolescente',
        },
        {
            categoriaSlug: 'prevencao-ists',
            titulo: 'HIV: transmissão, tratamento e PrEP',
            slug: 'hiv-transmissao-tratamento-e-prep',
            resumo: "Como o HIV é transmitido, o tratamento antirretroviral gratuito do SUS e o que são PrEP, PEP e a testagem.",
            corpoHtml: "<p>O <strong>HIV (Vírus da Imunodeficiência Humana)</strong> é o vírus que, sem tratamento, pode levar à Aids ao longo do tempo, ao atacar progressivamente o sistema imunológico. A transmissão ocorre principalmente por relações sexuais sem preservativo (vaginal, anal ou oral), pelo compartilhamento de seringas e agulhas contaminadas, e de forma vertical, da gestante para o bebê durante a gravidez, o parto ou a amamentação. O HIV não é transmitido por abraço, aperto de mão, uso do mesmo talher, assento de vaso sanitário ou picada de inseto — mitos que ainda geram muito preconceito e estigma desnecessários.</p><p>Desde 1996, o Brasil garante por lei o <strong>tratamento antirretroviral (TARV) gratuito pelo SUS</strong> para todas as pessoas diagnosticadas com HIV, sendo uma das políticas públicas de referência mundial na resposta à epidemia. Atualmente o SUS disponibiliza gratuitamente diversos medicamentos antirretrovirais, muitos produzidos no próprio país. O tratamento, tomado corretamente todos os dias, reduz a quantidade do vírus no sangue a níveis indetectáveis, o que preserva a saúde da pessoa e também elimina praticamente o risco de transmissão do vírus para parceiros e parceiras — o que ficou conhecido pelo conceito \"Indetectável = Intransmissível\" (I=I).</p><p>Além do tratamento de quem já vive com HIV, o SUS oferece também estratégias de prevenção para pessoas que ainda não têm o vírus. A <strong>PrEP (Profilaxia Pré-Exposição)</strong> é o uso diário de um medicamento antirretroviral por pessoas com maior exposição ao risco de infecção, oferecida gratuitamente pelo SUS para pessoas sexualmente ativas a partir dos 15 anos que se enquadrem nos critérios do protocolo clínico do Ministério da Saúde. Usada corretamente, a PrEP é altamente eficaz na prevenção da infecção pelo HIV.</p><p>Já a <strong>PEP (Profilaxia Pós-Exposição)</strong> é um tratamento de emergência indicado após uma possível exposição ao HIV — como relação sexual sem preservativo, rompimento de camisinha, violência sexual ou acidente com material biológico. Ela precisa ser iniciada o quanto antes, dentro de no máximo <strong>72 horas</strong> após a exposição, e consiste no uso de antirretrovirais por 28 dias para impedir que o vírus se estabeleça no organismo. A PEP está disponível gratuitamente em serviços de saúde do SUS, incluindo prontos-socorros e hospitais de referência, e quanto mais rápido for procurada, maior a chance de eficácia.</p><p>A <strong>testagem regular</strong> é fundamental, já que muitas pessoas vivem com HIV sem saber. O SUS oferece testes rápidos gratuitos, que dão resultado em cerca de 30 minutos, além de autotestes distribuídos em unidades de saúde para quem prefere testar em casa ou em ambientes mais reservados. Recomenda-se testar periodicamente quem tem vida sexual ativa, especialmente após relações sem preservativo ou troca de parceiros.</p><p>Viver com HIV hoje é muito diferente de décadas atrás: com diagnóstico precoce, tratamento correto e acompanhamento médico, é totalmente possível ter uma vida longa e saudável. Buscar informação, se testar e conversar abertamente com profissionais de saúde são atitudes de cuidado, não motivo de medo ou vergonha.</p>",
            fontes: "Ministério da Saúde; UNAIDS Brasil",
            faixaEtaria: 'adulto',
        },
        {
            categoriaSlug: 'planejamento-familiar',
            titulo: 'Mitos e verdades sobre a pílula',
            slug: 'mitos-e-verdades-sobre-a-pilula',
            resumo: 'O que as fontes oficiais dizem sobre os boatos mais comuns a respeito da pílula anticoncepcional: ganho de peso, pausas, fertilidade, antibióticos e proteção contra ISTs.',
            corpoHtml: '<p>A pílula anticoncepcional é um dos métodos contraceptivos mais usados no Brasil e, talvez por isso, também um dos que mais acumulam informações desencontradas. Separar o que as fontes oficiais dizem do que circula na conversa do dia a dia ajuda a usar o método com segurança — e a fazer perguntas melhores na consulta.</p><h2>"A pílula engorda"</h2><p>As pílulas atuais têm doses hormonais muito menores do que as das primeiras gerações, e os estudos disponíveis não confirmam ganho de peso significativo causado pelo método. Algumas pessoas relatam retenção de líquido ou inchaço nos primeiros meses, o que costuma diminuir com a adaptação. Se o incômodo persistir, o caminho é conversar com o profissional de saúde sobre trocar a formulação — não abandonar o método por conta própria.</p><h2>"É preciso dar uma pausa de tempos em tempos"</h2><p>Não existe recomendação de interromper periodicamente o uso para o corpo "descansar". A pausa sem orientação não traz benefício comprovado e cria janelas de desproteção, aumentando a chance de gravidez não planejada. A necessidade de interromper ou trocar o método é avaliada caso a caso, em consulta.</p><h2>"Quem usa pílula por muitos anos fica infértil"</h2><p>A pílula não causa infertilidade. Depois da interrupção, a ovulação costuma voltar já nos primeiros ciclos, embora possa levar alguns meses até o ciclo se regularizar — o que varia de pessoa para pessoa. Dificuldade para engravidar após parar o método normalmente tem outra causa, que merece investigação própria.</p><h2>"Qualquer antibiótico corta o efeito"</h2><p>Esse é um dos mitos mais difundidos. Os antibióticos de uso comum, como a amoxicilina, não reduzem a eficácia da pílula. A interação relevante está restrita a alguns medicamentos específicos — a rifampicina e a rifabutina (usadas no tratamento de tuberculose e outras infecções), além de certos anticonvulsivantes e antirretrovirais. Por isso vale sempre informar ao profissional que você usa contraceptivo hormonal antes de iniciar qualquer tratamento.</p><h2>"Quem toma pílula está protegido contra IST"</h2><p>Falso, e esse é o mito com maior potencial de dano. A pílula age apenas sobre a possibilidade de gravidez: ela não oferece nenhuma barreira contra HIV, sífilis, gonorreia, clamídia, HPV ou hepatites. Proteção contra infecções sexualmente transmissíveis vem do preservativo, externo ou interno. É exatamente por isso que o Ministério da Saúde recomenda a <strong>dupla proteção</strong>: o método contraceptivo de sua escolha associado ao preservativo.</p><h2>"Esqueci um comprimido, perdi a proteção do mês inteiro"</h2><p>Não é assim que funciona. O impacto de um esquecimento depende de quantos comprimidos foram esquecidos, de qual semana da cartela e do tipo de pílula. A bula de cada apresentação traz a conduta específica, e a orientação geral é usar preservativo como reforço nos dias seguintes até retomar o uso regular. Em caso de dúvida, procure a unidade de saúde: existe também a contracepção de emergência, disponível gratuitamente no SUS.</p><h2>"A pílula do dia seguinte é abortiva"</h2><p>A contracepção de emergência age principalmente atrasando ou impedindo a ovulação, ou seja, atua antes de haver fecundação. Ela não interrompe uma gravidez já estabelecida. É um recurso para situações eventuais — falha do preservativo, esquecimento, violência sexual — e não substitui um método contraceptivo de uso regular, por ter eficácia menor.</p><h2>Quem não deve usar a pílula combinada</h2><p>A pílula não é indicada para todo mundo. Fumantes com 35 anos ou mais, pessoas com histórico de trombose ou embolia, hipertensão não controlada, enxaqueca com aura e algumas doenças hepáticas ou cardiovasculares têm contraindicação ao componente estrogênico — e nesses casos existem alternativas, como a minipílula, o implante ou o DIU. Só a avaliação de um profissional de saúde, considerando seu histórico, define o método adequado.</p><p>Se alguma dessas informações contraria o que você ouviu, leve a dúvida para a consulta na unidade básica de saúde: o planejamento familiar é um direito garantido pelo SUS, e a escolha do método é sempre individual.</p>',
            fontes: 'Ministério da Saúde; FEBRASGO',
            faixaEtaria: 'adulto',
        },
    ];

    const inserir = db.prepare(
        `INSERT INTO conteudo (categoria_id, titulo, slug, resumo, corpo_html, fontes, faixa_etaria, publicado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
    );
    const jaExiste = db.prepare('SELECT 1 FROM conteudo WHERE slug = ?');
    let inseridos = 0;

    const transacao = db.transaction((conteudos) => {
        conteudos.forEach((c) => {
            if (jaExiste.get(c.slug)) return;
            inseridos += 1;
            inserir.run(
                categoriaIdPorSlug[c.categoriaSlug],
                c.titulo,
                c.slug,
                c.resumo,
                c.corpoHtml,
                c.fontes,
                c.faixaEtaria
            );
        });
    });
    transacao(CONTEUDOS);
    console.log(`Conteudos inseridos: ${inseridos}`);
}

// Quiz único de demonstração (o site tem um só quiz, não uma lista deles —
// por isso o menu aponta direto para /quiz/1 em vez de existir uma página de
// listagem). As perguntas cobrem os mesmos temas dos 14 conteúdos publicados.
const QUIZZES = [
    {
        titulo: 'Quanto você sabe sobre saúde sexual e planejamento familiar?',
        descricao: 'Seis perguntas rápidas para testar o que você já sabe sobre os temas deste site.',
        questoes: [
            {
                enunciado: 'Em média, quantos dias dura um ciclo menstrual?',
                explicacao:
                    'O ciclo menstrual dura, em média, 28 dias, mas é considerado regular quando varia entre 21 e 35 dias de pessoa para pessoa.',
                alternativas: [
                    { texto: '14 dias', correta: false },
                    { texto: '21 dias', correta: false },
                    { texto: '28 dias', correta: true },
                    { texto: '40 dias', correta: false },
                ],
            },
            {
                enunciado: 'Qual é a principal função do uso correto do preservativo (camisinha)?',
                explicacao:
                    'O preservativo, usado corretamente, é o único método que previne ao mesmo tempo ISTs e gravidez não planejada.',
                alternativas: [
                    { texto: 'Regular o ciclo menstrual', correta: false },
                    { texto: 'Prevenir ISTs e gravidez não planejada', correta: true },
                    { texto: 'Tratar infecções já existentes', correta: false },
                    { texto: 'Substituir o exame preventivo', correta: false },
                ],
            },
            {
                enunciado: 'O que é o DIU (Dispositivo Intrauterino)?',
                explicacao:
                    'O DIU é um método contraceptivo de longa duração, inserido no útero por um profissional de saúde, podendo ser hormonal ou de cobre.',
                alternativas: [
                    { texto: 'Um exame de rotina ginecológica', correta: false },
                    { texto: 'Um método contraceptivo de longa duração inserido no útero', correta: true },
                    { texto: 'Um tipo de vacina contra ISTs', correta: false },
                    { texto: 'Um remédio hormonal em comprimido', correta: false },
                ],
            },
            {
                enunciado: 'O que é a PrEP (Profilaxia Pré-Exposição)?',
                explicacao:
                    'PrEP é o uso preventivo de medicamento antirretroviral antes de uma possível exposição, reduzindo bastante o risco de adquirir HIV. Não existe vacina contra o HIV.',
                alternativas: [
                    { texto: 'Um exame para detectar HIV', correta: false },
                    { texto: 'Um tratamento usado somente após o parto', correta: false },
                    { texto: 'O uso de medicamento antes da exposição para reduzir o risco de HIV', correta: true },
                    { texto: 'Uma vacina contra o HIV', correta: false },
                ],
            },
            {
                enunciado: 'O consentimento em uma relação deve ser:',
                explicacao:
                    'Consentimento válido é claro, livre, informado e contínuo — pode ser retirado a qualquer momento, mesmo em um relacionamento já estabelecido.',
                alternativas: [
                    { texto: 'Assumido se a pessoa não disser não', correta: false },
                    { texto: 'Dado uma única vez para toda a relação', correta: false },
                    { texto: 'Claro, livre, informado e pode ser retirado a qualquer momento', correta: true },
                    { texto: 'Necessário apenas em relacionamentos novos', correta: false },
                ],
            },
            {
                enunciado: 'Por que fazer o teste para ISTs mesmo sem apresentar sintomas?',
                explicacao:
                    'Muitas ISTs podem ser assintomáticas por um bom tempo; o diagnóstico precoce evita complicações de saúde e reduz a transmissão para outras pessoas.',
                alternativas: [
                    {
                        texto: 'Porque muitas ISTs podem ser assintomáticas e o diagnóstico precoce evita complicações e transmissão',
                        correta: true,
                    },
                    { texto: 'Porque é obrigatório por lei antes de qualquer relação', correta: false },
                    { texto: 'Porque substitui o uso de preservativo', correta: false },
                    { texto: 'Porque só é necessário depois dos 40 anos', correta: false },
                ],
            },
        ],
    },
];

function seedQuizzes() {
    if (!tabelaVazia('quiz')) return;

    const inserirQuiz = db.prepare('INSERT INTO quiz (categoria_id, titulo, descricao) VALUES (NULL, ?, ?)');
    const inserirQuestao = db.prepare('INSERT INTO questao (quiz_id, enunciado, explicacao, ordem) VALUES (?, ?, ?, ?)');
    const inserirAlternativa = db.prepare('INSERT INTO alternativa (questao_id, texto, correta) VALUES (?, ?, ?)');

    const transacao = db.transaction((quizzes) => {
        quizzes.forEach((quiz) => {
            const quizId = inserirQuiz.run(quiz.titulo, quiz.descricao).lastInsertRowid;
            quiz.questoes.forEach((questao, indice) => {
                const questaoId = inserirQuestao.run(quizId, questao.enunciado, questao.explicacao, indice + 1)
                    .lastInsertRowid;
                questao.alternativas.forEach((alternativa) => {
                    inserirAlternativa.run(questaoId, alternativa.texto, alternativa.correta ? 1 : 0);
                });
            });
        });
    });

    transacao(QUIZZES);
    console.log(`Quizzes inseridos: ${QUIZZES.length}`);
}

// Um quiz por categoria, liberado na trilha depois que o visitante le todos os
// artigos daquela categoria. Cada questao aponta o artigo de onde saiu
// (conteudoSlug), para o resultado indicar o que revisar em caso de erro.
const QUIZZES_POR_CATEGORIA = [
    {
        categoriaSlug: 'consentimento-relacionamentos',
        titulo: 'Consentimento e relacionamentos',
        descricao: 'Quatro perguntas sobre os artigos desta categoria.',
        questoes: [
            {
                conteudoSlug: 'o-que-e-consentimento',
                enunciado: 'Depois de dizer "sim", a pessoa pode mudar de ideia durante a relação?',
                explicacao:
                    'O consentimento é reversível: pode ser retirado a qualquer momento, inclusive durante a própria atividade, e isso deve ser respeitado imediatamente.',
                alternativas: [
                    { texto: 'Sim, a qualquer momento, inclusive durante a atividade', correta: true },
                    { texto: 'Não, o "sim" vale até o fim da relação', correta: false },
                    { texto: 'Só se houver um motivo considerado justo', correta: false },
                    { texto: 'Só em relacionamentos que ainda não são sérios', correta: false },
                ],
            },
            {
                conteudoSlug: 'o-que-e-consentimento',
                enunciado: 'O silêncio ou a ausência de reação podem ser entendidos como consentimento?',
                explicacao:
                    'Nunca. Silêncio, ausência de reação, sono, inconsciência ou efeito de substâncias jamais podem ser interpretados como concordância.',
                alternativas: [
                    { texto: 'Nunca; consentimento precisa ser uma permissão clara e voluntária', correta: true },
                    { texto: 'Sim, quem não diz não está concordando', correta: false },
                    { texto: 'Sim, quando o casal já tem intimidade', correta: false },
                    { texto: 'Depende de quanto tempo dura o relacionamento', correta: false },
                ],
            },
            {
                conteudoSlug: 'sinais-de-um-relacionamento-saudavel',
                enunciado: 'Qual atitude demonstra confiança em um relacionamento saudável?',
                explicacao:
                    'Confiança é cada pessoa manter sua individualidade, sem vigilância constante de celular, localização ou explicações sobre cada momento do dia.',
                alternativas: [
                    { texto: 'Cada um mantém sua individualidade, sem vigiar celular ou localização', correta: true },
                    { texto: 'Compartilhar todas as senhas para provar que não há segredos', correta: false },
                    { texto: 'Checar a localização do outro várias vezes ao dia', correta: false },
                    { texto: 'Cobrar explicações sobre cada pessoa com quem o outro conversa', correta: false },
                ],
            },
            {
                conteudoSlug: 'como-identificar-relacionamentos-abusivos',
                enunciado: 'Controle de roupas e amizades, ciúme constante e isolamento da família são o quê?',
                explicacao:
                    'São sinais de alerta de violência no relacionamento. Costumam ser apresentados como "prova de amor" ou preocupação, mas são formas de controle.',
                alternativas: [
                    { texto: 'Sinais de alerta de um relacionamento abusivo', correta: true },
                    { texto: 'Prova de que a pessoa ama muito', correta: false },
                    { texto: 'Uma fase normal de todo namoro', correta: false },
                    { texto: 'Cuidado excessivo, mas inofensivo', correta: false },
                ],
            },
        ],
    },
    {
        categoriaSlug: 'planejamento-familiar',
        titulo: 'Planejamento familiar',
        descricao: 'Cinco perguntas sobre os artigos desta categoria.',
        questoes: [
            {
                conteudoSlug: 'metodos-contraceptivos',
                enunciado: 'O que o Ministério da Saúde chama de "dupla proteção"?',
                explicacao:
                    'Dupla proteção é associar um método contraceptivo de sua escolha ao preservativo, porque só o preservativo protege também contra ISTs.',
                alternativas: [
                    { texto: 'Associar um método contraceptivo de sua escolha ao preservativo', correta: true },
                    { texto: 'Usar duas pílulas anticoncepcionais por dia', correta: false },
                    { texto: 'Usar duas camisinhas ao mesmo tempo', correta: false },
                    { texto: 'Combinar DIU de cobre com DIU hormonal', correta: false },
                ],
            },
            {
                conteudoSlug: 'metodos-contraceptivos',
                enunciado: 'Qual método tem a vantagem exclusiva de proteger também contra ISTs?',
                explicacao:
                    'Apenas os preservativos (externo e interno) protegem ao mesmo tempo contra gravidez não planejada e contra ISTs. Eles são distribuídos gratuitamente nas unidades de saúde.',
                alternativas: [
                    { texto: 'Os preservativos masculino/externo e feminino/interno', correta: true },
                    { texto: 'O implante subdérmico', correta: false },
                    { texto: 'O injetável trimestral', correta: false },
                    { texto: 'A minipílula', correta: false },
                ],
            },
            {
                conteudoSlug: 'diu-o-que-e-e-como-funciona',
                enunciado: 'Como o DIU de cobre evita a gravidez?',
                explicacao:
                    'O DIU de cobre não tem hormônios: o cobre provoca uma reação local no útero que danifica os espermatozoides e dificulta sua movimentação, impedindo a fecundação.',
                alternativas: [
                    { texto: 'Sem hormônios: o cobre danifica os espermatozoides e impede a fecundação', correta: true },
                    { texto: 'Liberando estrogênio na corrente sanguínea', correta: false },
                    { texto: 'Bloqueando fisicamente a entrada do útero como uma barreira', correta: false },
                    { texto: 'Interrompendo a produção de óvulos de forma definitiva', correta: false },
                ],
            },
            {
                conteudoSlug: 'mitos-e-verdades-sobre-a-pilula',
                enunciado: 'Quem toma pílula anticoncepcional está protegido contra ISTs?',
                explicacao:
                    'Não. A pílula age apenas sobre a possibilidade de gravidez e não oferece barreira contra HIV, sífilis, HPV ou hepatites. Proteção contra IST vem do preservativo — por isso a recomendação de dupla proteção.',
                alternativas: [
                    { texto: 'Não; a pílula não protege contra IST, só o preservativo protege', correta: true },
                    { texto: 'Sim, protege contra todas as ISTs', correta: false },
                    { texto: 'Sim, desde que tomada sem nenhum esquecimento', correta: false },
                    { texto: 'Protege apenas contra o HIV', correta: false },
                ],
            },
            {
                conteudoSlug: 'diu-o-que-e-e-como-funciona',
                enunciado: 'Quem nunca engravidou pode usar DIU?',
                explicacao:
                    'Pode. O DIU é indicado para mulheres em qualquer momento da vida reprodutiva, inclusive quem nunca engravidou, e tem eficácia acima de 99%.',
                alternativas: [
                    { texto: 'Sim, pode ser usado em qualquer momento da vida reprodutiva', correta: true },
                    { texto: 'Não, é indicado apenas após o primeiro filho', correta: false },
                    { texto: 'Somente depois dos 35 anos', correta: false },
                    { texto: 'Somente logo após um parto', correta: false },
                ],
            },
        ],
    },
    {
        categoriaSlug: 'prevencao-ists',
        titulo: 'Prevenção e ISTs',
        descricao: 'Cinco perguntas sobre os artigos desta categoria.',
        questoes: [
            {
                conteudoSlug: 'o-que-sao-ists',
                enunciado: 'Por que desde 2016 o Ministério da Saúde usa "IST" no lugar de "DST"?',
                explicacao:
                    'Porque a pessoa pode estar infectada e transmitir o agente causador sem apresentar nenhum sintoma — "infecção" é mais preciso do que "doença" nesses casos.',
                alternativas: [
                    { texto: 'Porque é possível estar infectado e transmitir mesmo sem sintomas', correta: true },
                    { texto: 'Porque as doenças mudaram de nome em todo o mundo', correta: false },
                    { texto: 'Porque hoje todas elas têm cura', correta: false },
                    { texto: 'Porque deixaram de ser transmitidas por via sexual', correta: false },
                ],
            },
            {
                conteudoSlug: 'o-que-sao-ists',
                enunciado: 'Além da via sexual, como HIV, sífilis e hepatite B também podem ser transmitidos?',
                explicacao:
                    'Pela transmissão vertical: da pessoa gestante para o bebê durante a gestação, o parto ou a amamentação.',
                alternativas: [
                    {
                        texto: 'De forma vertical, da gestante para o bebê na gestação, parto ou amamentação',
                        correta: true,
                    },
                    { texto: 'Pelo compartilhamento de talheres e copos', correta: false },
                    { texto: 'Pelo assento do vaso sanitário', correta: false },
                    { texto: 'Por picada de inseto', correta: false },
                ],
            },
            {
                conteudoSlug: 'uso-correto-do-preservativo',
                enunciado: 'Que tipo de lubrificante pode ser usado junto com a camisinha?',
                explicacao:
                    'Somente lubrificantes à base de água ou de silicone. Vaselina, óleos e cremes danificam a borracha e podem romper o preservativo.',
                alternativas: [
                    { texto: 'Apenas os à base de água ou de silicone', correta: true },
                    { texto: 'Vaselina', correta: false },
                    { texto: 'Óleo de cozinha ou óleo corporal', correta: false },
                    { texto: 'Creme hidratante comum', correta: false },
                ],
            },
            {
                conteudoSlug: 'uso-correto-do-preservativo',
                enunciado: 'Em que momento a camisinha masculina deve ser colocada?',
                explicacao:
                    'Com o pênis já ereto e antes de qualquer contato genital, porque o líquido pré-ejaculatório também pode transmitir ISTs.',
                alternativas: [
                    { texto: 'Com o pênis ereto e antes de qualquer contato genital', correta: true },
                    { texto: 'Apenas pouco antes da ejaculação', correta: false },
                    { texto: 'Depois do início da penetração', correta: false },
                    { texto: 'Tanto faz, desde que seja durante a relação', correta: false },
                ],
            },
            {
                conteudoSlug: 'hiv-transmissao-tratamento-e-prep',
                enunciado: 'O que significa "Indetectável = Intransmissível" (I=I)?',
                explicacao:
                    'O tratamento antirretroviral tomado corretamente reduz o vírus no sangue a níveis indetectáveis, o que preserva a saúde da pessoa e elimina praticamente o risco de transmissão sexual.',
                alternativas: [
                    {
                        texto: 'Com o tratamento correto, o vírus fica indetectável e praticamente não é transmitido',
                        correta: true,
                    },
                    { texto: 'Que a pessoa está curada do HIV', correta: false },
                    { texto: 'Que o exame de HIV deu resultado errado', correta: false },
                    { texto: 'Que não é mais preciso tomar o medicamento', correta: false },
                ],
            },
        ],
    },
    {
        categoriaSlug: 'puberdade-adolescencia',
        titulo: 'Puberdade e adolescência',
        descricao: 'Quatro perguntas sobre os artigos desta categoria.',
        questoes: [
            {
                conteudoSlug: 'mudancas-do-corpo-na-puberdade',
                enunciado:
                    'Segundo a Sociedade Brasileira de Pediatria, em corpos com ovários a puberdade costuma começar entre que idades?',
                explicacao:
                    'Entre 8 e 13 anos em corpos com ovários, e entre 9 e 14 anos em corpos com testículos. Cada corpo segue o próprio ritmo.',
                alternativas: [
                    { texto: 'Entre 8 e 13 anos', correta: true },
                    { texto: 'Entre 5 e 7 anos', correta: false },
                    { texto: 'Entre 14 e 18 anos', correta: false },
                    { texto: 'Somente depois dos 15 anos', correta: false },
                ],
            },
            {
                conteudoSlug: 'mudancas-do-corpo-na-puberdade',
                enunciado: 'Em corpos que menstruam, qual costuma ser o primeiro sinal da puberdade?',
                explicacao:
                    'A sequência mais comum começa pelo crescimento das mamas (telarca), seguido dos pelos pubianos e axilares, do estirão de crescimento e, por último, da primeira menstruação.',
                alternativas: [
                    { texto: 'O crescimento das mamas, chamado de telarca', correta: true },
                    { texto: 'A primeira menstruação', correta: false },
                    { texto: 'O estirão de crescimento em altura', correta: false },
                    { texto: 'O surgimento de acne', correta: false },
                ],
            },
            {
                conteudoSlug: 'primeira-menstruacao-o-que-esperar',
                enunciado: 'Como se chama a primeira menstruação?',
                explicacao:
                    'Menarca. Segundo a Sociedade Brasileira de Pediatria, costuma acontecer por volta dos 12 anos e meio, sendo normal entre 9 e 16 anos.',
                alternativas: [
                    { texto: 'Menarca', correta: true },
                    { texto: 'Telarca', correta: false },
                    { texto: 'Menopausa', correta: false },
                    { texto: 'Ovulação', correta: false },
                ],
            },
            {
                conteudoSlug: 'primeira-menstruacao-o-que-esperar',
                enunciado: 'Ciclos irregulares nos dois primeiros anos após a menarca indicam o quê?',
                explicacao:
                    'São bastante comuns nesse período, porque o sistema hormonal ainda está amadurecendo. Costumam se ajustar sozinhos, sem precisar de tratamento.',
                alternativas: [
                    { texto: 'Nada de errado: são comuns porque o sistema hormonal ainda amadurece', correta: true },
                    { texto: 'Que existe um problema hormonal grave', correta: false },
                    { texto: 'Que é preciso iniciar tratamento imediatamente', correta: false },
                    { texto: 'Que a pessoa não poderá engravidar no futuro', correta: false },
                ],
            },
        ],
    },
    {
        categoriaSlug: 'saude-reprodutiva',
        titulo: 'Saúde reprodutiva',
        descricao: 'Quatro perguntas sobre os artigos desta categoria.',
        questoes: [
            {
                conteudoSlug: 'pre-natal-por-que-e-importante',
                enunciado: 'Quantas consultas de pré-natal o Ministério da Saúde recomenda no mínimo?',
                explicacao:
                    'No mínimo seis consultas: idealmente uma no primeiro trimestre, duas no segundo e três no terceiro.',
                alternativas: [
                    { texto: 'Seis', correta: true },
                    { texto: 'Duas', correta: false },
                    { texto: 'Doze', correta: false },
                    { texto: 'Uma por gestação', correta: false },
                ],
            },
            {
                conteudoSlug: 'pre-natal-por-que-e-importante',
                enunciado: 'A partir da 36ª semana de gestação, com que frequência costumam ser as consultas?',
                explicacao:
                    'Mensais até a 28ª semana, quinzenais entre a 28ª e a 36ª, e semanais da 36ª semana até o parto — o monitoramento se intensifica na reta final.',
                alternativas: [
                    { texto: 'Semanais', correta: true },
                    { texto: 'Mensais', correta: false },
                    { texto: 'Quinzenais', correta: false },
                    { texto: 'Somente se houver sintomas', correta: false },
                ],
            },
            {
                conteudoSlug: 'ciclo-menstrual-como-funciona',
                enunciado: 'A contagem do ciclo menstrual começa em qual dia?',
                explicacao:
                    'O ciclo é contado do primeiro dia de sangramento (dia 1) até o dia anterior ao início da próxima menstruação.',
                alternativas: [
                    { texto: 'No primeiro dia do sangramento', correta: true },
                    { texto: 'No último dia do sangramento', correta: false },
                    { texto: 'No dia da ovulação', correta: false },
                    { texto: 'Sempre no primeiro dia de cada mês', correta: false },
                ],
            },
            {
                conteudoSlug: 'ciclo-menstrual-como-funciona',
                enunciado: 'Qual hormônio desencadeia a ovulação?',
                explicacao:
                    'O pico do hormônio luteinizante (LH), que ocorre quando o estrogênio atinge seu nível máximo, desencadeia a liberação do óvulo maduro.',
                alternativas: [
                    { texto: 'O hormônio luteinizante (LH), no chamado pico de LH', correta: true },
                    { texto: 'A progesterona', correta: false },
                    { texto: 'O hormônio folículo-estimulante (FSH)', correta: false },
                    { texto: 'A insulina', correta: false },
                ],
            },
        ],
    },
    {
        categoriaSlug: 'saude-sexual',
        titulo: 'Saúde sexual',
        descricao: 'Quatro perguntas sobre os artigos desta categoria.',
        questoes: [
            {
                conteudoSlug: 'testagem-para-ists-quando-e-como-fazer',
                enunciado: 'Em quanto tempo o teste rápido oferecido pelo SUS dá o resultado?',
                explicacao:
                    'Em até 30 minutos, a partir de uma amostra de sangue colhida na ponta do dedo — o que agiliza o encaminhamento para tratamento quando necessário.',
                alternativas: [
                    { texto: 'Em até 30 minutos', correta: true },
                    { texto: 'Em até 7 dias', correta: false },
                    { texto: 'Em até 30 dias', correta: false },
                    { texto: 'Somente na consulta seguinte', correta: false },
                ],
            },
            {
                conteudoSlug: 'testagem-para-ists-quando-e-como-fazer',
                enunciado: 'É preciso ter sintomas para procurar a testagem de ISTs no SUS?',
                explicacao:
                    'Não. Qualquer pessoa com vida sexual ativa pode buscar a testagem como cuidado preventivo de rotina, de forma gratuita e sigilosa, na UBS ou no CTA.',
                alternativas: [
                    { texto: 'Não; qualquer pessoa com vida sexual ativa pode buscar a testagem', correta: true },
                    { texto: 'Sim, só com sintomas visíveis', correta: false },
                    { texto: 'Sim, é preciso encaminhamento médico', correta: false },
                    { texto: 'Só quem tem mais de 40 anos', correta: false },
                ],
            },
            {
                conteudoSlug: 'saude-sexual-e-bem-estar-emocional',
                enunciado: 'Como a Organização Mundial da Saúde (OMS) define saúde sexual?',
                explicacao:
                    'Como um estado de bem-estar físico, emocional, mental e social relacionado à sexualidade — e não meramente a ausência de doença, disfunção ou enfermidade.',
                alternativas: [
                    {
                        texto: 'Bem-estar físico, emocional, mental e social, e não apenas ausência de doença',
                        correta: true,
                    },
                    { texto: 'A simples ausência de ISTs', correta: false },
                    { texto: 'O uso correto de métodos contraceptivos', correta: false },
                    { texto: 'A realização de exames periódicos', correta: false },
                ],
            },
            {
                conteudoSlug: 'saude-sexual-e-bem-estar-emocional',
                enunciado: 'Segundo a OMS/OPAS, como devem ser as experiências sexuais em uma vida sexual saudável?',
                explicacao:
                    'Prazerosas e seguras, livres de coerção, discriminação e violência — o que exige uma abordagem positiva e respeitosa da sexualidade.',
                alternativas: [
                    { texto: 'Prazerosas e seguras, livres de coerção, discriminação e violência', correta: true },
                    { texto: 'Restritas ao objetivo de ter filhos', correta: false },
                    { texto: 'Guiadas apenas pela vontade de um dos parceiros', correta: false },
                    { texto: 'Sempre precedidas de exames laboratoriais', correta: false },
                ],
            },
        ],
    },
];

function seedQuizzesPorCategoria() {
    const categoriaIdPorSlug = Object.fromEntries(
        db.prepare('SELECT id, slug FROM categoria').all().map((c) => [c.slug, c.id])
    );
    const conteudoIdPorSlug = Object.fromEntries(
        db.prepare('SELECT id, slug FROM conteudo').all().map((c) => [c.slug, c.id])
    );

    const buscarQuizDaCategoria = db.prepare('SELECT id FROM quiz WHERE categoria_id = ?');
    const jaTemQuestao = db.prepare('SELECT 1 FROM questao WHERE quiz_id = ? AND enunciado = ?');
    const contarQuestoes = db.prepare('SELECT COUNT(*) AS total FROM questao WHERE quiz_id = ?');
    const inserirQuiz = db.prepare('INSERT INTO quiz (categoria_id, titulo, descricao) VALUES (?, ?, ?)');
    const inserirQuestao = db.prepare(
        'INSERT INTO questao (quiz_id, conteudo_id, enunciado, explicacao, ordem) VALUES (?, ?, ?, ?, ?)'
    );
    const inserirAlternativa = db.prepare('INSERT INTO alternativa (questao_id, texto, correta) VALUES (?, ?, ?)');

    let quizzesCriados = 0;
    let questoesInseridas = 0;

    const transacao = db.transaction((quizzes) => {
        quizzes.forEach((quiz) => {
            const categoriaId = categoriaIdPorSlug[quiz.categoriaSlug];
            if (!categoriaId) return;

            // Aditivo: reaproveita o quiz que a categoria ja tiver, em vez de pular a
            // categoria inteira. Assim uma questao nova (de um artigo novo, por exemplo)
            // chega em quem ja rodou o seed antes.
            const existente = buscarQuizDaCategoria.get(categoriaId);
            let quizId;
            if (existente) {
                quizId = existente.id;
            } else {
                quizId = inserirQuiz.run(categoriaId, quiz.titulo, quiz.descricao).lastInsertRowid;
                quizzesCriados += 1;
            }

            quiz.questoes.forEach((questao) => {
                // O enunciado identifica a questao: se ja existe neste quiz, nao duplica.
                if (jaTemQuestao.get(quizId, questao.enunciado)) return;

                const ordem = contarQuestoes.get(quizId).total + 1;
                const questaoId = inserirQuestao.run(
                    quizId,
                    conteudoIdPorSlug[questao.conteudoSlug] || null,
                    questao.enunciado,
                    questao.explicacao,
                    ordem
                ).lastInsertRowid;
                questao.alternativas.forEach((alternativa) => {
                    inserirAlternativa.run(questaoId, alternativa.texto, alternativa.correta ? 1 : 0);
                });
                questoesInseridas += 1;
            });
        });
    });

    transacao(QUIZZES_POR_CATEGORIA);
    console.log(`Quizzes por categoria criados: ${quizzesCriados}; questoes inseridas: ${questoesInseridas}`);
}

const GLOSSARIO = [
    { termo: 'IST', definicao: 'Infecção Sexualmente Transmissível, transmitida principalmente por contato sexual.' },
    { termo: 'Preservativo', definicao: 'Método de barreira que previne ISTs e gravidez não planejada.' },
    { termo: 'Consentimento', definicao: 'Acordo claro, livre, informado e contínuo entre as pessoas envolvidas em uma relação.' },
    { termo: 'Puberdade', definicao: 'Período de transformações físicas e hormonais que marca a transição da infância para a vida adulta.' },
    { termo: 'Pré-natal', definicao: 'Acompanhamento médico realizado durante a gestação.' },
    { termo: 'Método contraceptivo', definicao: 'Recurso utilizado para evitar uma gravidez não planejada.' },
    { termo: 'HIV', definicao: 'Vírus da Imunodeficiência Humana, transmitido principalmente por via sexual e sanguínea.' },
    { termo: 'Planejamento familiar', definicao: 'Conjunto de ações que ajudam a pessoa ou casal a decidir sobre ter ou não filhos e quando.' },
    { termo: 'Ciclo menstrual', definicao: 'Conjunto de mudanças hormonais e físicas que ocorrem no corpo da mulher, em média a cada 28 dias.' },
    { termo: 'Testagem', definicao: 'Exame realizado para identificar a presença de uma IST no organismo.' },
];

function seedGlossario() {
    if (!tabelaVazia('glossario')) return;
    const inserir = db.prepare('INSERT INTO glossario (termo, definicao) VALUES (?, ?)');
    const transacao = db.transaction((termos) => {
        termos.forEach((g) => inserir.run(g.termo, g.definicao));
    });
    transacao(GLOSSARIO);
    console.log(`Termos de glossario inseridos: ${GLOSSARIO.length}`);
}

function seedAdmin() {
    if (!tabelaVazia('usuario')) return;

    const nome = 'Administrador';
    const email = process.env.ADMIN_EMAIL;
    const senha = process.env.ADMIN_PASSWORD;

    if (!email || !senha) {
        console.warn('ADMIN_EMAIL/ADMIN_PASSWORD não definidos no .env — usuário admin não foi criado.');
        return;
    }

    const senhaHash = bcrypt.hashSync(senha, 10);
    db.prepare('INSERT INTO usuario (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)').run(
        nome,
        email,
        senhaHash,
        'admin'
    );
    console.log(`Usuario admin criado: ${email}`);
}

seedCategorias();
seedConteudos();
seedQuizzes();
seedQuizzesPorCategoria();
seedGlossario();
seedAdmin();

db.close();
console.log('Seed concluido:', dbPath);
