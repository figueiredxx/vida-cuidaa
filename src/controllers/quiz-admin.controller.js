const quizAdminService = require('../services/quiz-admin.service');

function listar(req, res) {
    const quizzes = quizAdminService.listarTodos();
    res.render('admin/quizzes/lista', { titulo: 'Quizzes', quizzes });
}

function exibirFormulario(req, res) {
    const categorias = quizAdminService.listarCategorias();
    const quiz = req.params.id ? quizAdminService.buscarPorId(req.params.id) : null;

    if (req.params.id && !quiz) {
        return res.status(404).render('site/404', { titulo: 'Página não encontrada' });
    }

    res.render('admin/quizzes/formulario', { titulo: 'Quiz', categorias, quiz, erros: [] });
}

function salvar(req, res) {
    const dados = {
        categoriaId: req.body.categoriaId ? Number(req.body.categoriaId) : null,
        titulo: req.body.titulo,
        descricao: req.body.descricao,
    };

    let id = req.params.id;
    if (id) {
        quizAdminService.atualizar(id, dados);
    } else {
        id = quizAdminService.criar(dados);
    }

    res.redirect(`/admin/quizzes/${id}/questoes`);
}

function remover(req, res) {
    quizAdminService.remover(req.params.id);
    res.redirect('/admin/quizzes');
}

function exibirQuestoes(req, res) {
    const quiz = quizAdminService.buscarPorId(req.params.id);
    if (!quiz) {
        return res.status(404).render('site/404', { titulo: 'Página não encontrada' });
    }

    const questoes = quizAdminService.listarQuestoes(quiz.id);
    const artigos = quizAdminService.listarArtigosParaVincular(quiz.id);
    res.render('admin/quizzes/questoes', {
        titulo: `Questões — ${quiz.titulo}`,
        quiz,
        questoes,
        artigos,
        erro: null,
        questaoEditando: null,
    });
}

function extrairAlternativas(body) {
    return [1, 2, 3, 4].map((n) => ({
        texto: body[`alternativa${n}`],
        correta: body.correta === String(n),
    }));
}

function salvarQuestao(req, res) {
    const quiz = quizAdminService.buscarPorId(req.params.id);
    if (!quiz) {
        return res.status(404).render('site/404', { titulo: 'Página não encontrada' });
    }

    const alternativas = extrairAlternativas(req.body);
    const resultado = quizAdminService.salvarQuestao(quiz.id, {
        questaoId: req.params.questaoId || null,
        enunciado: req.body.enunciado,
        explicacao: req.body.explicacao,
        alternativas,
        conteudoId: req.body.conteudoId ? Number(req.body.conteudoId) : null,
    });

    if (resultado.erro) {
        const questoes = quizAdminService.listarQuestoes(quiz.id);
        return res.status(400).render('admin/quizzes/questoes', {
            titulo: `Questões — ${quiz.titulo}`,
            quiz,
            questoes,
            artigos: quizAdminService.listarArtigosParaVincular(quiz.id),
            erro: resultado.erro,
            questaoEditando: null,
        });
    }

    res.redirect(`/admin/quizzes/${quiz.id}/questoes`);
}

function exibirEdicaoQuestao(req, res) {
    const quiz = quizAdminService.buscarPorId(req.params.id);
    const questaoEditando = quizAdminService.buscarQuestao(req.params.questaoId);

    if (!quiz || !questaoEditando) {
        return res.status(404).render('site/404', { titulo: 'Página não encontrada' });
    }

    const questoes = quizAdminService.listarQuestoes(quiz.id);
    questaoEditando.alternativas = questoes.find((q) => q.id === questaoEditando.id).alternativas;

    res.render('admin/quizzes/questoes', {
        titulo: `Questões — ${quiz.titulo}`,
        quiz,
        questoes,
        artigos: quizAdminService.listarArtigosParaVincular(quiz.id),
        erro: null,
        questaoEditando,
    });
}

function removerQuestao(req, res) {
    quizAdminService.removerQuestao(req.params.questaoId);
    res.redirect(`/admin/quizzes/${req.params.id}/questoes`);
}

module.exports = {
    listar,
    exibirFormulario,
    salvar,
    remover,
    exibirQuestoes,
    salvarQuestao,
    exibirEdicaoQuestao,
    removerQuestao,
};
