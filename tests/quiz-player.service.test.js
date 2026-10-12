// Cobre o requisito RF08: a correção do quiz acontece inteiramente no servidor
// e a alternativa correta nunca é enviada ao navegador antes do envio da resposta.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepararBancoTemporario } = require('./ajuda/banco-teste');

const db = prepararBancoTemporario();
const quizRepository = require('../src/repositories/quiz.repository');
const quizPlayerService = require('../src/services/quiz-player.service');

function criarConteudo(categoriaId) {
    const slug = 'artigo-teste-' + Math.abs(Math.random() * 1e9).toFixed(0);
    const id = db
        .prepare(
            `INSERT INTO conteudo (categoria_id, titulo, slug, resumo, corpo_html, fontes, publicado)
             VALUES (?, ?, ?, ?, ?, ?, 1)`
        )
        .run(categoriaId, 'Artigo teste', slug, 'resumo', '<p>corpo</p>', 'Ministério da Saúde').lastInsertRowid;
    return { id, titulo: 'Artigo teste', slug };
}

function criarQuizComUmaQuestao({ comArtigo = false } = {}) {
    const categoriaId = db
        .prepare("INSERT INTO categoria (nome, slug) VALUES ('Categoria Teste ' || abs(random()), 'categoria-teste-' || abs(random()))")
        .run().lastInsertRowid;
    const conteudo = comArtigo ? criarConteudo(categoriaId) : null;
    const quizId = quizRepository.criar({ categoriaId, titulo: 'Quiz teste', descricao: 'descricao' });
    const questaoId = quizRepository.criarQuestao(quizId, {
        enunciado: 'Pergunta?',
        explicacao: 'Explicação',
        ordem: 1,
        conteudoId: conteudo ? conteudo.id : null,
    });
    quizRepository.criarAlternativa(questaoId, { texto: 'Errada', correta: false });
    quizRepository.criarAlternativa(questaoId, { texto: 'Certa', correta: true });

    const alternativas = db.prepare('SELECT * FROM alternativa WHERE questao_id = ?').all(questaoId);
    const idCorreta = alternativas.find((a) => a.correta === 1).id;
    const idErrada = alternativas.find((a) => a.correta === 0).id;
    return { quizId, questaoId, idCorreta, idErrada, conteudo };
}

test('buscarParaPlayer nunca inclui qual alternativa é a correta', () => {
    const { quizId } = criarQuizComUmaQuestao();
    const dados = quizPlayerService.buscarParaPlayer(quizId);
    const alternativa = dados.questoes[0].alternativas[0];
    assert.equal('correta' in alternativa, false);
});

test('corrigir contabiliza acerto quando a alternativa certa é escolhida', () => {
    const { quizId, questaoId, idCorreta } = criarQuizComUmaQuestao();
    const resultado = quizPlayerService.corrigir(quizId, { [questaoId]: idCorreta }, null);
    assert.equal(resultado.acertos, 1);
    assert.equal(resultado.total, 1);
    assert.equal(resultado.detalhes[0].acertou, true);
});

test('corrigir não contabiliza acerto quando a alternativa errada é escolhida', () => {
    const { quizId, questaoId, idErrada } = criarQuizComUmaQuestao();
    const resultado = quizPlayerService.corrigir(quizId, { [questaoId]: idErrada }, null);
    assert.equal(resultado.acertos, 0);
    assert.equal(resultado.detalhes[0].acertou, false);
});

test('corrigir não contabiliza acerto quando a questão fica sem resposta', () => {
    const { quizId } = criarQuizComUmaQuestao();
    const resultado = quizPlayerService.corrigir(quizId, {}, null);
    assert.equal(resultado.acertos, 0);
});

test('corrigir registra a tentativa mesmo para visitante anônimo (usuário nulo)', () => {
    const { quizId, questaoId, idCorreta } = criarQuizComUmaQuestao();
    quizPlayerService.corrigir(quizId, { [questaoId]: idCorreta }, null);
    const tentativa = db.prepare('SELECT * FROM tentativa_quiz WHERE quiz_id = ? ORDER BY id DESC').get(quizId);
    assert.equal(tentativa.usuario_id, null);
    assert.equal(tentativa.total, 1);
});

test('corrigir indica o artigo de origem quando a questão está vinculada a um conteúdo', () => {
    const { quizId, questaoId, idErrada, conteudo } = criarQuizComUmaQuestao({ comArtigo: true });
    const resultado = quizPlayerService.corrigir(quizId, { [questaoId]: idErrada }, null);
    assert.deepEqual(resultado.detalhes[0].artigo, { titulo: conteudo.titulo, slug: conteudo.slug });
});

test('corrigir devolve artigo nulo quando a questão não está vinculada a nenhum conteúdo', () => {
    const { quizId, questaoId, idCorreta } = criarQuizComUmaQuestao();
    const resultado = quizPlayerService.corrigir(quizId, { [questaoId]: idCorreta }, null);
    assert.equal(resultado.detalhes[0].artigo, null);
});
