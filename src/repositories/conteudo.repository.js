const db = require('../config/database');

function listarPublicadosRecentes(limite) {
    return db
        .prepare(
            `SELECT conteudo.*, categoria.nome AS categoria_nome, categoria.slug AS categoria_slug
             FROM conteudo
             JOIN categoria ON categoria.id = conteudo.categoria_id
             WHERE conteudo.publicado = 1
             ORDER BY conteudo.criado_em DESC
             LIMIT ?`
        )
        .all(limite);
}

function montarFiltros({ categoriaSlug, faixaEtaria, busca }) {
    const condicoes = ['conteudo.publicado = 1'];
    const params = [];

    if (categoriaSlug) {
        condicoes.push('categoria.slug = ?');
        params.push(categoriaSlug);
    }

    if (faixaEtaria) {
        condicoes.push('conteudo.faixa_etaria = ?');
        params.push(faixaEtaria);
    }

    if (busca) {
        condicoes.push('(conteudo.titulo LIKE ? OR conteudo.resumo LIKE ?)');
        const termo = `%${busca}%`;
        params.push(termo, termo);
    }

    return { clausula: condicoes.join(' AND '), params };
}

function listarComFiltros({ categoriaSlug, faixaEtaria, busca, pagina, porPagina }) {
    const { clausula, params } = montarFiltros({ categoriaSlug, faixaEtaria, busca });
    const offset = (pagina - 1) * porPagina;

    return db
        .prepare(
            `SELECT conteudo.*, categoria.nome AS categoria_nome, categoria.slug AS categoria_slug
             FROM conteudo
             JOIN categoria ON categoria.id = conteudo.categoria_id
             WHERE ${clausula}
             ORDER BY conteudo.criado_em DESC
             LIMIT ? OFFSET ?`
        )
        .all(...params, porPagina, offset);
}

function contarComFiltros({ categoriaSlug, faixaEtaria, busca }) {
    const { clausula, params } = montarFiltros({ categoriaSlug, faixaEtaria, busca });

    const { total } = db
        .prepare(
            `SELECT COUNT(*) AS total
             FROM conteudo
             JOIN categoria ON categoria.id = conteudo.categoria_id
             WHERE ${clausula}`
        )
        .get(...params);

    return total;
}

function buscarPorSlugPublicado(slug) {
    return db
        .prepare(
            `SELECT conteudo.*, categoria.nome AS categoria_nome, categoria.slug AS categoria_slug
             FROM conteudo
             JOIN categoria ON categoria.id = conteudo.categoria_id
             WHERE conteudo.slug = ? AND conteudo.publicado = 1`
        )
        .get(slug);
}

function incrementarVisualizacoes(id) {
    db.prepare('UPDATE conteudo SET visualizacoes = visualizacoes + 1 WHERE id = ?').run(id);
}

function listarRelacionados(categoriaId, idExcluir, limite) {
    return db
        .prepare(
            `SELECT conteudo.*, categoria.nome AS categoria_nome, categoria.slug AS categoria_slug
             FROM conteudo
             JOIN categoria ON categoria.id = conteudo.categoria_id
             WHERE conteudo.categoria_id = ? AND conteudo.id != ? AND conteudo.publicado = 1
             ORDER BY conteudo.criado_em DESC
             LIMIT ?`
        )
        .all(categoriaId, idExcluir, limite);
}

function listarPublicadosPorCategoria(categoriaId) {
    // Ordem crescente: a trilha e lida do artigo mais antigo para o mais novo.
    return db
        .prepare(
            `SELECT id, titulo, slug, resumo, faixa_etaria
             FROM conteudo
             WHERE categoria_id = ? AND publicado = 1
             ORDER BY criado_em, id`
        )
        .all(categoriaId);
}

function contarTotal() {
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM conteudo').get();
    return total;
}

function contarPorPublicado(publicado) {
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM conteudo WHERE publicado = ?').get(publicado ? 1 : 0);
    return total;
}

function listarTodosAdmin() {
    return db
        .prepare(
            `SELECT conteudo.*, categoria.nome AS categoria_nome
             FROM conteudo
             JOIN categoria ON categoria.id = conteudo.categoria_id
             ORDER BY conteudo.criado_em DESC`
        )
        .all();
}

function buscarPorId(id) {
    return db.prepare('SELECT * FROM conteudo WHERE id = ?').get(id);
}

function existeSlug(slug, idExcluir) {
    const query = idExcluir
        ? db.prepare('SELECT 1 FROM conteudo WHERE slug = ? AND id != ?').get(slug, idExcluir)
        : db.prepare('SELECT 1 FROM conteudo WHERE slug = ?').get(slug);
    return Boolean(query);
}

function criar(dados) {
    const info = db
        .prepare(
            `INSERT INTO conteudo (categoria_id, titulo, slug, resumo, corpo_html, fontes, faixa_etaria, publicado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
            dados.categoriaId,
            dados.titulo,
            dados.slug,
            dados.resumo,
            dados.corpoHtml,
            dados.fontes,
            dados.faixaEtaria,
            dados.publicado ? 1 : 0
        );
    return info.lastInsertRowid;
}

function atualizar(id, dados) {
    db.prepare(
        `UPDATE conteudo
         SET categoria_id = ?, titulo = ?, slug = ?, resumo = ?, corpo_html = ?, fontes = ?,
             faixa_etaria = ?, publicado = ?, atualizado_em = datetime('now')
         WHERE id = ?`
    ).run(
        dados.categoriaId,
        dados.titulo,
        dados.slug,
        dados.resumo,
        dados.corpoHtml,
        dados.fontes,
        dados.faixaEtaria,
        dados.publicado ? 1 : 0,
        id
    );
}

function remover(id) {
    db.prepare('DELETE FROM conteudo WHERE id = ?').run(id);
}

module.exports = {
    listarPublicadosRecentes,
    listarComFiltros,
    contarComFiltros,
    buscarPorSlugPublicado,
    incrementarVisualizacoes,
    listarRelacionados,
    listarPublicadosPorCategoria,
    contarTotal,
    contarPorPublicado,
    listarTodosAdmin,
    buscarPorId,
    existeSlug,
    criar,
    atualizar,
    remover,
};
