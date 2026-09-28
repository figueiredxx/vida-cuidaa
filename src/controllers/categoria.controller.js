const categoriaService = require('../services/categoria.service');

function listar(req, res) {
    res.render('site/categorias', {
        titulo: 'Trilhas por categoria',
        categorias: categoriaService.listarTrilhas(),
    });
}

function detalhe(req, res) {
    const trilha = categoriaService.buscarTrilha(req.params.slug);
    if (!trilha) {
        return res.status(404).render('site/404', { titulo: 'Página não encontrada' });
    }
    res.render('site/categoria', { titulo: trilha.categoria.nome, ...trilha });
}

module.exports = { listar, detalhe };
