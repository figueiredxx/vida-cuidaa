// Cobre a trilha por categoria: a pagina lista os artigos publicados daquela
// categoria e o quiz correspondente, que so e liberado depois da leitura.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepararBancoTemporario } = require('./ajuda/banco-teste');

const db = prepararBancoTemporario();
const categoriaService = require('../src/services/categoria.service');

let contador = 0;

function criarCategoria(nome) {
    contador += 1;
    const slug = 'cat-' + contador;
    const id = db.prepare('INSERT INTO categoria (nome, slug, descricao) VALUES (?, ?, ?)').run(nome, slug, 'descrição')
        .lastInsertRowid;
    return { id, slug, nome };
}

function criarArtigo(categoriaId, titulo, publicado = 1) {
    contador += 1;
    const slug = 'artigo-' + contador;
    db.prepare(
        `INSERT INTO conteudo (categoria_id, titulo, slug, resumo, corpo_html, fontes, publicado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(categoriaId, titulo, slug, 'resumo', '<p>corpo</p>', 'Ministério da Saúde', publicado);
    return slug;
}

function criarQuiz(categoriaId, titulo) {
    return db.prepare('INSERT INTO quiz (categoria_id, titulo, descricao) VALUES (?, ?, ?)').run(
        categoriaId,
        titulo,
        'descrição'
    ).lastInsertRowid;
}

test('buscarTrilha devolve null para categoria inexistente', () => {
    assert.equal(categoriaService.buscarTrilha('categoria-que-nao-existe'), null);
});

test('buscarTrilha lista apenas os artigos publicados da categoria', () => {
    const categoria = criarCategoria('Prevenção');
    criarArtigo(categoria.id, 'Publicado A');
    criarArtigo(categoria.id, 'Rascunho', 0);
    const outra = criarCategoria('Outra');
    criarArtigo(outra.id, 'De outra categoria');

    const trilha = categoriaService.buscarTrilha(categoria.slug);

    assert.deepEqual(
        trilha.artigos.map((a) => a.titulo),
        ['Publicado A']
    );
    assert.equal(trilha.totalArtigos, 1);
});

test('buscarTrilha devolve o quiz da categoria', () => {
    const categoria = criarCategoria('Com quiz');
    criarArtigo(categoria.id, 'Artigo');
    const quizId = criarQuiz(categoria.id, 'Quiz da categoria');

    const trilha = categoriaService.buscarTrilha(categoria.slug);

    assert.equal(trilha.quiz.id, quizId);
    assert.equal(trilha.quiz.titulo, 'Quiz da categoria');
});

test('buscarTrilha devolve quiz nulo quando a categoria ainda não tem quiz', () => {
    const categoria = criarCategoria('Sem quiz');
    criarArtigo(categoria.id, 'Artigo');

    assert.equal(categoriaService.buscarTrilha(categoria.slug).quiz, null);
});

test('listarTrilhas conta apenas artigos publicados de cada categoria', () => {
    const categoria = criarCategoria('Contagem');
    criarArtigo(categoria.id, 'Publicado 1');
    criarArtigo(categoria.id, 'Publicado 2');
    criarArtigo(categoria.id, 'Rascunho', 0);

    const trilha = categoriaService.listarTrilhas().find((c) => c.slug === categoria.slug);

    assert.equal(trilha.totalArtigos, 2);
});

test('listarTrilhas inclui categoria sem nenhum artigo publicado, com total zero', () => {
    const categoria = criarCategoria('Vazia');

    const trilha = categoriaService.listarTrilhas().find((c) => c.slug === categoria.slug);

    assert.equal(trilha.totalArtigos, 0);
});

test('buscarTrilha ordena os artigos do mais antigo para o mais novo (ordem de leitura)', () => {
    const categoria = criarCategoria('Ordem');
    criarArtigo(categoria.id, 'Primeiro');
    criarArtigo(categoria.id, 'Segundo');
    criarArtigo(categoria.id, 'Terceiro');

    const trilha = categoriaService.buscarTrilha(categoria.slug);

    assert.deepEqual(
        trilha.artigos.map((a) => a.titulo),
        ['Primeiro', 'Segundo', 'Terceiro']
    );
});

test('listarTrilhas expõe os slugs dos artigos publicados, para o progresso ser calculado no navegador', () => {
    const categoria = criarCategoria('Com slugs');
    const slugPublicado = criarArtigo(categoria.id, 'Publicado');
    criarArtigo(categoria.id, 'Rascunho', 0);

    const trilha = categoriaService.listarTrilhas().find((c) => c.slug === categoria.slug);

    assert.deepEqual(trilha.slugsArtigos, [slugPublicado]);
});
