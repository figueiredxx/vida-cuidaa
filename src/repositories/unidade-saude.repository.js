const db = require('../config/database');

const INSERIR = `
    INSERT INTO unidade_saude
        (codigo_cnes, nome, logradouro, numero, bairro, telefone,
         latitude, longitude, tipo_unidade, atende_sus, turno_atendimento)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                u.telefone,
                u.latitude,
                u.longitude,
                u.tipo_unidade,
                u.atende_sus,
                u.turno_atendimento
            );
        });
    });

    trocar(unidades);
}

// Só o que atende pelo SUS. O CNES traz tambem clinica particular, que nao cabe
// numa plataforma publica que fala de servico gratuito.
function listarQueAtendemSus() {
    return db.prepare('SELECT * FROM unidade_saude WHERE atende_sus = 1 ORDER BY nome').all();
}

function contar() {
    return db.prepare('SELECT COUNT(*) AS total FROM unidade_saude').get().total;
}

module.exports = { substituirTodas, listarQueAtendemSus, contar };
