const categoriaRepository = require('../repositories/categoria.repository');
const conteudoRepository = require('../repositories/conteudo.repository');
const quizRepository = require('../repositories/quiz.repository');

// Monta o indice de trilhas: cada categoria com quantos artigos publicados tem.
// Quanto o visitante ja leu e calculado no navegador, a partir do localStorage.
function listarTrilhas() {
    return categoriaRepository.listarTodas().map((categoria) => {
        const artigos = conteudoRepository.listarPublicadosPorCategoria(categoria.id);
        return {
            id: categoria.id,
            nome: categoria.nome,
            slug: categoria.slug,
            descricao: categoria.descricao,
            totalArtigos: artigos.length,
            slugsArtigos: artigos.map((artigo) => artigo.slug),
        };
    });
}

function buscarTrilha(slug) {
    const categoria = categoriaRepository.buscarPorSlug(slug);
    if (!categoria) return null;

    const artigos = conteudoRepository.listarPublicadosPorCategoria(categoria.id);
    const quiz = quizRepository.buscarPorCategoria(categoria.id);

    return {
        categoria,
        artigos,
        totalArtigos: artigos.length,
        quiz: quiz || null,
    };
}

module.exports = { listarTrilhas, buscarTrilha };
