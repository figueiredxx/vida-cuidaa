const quizRepository = require('../repositories/quiz.repository');

function buscarParaPlayer(id) {
    const quiz = quizRepository.buscarPorId(id);
    if (!quiz) return null;

    const questoes = quizRepository.buscarQuestoesParaPlayer(id);
    return { quiz, questoes };
}

function corrigir(quizId, respostas, usuarioId) {
    const gabarito = quizRepository.buscarGabarito(quizId);

    let acertos = 0;
    const detalhes = gabarito.map((questao) => {
        const alternativaEscolhidaId = Number(respostas[questao.id]);
        const acertou = questao.alternativaCorreta && alternativaEscolhidaId === questao.alternativaCorreta.id;
        if (acertou) acertos += 1;

        return {
            questaoId: questao.id,
            enunciado: questao.enunciado,
            explicacao: questao.explicacao,
            acertou: Boolean(acertou),
            alternativaCorretaTexto: questao.alternativaCorreta ? questao.alternativaCorreta.texto : null,
            artigo: questao.artigo_slug ? { titulo: questao.artigo_titulo, slug: questao.artigo_slug } : null,
        };
    });

    const total = gabarito.length;
    quizRepository.registrarTentativa(quizId, usuarioId, acertos, total);

    return { acertos, total, detalhes };
}

module.exports = { buscarParaPlayer, corrigir };
