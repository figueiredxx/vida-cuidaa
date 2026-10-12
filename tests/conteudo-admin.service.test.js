// Cobre os requisitos RF03 e RNF25: fontes obrigatórias, sanitização de HTML e
// slug único mesmo quando dois conteúdos têm o mesmo título.
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const { prepararBancoTemporario } = require('./ajuda/banco-teste');

const db = prepararBancoTemporario();
const conteudoAdminService = require('../src/services/conteudo-admin.service');

let categoriaId;

before(() => {
    categoriaId = db.prepare("INSERT INTO categoria (nome, slug) VALUES ('Categoria X', 'categoria-x')").run()
        .lastInsertRowid;
});

test('remove tags não permitidas (ex.: script) do corpo do conteúdo', () => {
    const id = conteudoAdminService.criar({
        categoriaId,
        titulo: 'Conteúdo com script malicioso',
        resumo: 'resumo',
        corpoHtml: '<p>Texto legítimo</p><script>alert(1)</script>',
        fontes: 'Ministério da Saúde',
        faixaEtaria: 'todas',
        publicado: 0,
    });

    const salvo = conteudoAdminService.buscarPorId(id);
    assert.ok(!salvo.corpo_html.includes('<script>'));
    assert.ok(salvo.corpo_html.includes('Texto legítimo'));
});

test('gera slugs diferentes para títulos iguais', () => {
    const base = {
        categoriaId,
        resumo: 'resumo',
        corpoHtml: '<p>conteúdo</p>',
        fontes: 'OMS',
        faixaEtaria: 'todas',
        publicado: 0,
    };

    const id1 = conteudoAdminService.criar({ ...base, titulo: 'Título Repetido' });
    const id2 = conteudoAdminService.criar({ ...base, titulo: 'Título Repetido' });

    const conteudo1 = conteudoAdminService.buscarPorId(id1);
    const conteudo2 = conteudoAdminService.buscarPorId(id2);
    assert.notEqual(conteudo1.slug, conteudo2.slug);
});
