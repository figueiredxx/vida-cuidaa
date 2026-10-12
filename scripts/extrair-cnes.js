// Extrai os estabelecimentos de saude de Manaus da API de dados abertos do
// Ministerio da Saude e grava em database/cnes-manaus.json.
//
// Nao faz parte da aplicacao: e' uma ferramenta de apoio, como o build-estatico.js.
// O arquivo gerado vai para o Git de proposito — a apresentacao nao pode depender
// de a API do Ministerio estar no ar na hora da banca.
//
// Uso:
//   node scripts/extrair-cnes.js
//
// Depois de gerar o arquivo, carregue no banco com: npm run importar:cnes
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://apidadosabertos.saude.gov.br';
const API = API_BASE + '/cnes/estabelecimentos';

// A listagem de estabelecimentos devolve so o codigo do tipo de unidade. A
// descricao oficial vem deste outro endpoint, e e' o que a pagina exibe e filtra
// (RF26 e RF27) — melhor que inventar nome para codigo.
const API_TIPOS = API_BASE + '/cnes/tipounidades';

// Manaus no codigo do IBGE.
const MUNICIPIO = '130260';

// A API recusa limit acima de 20, entao paginar por offset e' obrigatorio.
const LIMITE_POR_PAGINA = 20;

// Tipos de estabelecimento que interessam ao visitante procurando atendimento.
// Fora desta lista entram almoxarifado, central de regulacao e afins, que nao
// atendem ao publico.
const TIPOS_UTEIS = [1, 2, 4, 5, 15, 20, 36, 73];

const ARQUIVO_SAIDA = path.join(__dirname, '..', 'database', 'cnes-manaus.json');

// Pausa entre paginas: sao cerca de 85 requisicoes seguidas a um servico publico
// e gratuito, entao vale nao atropelar.
const PAUSA_ENTRE_PAGINAS_MS = 200;
const TENTATIVAS_POR_PAGINA = 3;

function ehUtil(bruto) {
    if (!TIPOS_UTEIS.includes(Number(bruto.codigo_tipo_unidade))) return false;

    const latitude = bruto.latitude_estabelecimento_decimo_grau;
    const longitude = bruto.longitude_estabelecimento_decimo_grau;
    return latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;
}

function normalizar(bruto, descricoesPorTipo = {}) {
    const tipo = Number(bruto.codigo_tipo_unidade);

    return {
        codigo_cnes: String(bruto.codigo_cnes),
        // Boa parte dos estabelecimentos publicos nao preenche o nome fantasia.
        nome: bruto.nome_fantasia || bruto.nome_razao_social,
        logradouro: bruto.endereco_estabelecimento,
        numero: bruto.numero_estabelecimento,
        bairro: bruto.bairro_estabelecimento,
        telefone: bruto.numero_telefone_estabelecimento,
        latitude: bruto.latitude_estabelecimento_decimo_grau,
        longitude: bruto.longitude_estabelecimento_decimo_grau,
        tipo_unidade: tipo,
        tipo_descricao: descricoesPorTipo[tipo] || null,
        atende_sus: bruto.estabelecimento_faz_atendimento_ambulatorial_sus === 'SIM' ? 1 : 0,
        turno_atendimento: bruto.descricao_turno_atendimento,
    };
}

// A API nao informa quantos registros existem no total. A unica forma de saber
// que acabou e' receber uma pagina menor que o limite pedido.
async function coletarPaginas({ limite, buscarPagina }) {
    const itens = [];
    let offset = 0;

    for (;;) {
        const pagina = await buscarPagina(offset);
        itens.push(...pagina);
        if (pagina.length < limite) return itens;
        offset += limite;
    }
}

function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buscarPaginaDaApi(offset) {
    const url = new URL(API);
    url.searchParams.set('codigo_municipio', MUNICIPIO);
    url.searchParams.set('status', '1');
    url.searchParams.set('limit', String(LIMITE_POR_PAGINA));
    url.searchParams.set('offset', String(offset));

    let ultimoErro;
    for (let tentativa = 1; tentativa <= TENTATIVAS_POR_PAGINA; tentativa += 1) {
        try {
            const resposta = await fetch(url);
            if (!resposta.ok) throw new Error(`a API respondeu ${resposta.status}`);

            const corpo = await resposta.json();
            // A API embrulha a lista em uma chave; aceitar array solto deixa o
            // script tolerante a mudanca pequena no formato da resposta.
            return Array.isArray(corpo) ? corpo : corpo.estabelecimentos || [];
        } catch (erro) {
            ultimoErro = erro;
            await esperar(PAUSA_ENTRE_PAGINAS_MS * tentativa);
        }
    }

    throw new Error(`Falha ao buscar o offset ${offset}: ${ultimoErro.message}`);
}

// Percorre a tabela de tipos e guarda so os que interessam.
async function buscarDescricoesDeTipo() {
    const descricoes = {};

    for (let offset = 0; offset < 500; offset += LIMITE_POR_PAGINA) {
        const url = new URL(API_TIPOS);
        url.searchParams.set('limit', String(LIMITE_POR_PAGINA));
        url.searchParams.set('offset', String(offset));

        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error(`a tabela de tipos respondeu ${resposta.status}`);

        const corpo = await resposta.json();
        const lista = corpo.tipos_unidade || [];
        if (!lista.length) break;

        lista.forEach((t) => {
            const codigo = Number(t.codigo_tipo_unidade);
            if (TIPOS_UTEIS.includes(codigo)) descricoes[codigo] = t.descricao_tipo_unidade;
        });

        await esperar(PAUSA_ENTRE_PAGINAS_MS);
    }

    return descricoes;
}

async function extrair() {
    console.log('Buscando a tabela oficial de tipos de unidade...');
    const descricoesPorTipo = await buscarDescricoesDeTipo();
    console.log(`${Object.keys(descricoesPorTipo).length} tipos uteis descritos.`);

    console.log(`Buscando estabelecimentos de Manaus (IBGE ${MUNICIPIO})...`);

    const brutos = await coletarPaginas({
        limite: LIMITE_POR_PAGINA,
        buscarPagina: async (offset) => {
            const pagina = await buscarPaginaDaApi(offset);
            process.stdout.write(`\r  ${offset + pagina.length} registros lidos...`);
            await esperar(PAUSA_ENTRE_PAGINAS_MS);
            return pagina;
        },
    });

    console.log(`\n${brutos.length} estabelecimentos ativos encontrados.`);

    const unidades = brutos.filter(ehUtil).map((b) => normalizar(b, descricoesPorTipo));

    // RN22: a base precisa registrar a data da propria extracao, que a pagina
    // de servicos exibe ao usuario.
    const conteudo = { extraido_em: new Date().toISOString().slice(0, 10), unidades };
    fs.writeFileSync(ARQUIVO_SAIDA, JSON.stringify(conteudo, null, 2) + '\n', 'utf8');

    const tamanhoKb = Math.round(fs.statSync(ARQUIVO_SAIDA).size / 1024);
    console.log(`${unidades.length} unidades uteis gravadas em ${path.relative(process.cwd(), ARQUIVO_SAIDA)} (${tamanhoKb} KB).`);
    console.log('Agora rode: npm run importar:cnes');
}

module.exports = { ehUtil, normalizar, coletarPaginas };

// So executa a extracao quando chamado pela linha de comando, para o arquivo
// poder ser importado pelos testes sem disparar requisicao nenhuma.
if (require.main === module) {
    extrair().catch((erro) => {
        console.error(`\n${erro.message}`);
        process.exit(1);
    });
}
