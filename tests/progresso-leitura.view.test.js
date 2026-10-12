// Cobre o RF16: o usuario pode apagar integralmente o historico de leitura.
//
// O historico vive so no localStorage do navegador (RN10), entao o apagamento
// acontece no cliente. O que da' para garantir aqui e' o contrato da tela: o
// controle existe, nasce escondido e aponta para o mesmo bloco de progresso que
// o progresso-leitura.js manipula. Sem isso, o botao some num ajuste de visual e
// o requisito volta a ficar descoberto sem ninguem perceber.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const ejs = require('ejs');

const PARTIAL = path.join(__dirname, '..', 'src', 'views', 'partials', 'progresso-leitura.ejs');

function renderizar(locals = {}) {
    return ejs.renderFile(PARTIAL, { total: 10, conteudoAtual: null, permitirApagar: false, ...locals }, { async: false });
}

test('a listagem oferece o controle para apagar o historico', async () => {
    const html = await renderizar({ permitirApagar: true });

    assert.match(html, /id="apagar-historico"/);
    assert.match(html, /Apagar meu histórico de leitura/);
});

test('o controle nasce escondido, para nao aparecer a quem nunca leu nada', async () => {
    const html = await renderizar({ permitirApagar: true });

    assert.match(html, /id="apagar-historico"[^>]*\shidden/);
});

// Na pagina do artigo o proprio carregamento marca o conteudo como lido. Oferecer
// o apagamento ali faria o historico voltar no recarregamento seguinte.
test('a pagina de um artigo nao oferece o controle', async () => {
    const html = await renderizar({ conteudoAtual: 'camisinha', permitirApagar: false });

    assert.ok(!html.includes('id="apagar-historico"'), 'o controle aparece onde nao deveria');
    assert.match(html, /data-conteudo-atual="camisinha"/);
});

test('o bloco anuncia o resultado do apagamento a quem usa leitor de tela', async () => {
    const html = await renderizar({ permitirApagar: true });

    assert.match(html, /id="progresso-leitura-aviso"/);
    assert.match(html, /role="status"/);
});

test('o bloco mantem o contrato que o progresso-leitura.js espera', async () => {
    const html = await renderizar({ total: 7 });

    assert.match(html, /id="progresso-leitura"/);
    assert.match(html, /data-total="7"/);
    assert.match(html, /id="progresso-leitura-texto"/);
    assert.match(html, /id="progresso-leitura-barra"/);
    assert.match(html, /id="progresso-leitura-preenchimento"/);
});
