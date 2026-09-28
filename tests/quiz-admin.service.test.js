// Cobre o vinculo entre questao e artigo no painel admin: e ele que permite ao
// resultado do quiz indicar qual conteudo o visitante deve revisar.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepararBancoTemporario } = require('./ajuda/banco-teste');

const db = prepararBancoTemporario();
const quizAdminService = require('../src/services/quiz-admin.service');

let contador = 0;

function criarCategoriaComArtigo() {
    contador += 1;
    const categoriaId = db
        .prepare('INSERT INTO categoria (nome, slug) VALUES (?, ?)')
        .run('Categoria ' + contador, 'categoria-' + contador).lastInsertRowid;
    const conteudoId = db
        .prepare(
            `INSERT INTO conteudo (categoria_id, titulo, slug, resumo, corpo_html, fontes, publicado)
             VALUES (?, ?, ?, ?, ?, ?, 1)`
        )
        .run(categoriaId, 'Artigo ' + contador, 'artigo-' + contador, 'resumo', '<p>corpo</p>', 'OMS').lastInsertRowid;
    return { categoriaId, conteudoId };
}

const ALTERNATIVAS_VALIDAS = [
    { texto: 'Errada', correta: false },
    { texto: 'Certa', correta: true },
];

test('salvarQuestao grava o artigo vinculado', () => {
    const { categoriaId, conteudoId } = criarCategoriaComArtigo();
    const quizId = quizAdminService.criar({ categoriaId, titulo: 'Quiz', descricao: '' });

    const { id } = quizAdminService.salvarQuestao(quizId, {
        enunciado: 'Pergunta?',
        explicacao: 'Explicação',
        alternativas: ALTERNATIVAS_VALIDAS,
        conteudoId,
    });

    assert.equal(db.prepare('SELECT conteudo_id FROM questao WHERE id = ?').get(id).conteudo_id, conteudoId);
});

test('salvarQuestao aceita questão sem artigo vinculado', () => {
    const { categoriaId } = criarCategoriaComArtigo();
    const quizId = quizAdminService.criar({ categoriaId, titulo: 'Quiz', descricao: '' });

    const { id } = quizAdminService.salvarQuestao(quizId, {
        enunciado: 'Pergunta geral?',
        explicacao: '',
        alternativas: ALTERNATIVAS_VALIDAS,
        conteudoId: '',
    });

    assert.equal(db.prepare('SELECT conteudo_id FROM questao WHERE id = ?').get(id).conteudo_id, null);
});

test('salvarQuestao troca o artigo vinculado ao editar uma questão existente', () => {
    const { categoriaId, conteudoId } = criarCategoriaComArtigo();
    const outro = criarCategoriaComArtigo();
    const quizId = quizAdminService.criar({ categoriaId, titulo: 'Quiz', descricao: '' });
    const { id } = quizAdminService.salvarQuestao(quizId, {
        enunciado: 'Pergunta?',
        explicacao: '',
        alternativas: ALTERNATIVAS_VALIDAS,
        conteudoId,
    });

    quizAdminService.salvarQuestao(quizId, {
        questaoId: id,
        enunciado: 'Pergunta?',
        explicacao: '',
        alternativas: ALTERNATIVAS_VALIDAS,
        conteudoId: outro.conteudoId,
    });

    assert.equal(db.prepare('SELECT conteudo_id FROM questao WHERE id = ?').get(id).conteudo_id, outro.conteudoId);
});

test('listarArtigosParaVincular devolve os artigos publicados da categoria do quiz', () => {
    const { categoriaId, conteudoId } = criarCategoriaComArtigo();
    const outro = criarCategoriaComArtigo();
    const quizId = quizAdminService.criar({ categoriaId, titulo: 'Quiz', descricao: '' });

    const artigos = quizAdminService.listarArtigosParaVincular(quizId);

    assert.deepEqual(
        artigos.map((a) => a.id),
        [conteudoId]
    );
    assert.equal(
        artigos.some((a) => a.id === outro.conteudoId),
        false
    );
});

test('listarArtigosParaVincular devolve lista vazia para quiz sem categoria', () => {
    criarCategoriaComArtigo();
    const quizId = quizAdminService.criar({ categoriaId: null, titulo: 'Quiz geral', descricao: '' });

    assert.deepEqual(quizAdminService.listarArtigosParaVincular(quizId), []);
});
