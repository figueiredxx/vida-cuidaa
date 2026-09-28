// Utilitario de linha de comando para o quadro do Trello do TCC.
//
// Nao faz parte da aplicacao: e' uma ferramenta de apoio ao trabalho da dupla,
// como o build-estatico.js. Usa apenas o fetch nativo do Node, sem dependencia
// nova, e le as credenciais do .env (que nunca vai para o Git).
//
// Uso:
//   node scripts/trello.js quadros
//   node scripts/trello.js colunas <quadroId>
//   node scripts/trello.js cards <quadroId>
//   node scripts/trello.js criar <colunaId> "<titulo>" ["<descricao>" | @arquivo.md]
//   node scripts/trello.js mover <cardId> <colunaId>
//   node scripts/trello.js comentar <cardId> "<texto>" | @arquivo.md
//   node scripts/trello.js arquivar <cardId>
require('dotenv').config();

const fs = require('fs');

const API = 'https://api.trello.com/1';

const chave = process.env.TRELLO_API_KEY;
const token = process.env.TRELLO_TOKEN;

if (!chave || !token) {
    console.error(
        'Faltam TRELLO_API_KEY e/ou TRELLO_TOKEN no .env.\n' +
            'Veja como obter em README.md (secao "Quadro do Trello").'
    );
    process.exit(1);
}

// Texto longo (descricao de card, comentario) e incomodo de passar por argumento
// no terminal: crase, aspas e quebra de linha atrapalham. Prefixar com @ le de um
// arquivo, como o curl faz.
function lerTexto(valor) {
    if (typeof valor === 'string' && valor.startsWith('@')) {
        return fs.readFileSync(valor.slice(1), 'utf8');
    }
    return valor;
}

// Toda chamada leva key e token na query string, como a API do Trello exige.
async function chamar(caminho, { metodo = 'GET', params = {} } = {}) {
    const url = new URL(API + caminho);
    url.searchParams.set('key', chave);
    url.searchParams.set('token', token);
    Object.entries(params).forEach(([nome, valor]) => {
        if (valor !== undefined && valor !== null) url.searchParams.set(nome, valor);
    });

    const resposta = await fetch(url, { method: metodo });
    const corpo = await resposta.text();

    if (!resposta.ok) {
        throw new Error(`Trello respondeu ${resposta.status}: ${corpo}`);
    }

    // Algumas acoes (como arquivar) devolvem corpo vazio.
    return corpo ? JSON.parse(corpo) : null;
}

async function listarQuadros() {
    const quadros = await chamar('/members/me/boards', { params: { fields: 'name,url,closed' } });
    quadros
        .filter((q) => !q.closed)
        .forEach((q) => {
            console.log(`${q.id}  ${q.name}`);
            console.log(`${' '.repeat(q.id.length)}  ${q.url}\n`);
        });
}

async function listarColunas(quadroId) {
    const colunas = await chamar(`/boards/${quadroId}/lists`, { params: { fields: 'name' } });
    colunas.forEach((c) => console.log(`${c.id}  ${c.name}`));
}

async function listarCards(quadroId) {
    const colunas = await chamar(`/boards/${quadroId}/lists`, { params: { fields: 'name' } });
    const cards = await chamar(`/boards/${quadroId}/cards`, {
        params: { fields: 'name,desc,idList,labels,url,due' },
    });

    colunas.forEach((coluna) => {
        const daColuna = cards.filter((card) => card.idList === coluna.id);
        console.log(`\n## ${coluna.name} (${daColuna.length})`);
        daColuna.forEach((card) => {
            const etiquetas = card.labels.map((e) => e.name || e.color).join(', ');
            console.log(`- [${card.id}] ${card.name}${etiquetas ? `  {${etiquetas}}` : ''}`);
            if (card.desc) {
                const resumo = card.desc.replace(/\s+/g, ' ').trim();
                console.log(`      ${resumo.slice(0, 120)}${resumo.length > 120 ? '...' : ''}`);
            }
        });
    });
}

async function criarCard(colunaId, titulo, descricao) {
    const card = await chamar('/cards', {
        metodo: 'POST',
        params: { idList: colunaId, name: titulo, desc: lerTexto(descricao) || '' },
    });
    console.log(`Card criado: ${card.id}`);
    console.log(card.url);
}

async function moverCard(cardId, colunaId) {
    await chamar(`/cards/${cardId}`, { metodo: 'PUT', params: { idList: colunaId } });
    console.log(`Card ${cardId} movido.`);
}

async function comentar(cardId, texto) {
    await chamar(`/cards/${cardId}/actions/comments`, { metodo: 'POST', params: { text: lerTexto(texto) } });
    console.log(`Comentario adicionado ao card ${cardId}.`);
}

async function arquivar(cardId) {
    await chamar(`/cards/${cardId}`, { metodo: 'PUT', params: { closed: 'true' } });
    console.log(`Card ${cardId} arquivado.`);
}

const [comando, ...args] = process.argv.slice(2);

const COMANDOS = {
    quadros: () => listarQuadros(),
    colunas: () => listarColunas(args[0]),
    cards: () => listarCards(args[0]),
    criar: () => criarCard(args[0], args[1], args[2]),
    mover: () => moverCard(args[0], args[1]),
    comentar: () => comentar(args[0], args[1]),
    arquivar: () => arquivar(args[0]),
};

if (!COMANDOS[comando]) {
    console.error('Comandos: quadros | colunas | cards | criar | mover | comentar | arquivar');
    process.exit(1);
}

COMANDOS[comando]().catch((erro) => {
    console.error(erro.message);
    process.exit(1);
});
