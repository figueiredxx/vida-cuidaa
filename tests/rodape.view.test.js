// Cobre o RF04: toda tela de conteudo exibe o aviso de finalidade educativa e
// indica canal oficial de orientacao.
//
// O rodape e' um partial incluido em todo layout, entao basta renderizar uma
// pagina para cobrir as demais. O teste existe porque o canal oficial e' uma
// linha facil de perder num ajuste de visual, e a falta dele so apareceria numa
// conferencia de requisitos.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const ejs = require('ejs');

const RODAPE = path.join(__dirname, '..', 'src', 'views', 'partials', 'footer.ejs');

test('o rodape traz o aviso de finalidade educativa', async () => {
    const html = await ejs.renderFile(RODAPE, {}, { async: false });

    assert.match(html, /educativo e não substitui consulta com profissional de saúde/);
});

test('o rodape indica o canal oficial de orientacao', async () => {
    const html = await ejs.renderFile(RODAPE, {}, { async: false });

    assert.match(html, /Disque Saúde/);
    assert.match(html, /136/);
});

test('o numero do canal e discavel no celular', async () => {
    const html = await ejs.renderFile(RODAPE, {}, { async: false });

    assert.match(html, /href="tel:136"/);
});
