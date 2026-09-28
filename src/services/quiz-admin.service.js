const quizRepository = require('../repositories/quiz.repository');
const categoriaRepository = require('../repositories/categoria.repository');
const conteudoRepository = require('../repositories/conteudo.repository');

function listarTodos() {
    return quizRepository.listarTodos();
}

function buscarPorId(id) {
    return quizRepository.buscarPorId(id);
}

function listarCategorias() {
    return categoriaRepository.listarTodas();
}

function criar({ categoriaId, titulo, descricao }) {
    return quizRepository.criar({ categoriaId: categoriaId || null, titulo, descricao });
}

function atualizar(id, { categoriaId, titulo, descricao }) {
    quizRepository.atualizar(id, { categoriaId: categoriaId || null, titulo, descricao });
}

function remover(id) {
    quizRepository.remover(id);
}

// Artigos que podem ser vinculados a uma questao: so os da categoria do quiz,
// para o admin nao apontar a pergunta para um conteudo de outro assunto.
function listarArtigosParaVincular(quizId) {
    const quiz = quizRepository.buscarPorId(quizId);
    if (!quiz || !quiz.categoria_id) return [];
    return conteudoRepository.listarPublicadosPorCategoria(quiz.categoria_id);
}

function listarQuestoes(quizId) {
    return quizRepository.listarQuestoesPorQuiz(quizId);
}

function buscarQuestao(id) {
    return quizRepository.buscarQuestaoPorId(id);
}

function validarAlternativas(alternativas) {
    const preenchidas = alternativas.filter((alt) => alt.texto && alt.texto.trim());

    if (preenchidas.length < 2) {
        return 'Informe pelo menos 2 alternativas.';
    }

    const corretas = preenchidas.filter((alt) => alt.correta);
    if (corretas.length !== 1) {
        return 'Marque exatamente uma alternativa como correta.';
    }

    return null;
}

function salvarQuestao(quizId, { enunciado, explicacao, alternativas, questaoId, conteudoId }) {
    const erro = validarAlternativas(alternativas);
    if (erro) return { erro };

    const preenchidas = alternativas.filter((alt) => alt.texto && alt.texto.trim());

    let id = questaoId;
    if (questaoId) {
        const existente = quizRepository.buscarQuestaoPorId(questaoId);
        quizRepository.atualizarQuestao(questaoId, { enunciado, explicacao, ordem: existente.ordem, conteudoId });
        quizRepository.removerAlternativasPorQuestao(questaoId);
    } else {
        const totalExistentes = quizRepository.contarQuestoesPorQuiz(quizId);
        id = quizRepository.criarQuestao(quizId, { enunciado, explicacao, ordem: totalExistentes, conteudoId });
    }

    preenchidas.forEach((alt) => {
        quizRepository.criarAlternativa(id, { texto: alt.texto.trim(), correta: alt.correta });
    });

    return { erro: null, id };
}

function removerQuestao(id) {
    quizRepository.removerQuestao(id);
}

module.exports = {
    listarTodos,
    buscarPorId,
    listarCategorias,
    criar,
    atualizar,
    remover,
    listarQuestoes,
    listarArtigosParaVincular,
    buscarQuestao,
    salvarQuestao,
    removerQuestao,
};
