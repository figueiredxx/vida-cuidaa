const db = require('../config/database');

function listarTodos() {
    return db
        .prepare(
            `SELECT quiz.*, categoria.nome AS categoria_nome
             FROM quiz
             LEFT JOIN categoria ON categoria.id = quiz.categoria_id
             ORDER BY quiz.id DESC`
        )
        .all();
}

function buscarPorId(id) {
    return db.prepare('SELECT * FROM quiz WHERE id = ?').get(id);
}

function buscarPorCategoria(categoriaId) {
    return db.prepare('SELECT * FROM quiz WHERE categoria_id = ? ORDER BY id LIMIT 1').get(categoriaId);
}

function criar({ categoriaId, titulo, descricao }) {
    const info = db
        .prepare('INSERT INTO quiz (categoria_id, titulo, descricao) VALUES (?, ?, ?)')
        .run(categoriaId || null, titulo, descricao);
    return info.lastInsertRowid;
}

function atualizar(id, { categoriaId, titulo, descricao }) {
    db.prepare('UPDATE quiz SET categoria_id = ?, titulo = ?, descricao = ? WHERE id = ?').run(
        categoriaId || null,
        titulo,
        descricao,
        id
    );
}

function remover(id) {
    db.prepare('DELETE FROM quiz WHERE id = ?').run(id);
}

function listarQuestoesPorQuiz(quizId) {
    const questoes = db.prepare('SELECT * FROM questao WHERE quiz_id = ? ORDER BY ordem, id').all(quizId);
    const alternativasStmt = db.prepare('SELECT * FROM alternativa WHERE questao_id = ? ORDER BY id');
    return questoes.map((questao) => ({
        ...questao,
        alternativas: alternativasStmt.all(questao.id),
    }));
}

function buscarQuestaoPorId(id) {
    return db.prepare('SELECT * FROM questao WHERE id = ?').get(id);
}

function contarQuestoesPorQuiz(quizId) {
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM questao WHERE quiz_id = ?').get(quizId);
    return total;
}

function criarQuestao(quizId, { enunciado, explicacao, ordem, conteudoId }) {
    const info = db
        .prepare('INSERT INTO questao (quiz_id, conteudo_id, enunciado, explicacao, ordem) VALUES (?, ?, ?, ?, ?)')
        .run(quizId, conteudoId || null, enunciado, explicacao, ordem);
    return info.lastInsertRowid;
}

function atualizarQuestao(id, { enunciado, explicacao, ordem, conteudoId }) {
    db.prepare('UPDATE questao SET conteudo_id = ?, enunciado = ?, explicacao = ?, ordem = ? WHERE id = ?').run(
        conteudoId || null,
        enunciado,
        explicacao,
        ordem,
        id
    );
}

function removerQuestao(id) {
    db.prepare('DELETE FROM questao WHERE id = ?').run(id);
}

function removerAlternativasPorQuestao(questaoId) {
    db.prepare('DELETE FROM alternativa WHERE questao_id = ?').run(questaoId);
}

function criarAlternativa(questaoId, { texto, correta }) {
    db.prepare('INSERT INTO alternativa (questao_id, texto, correta) VALUES (?, ?, ?)').run(
        questaoId,
        texto,
        correta ? 1 : 0
    );
}

function buscarQuestoesParaPlayer(quizId) {
    const questoes = db
        .prepare('SELECT id, enunciado, ordem FROM questao WHERE quiz_id = ? ORDER BY ordem, id')
        .all(quizId);
    const alternativasStmt = db.prepare('SELECT id, texto FROM alternativa WHERE questao_id = ? ORDER BY id');
    return questoes.map((questao) => ({
        ...questao,
        alternativas: alternativasStmt.all(questao.id),
    }));
}

function buscarGabarito(quizId) {
    // LEFT JOIN porque o vinculo com o artigo e opcional: questao antiga ou
    // pergunta geral da categoria nao aponta para nenhum conteudo.
    const questoes = db
        .prepare(
            `SELECT questao.id, questao.enunciado, questao.explicacao,
                    conteudo.titulo AS artigo_titulo, conteudo.slug AS artigo_slug
             FROM questao
             LEFT JOIN conteudo ON conteudo.id = questao.conteudo_id
             WHERE questao.quiz_id = ?`
        )
        .all(quizId);
    const corretaStmt = db.prepare('SELECT id, texto FROM alternativa WHERE questao_id = ? AND correta = 1');
    return questoes.map((questao) => ({
        ...questao,
        alternativaCorreta: corretaStmt.get(questao.id),
    }));
}

function registrarTentativa(quizId, usuarioId, pontuacao, total) {
    db.prepare('INSERT INTO tentativa_quiz (quiz_id, usuario_id, pontuacao, total) VALUES (?, ?, ?, ?)').run(
        quizId,
        usuarioId || null,
        pontuacao,
        total
    );
}

module.exports = {
    listarTodos,
    buscarPorId,
    buscarPorCategoria,
    criar,
    atualizar,
    remover,
    listarQuestoesPorQuiz,
    buscarQuestaoPorId,
    contarQuestoesPorQuiz,
    criarQuestao,
    atualizarQuestao,
    removerQuestao,
    removerAlternativasPorQuestao,
    criarAlternativa,
    buscarQuestoesParaPlayer,
    buscarGabarito,
    registrarTentativa,
};
