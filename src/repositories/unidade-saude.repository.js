const db = require('../config/database');

const INSERIR = `
    INSERT INTO unidade_saude
        (codigo_cnes, nome, logradouro, numero, bairro, bairro_normalizado, telefone,
         latitude, longitude, tipo_unidade, tipo_descricao, atende_sus, turno_atendimento)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

// Troca a lista inteira de uma vez. A carga vem de uma extracao completa do CNES,
// entao nao faz sentido tentar casar registro a registro: apagar e inserir dentro
// da mesma transacao deixa a importacao idempotente e o banco sempre consistente.
function substituirTodas(unidades) {
    const inserir = db.prepare(INSERIR);

    const trocar = db.transaction((lista) => {
        db.prepare('DELETE FROM unidade_saude').run();
        lista.forEach((u) => {
            inserir.run(
                u.codigo_cnes,
                u.nome,
                u.logradouro,
                u.numero,
                u.bairro,
                u.bairro_normalizado,
                u.telefone,
                u.latitude,
                u.longitude,
                u.tipo_unidade,
                u.tipo_descricao,
                u.atende_sus,
                u.turno_atendimento
            );
        });
    });

    trocar(unidades);
}

// Monta o WHERE no mesmo padrao do conteudo.repository: clausula com ? e os
// valores a parte, nunca concatenados.
function montarFiltros({ apenasSus, tipo, bairro }) {
    const condicoes = ['1 = 1'];
    const params = [];

    if (apenasSus) condicoes.push('atende_sus = 1');

    if (tipo !== undefined && tipo !== null && tipo !== '') {
        condicoes.push('tipo_unidade = ?');
        params.push(Number(tipo));
    }

    // RF28. O filtro bate no nome ja corrigido, nunca no valor cru do CNES: e' o
    // mesmo nome que o seletor da pagina oferece.
    if (bairro !== undefined && bairro !== null && bairro !== '') {
        condicoes.push('bairro_normalizado = ?');
        params.push(String(bairro));
    }

    return { clausula: condicoes.join(' AND '), params };
}

function listarComFiltros({ apenasSus, tipo, bairro } = {}) {
    const { clausula, params } = montarFiltros({ apenasSus, tipo, bairro });

    return db.prepare(`SELECT * FROM unidade_saude WHERE ${clausula} ORDER BY nome`).all(...params);
}

// Alimenta o seletor de bairros do RF28. A contagem aparece ao lado do nome para
// a pessoa saber o que esperar antes de escolher. Quem ficou sem correcao de nome
// fica de fora: filtro sem nome legivel so atrapalha.
function listarBairrosDisponiveis({ apenasSus } = {}) {
    const { clausula, params } = montarFiltros({ apenasSus });

    return db
        .prepare(
            `SELECT bairro_normalizado AS bairro, COUNT(*) AS total
               FROM unidade_saude
              WHERE ${clausula} AND bairro_normalizado IS NOT NULL
           GROUP BY bairro_normalizado
           ORDER BY bairro_normalizado`
        )
        .all(...params);
}

// Alimenta o select de tipos da pagina. So lista o que existe na base, para nao
// oferecer filtro que nao devolve resultado nenhum.
function listarTiposDisponiveis() {
    return db
        .prepare(
            `SELECT DISTINCT tipo_unidade AS codigo, tipo_descricao AS descricao
             FROM unidade_saude
             WHERE tipo_descricao IS NOT NULL
             ORDER BY tipo_descricao`
        )
        .all();
}

function contar() {
    return db.prepare('SELECT COUNT(*) AS total FROM unidade_saude').get().total;
}

// RN22. A tabela guarda uma linha so: a base e' substituida inteira a cada
// importacao, entao nao ha historico a preservar.
function registrarExtracao(data) {
    const registrar = db.transaction((valor) => {
        db.prepare('DELETE FROM extracao_cnes').run();
        db.prepare('INSERT INTO extracao_cnes (data_extracao) VALUES (?)').run(valor);
    });

    registrar(data);
}

function buscarDataExtracao() {
    const linha = db.prepare('SELECT data_extracao FROM extracao_cnes LIMIT 1').get();
    return linha ? linha.data_extracao : null;
}

module.exports = {
    substituirTodas,
    listarComFiltros,
    listarTiposDisponiveis,
    listarBairrosDisponiveis,
    contar,
    registrarExtracao,
    buscarDataExtracao,
};
