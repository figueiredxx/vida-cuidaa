// Cobre a carga das unidades de saude do CNES no banco e os filtros do RF27
// (tipo de unidade e atendimento pelo SUS). A importacao precisa ser idempotente:
// rodar de novo depois de uma extracao nova substitui a lista, nunca duplica.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepararBancoTemporario } = require('./ajuda/banco-teste');

const db = prepararBancoTemporario();
const unidadeSaudeRepository = require('../src/repositories/unidade-saude.repository');

function unidade(alteracoes = {}) {
    return {
        codigo_cnes: '2000156',
        nome: 'UBS SAO JOSE',
        logradouro: 'AVENIDA AUTAZ MIRIM',
        numero: '1000',
        bairro: 'SAO JOSE OPERARIO',
        telefone: '9232154000',
        latitude: -3.0589,
        longitude: -59.9512,
        tipo_unidade: 2,
        tipo_descricao: 'CENTRO DE SAUDE/UNIDADE BASICA',
        atende_sus: 1,
        turno_atendimento: 'ATENDIMENTO NOS TURNOS MANHA E TARDE',
        ...alteracoes,
    };
}

test('substituirTodas grava as unidades recebidas', () => {
    unidadeSaudeRepository.substituirTodas([unidade(), unidade({ codigo_cnes: '2000157', nome: 'UBS CENTRO' })]);

    const gravadas = db.prepare('SELECT * FROM unidade_saude ORDER BY codigo_cnes').all();
    assert.equal(gravadas.length, 2);
    assert.equal(gravadas[0].nome, 'UBS SAO JOSE');
    assert.equal(gravadas[0].bairro, 'SAO JOSE OPERARIO');
    assert.equal(gravadas[0].latitude, -3.0589);
    assert.equal(gravadas[0].tipo_descricao, 'CENTRO DE SAUDE/UNIDADE BASICA');
    assert.equal(gravadas[1].nome, 'UBS CENTRO');
});

test('substituirTodas apaga a carga anterior em vez de acumular', () => {
    unidadeSaudeRepository.substituirTodas([unidade(), unidade({ codigo_cnes: '2000157' })]);
    unidadeSaudeRepository.substituirTodas([unidade({ codigo_cnes: '2000158', nome: 'UBS NOVA' })]);

    const gravadas = db.prepare('SELECT codigo_cnes FROM unidade_saude').all();
    assert.deepEqual(
        gravadas.map((u) => u.codigo_cnes),
        ['2000158']
    );
});

test('substituirTodas aceita unidade sem telefone e sem turno informados', () => {
    unidadeSaudeRepository.substituirTodas([unidade({ telefone: null, turno_atendimento: null })]);

    const gravada = db.prepare('SELECT * FROM unidade_saude').get();
    assert.equal(gravada.telefone, null);
    assert.equal(gravada.turno_atendimento, null);
});

test('contar devolve o total de unidades carregadas', () => {
    unidadeSaudeRepository.substituirTodas([unidade(), unidade({ codigo_cnes: '2000157' })]);

    assert.equal(unidadeSaudeRepository.contar(), 2);
});

test('listarComFiltros sem filtro devolve todas as unidades', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade({ codigo_cnes: '2000156', atende_sus: 1 }),
        unidade({ codigo_cnes: '2000157', atende_sus: 0 }),
    ]);

    assert.equal(unidadeSaudeRepository.listarComFiltros({}).length, 2);
});

// RN20 manda exibir quem nao atende pelo SUS com marcacao distinta, nao esconder.
// Por isso o filtro e' opcional: quem decide e' quem chama.
test('listarComFiltros com apenasSus devolve so quem atende pelo SUS', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade({ codigo_cnes: '2000156', nome: 'UBS', atende_sus: 1 }),
        unidade({ codigo_cnes: '2000157', nome: 'CLINICA PARTICULAR', atende_sus: 0 }),
    ]);

    const doSus = unidadeSaudeRepository.listarComFiltros({ apenasSus: true });

    assert.deepEqual(
        doSus.map((u) => u.nome),
        ['UBS']
    );
});

test('listarComFiltros com tipo devolve so as unidades daquele tipo', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade({ codigo_cnes: '2000156', nome: 'POSTO', tipo_unidade: 1 }),
        unidade({ codigo_cnes: '2000157', nome: 'HOSPITAL', tipo_unidade: 5 }),
    ]);

    const postos = unidadeSaudeRepository.listarComFiltros({ tipo: 1 });

    assert.deepEqual(
        postos.map((u) => u.nome),
        ['POSTO']
    );
});

test('listarComFiltros combina tipo e atendimento pelo SUS', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade({ codigo_cnes: '2000156', nome: 'POSTO DO SUS', tipo_unidade: 1, atende_sus: 1 }),
        unidade({ codigo_cnes: '2000157', nome: 'POSTO PARTICULAR', tipo_unidade: 1, atende_sus: 0 }),
        unidade({ codigo_cnes: '2000158', nome: 'HOSPITAL DO SUS', tipo_unidade: 5, atende_sus: 1 }),
    ]);

    const achadas = unidadeSaudeRepository.listarComFiltros({ tipo: 1, apenasSus: true });

    assert.deepEqual(
        achadas.map((u) => u.nome),
        ['POSTO DO SUS']
    );
});

test('listarTiposDisponiveis devolve os tipos presentes, sem repetir, em ordem alfabetica', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade({ codigo_cnes: '2000156', tipo_unidade: 5, tipo_descricao: 'HOSPITAL GERAL' }),
        unidade({ codigo_cnes: '2000157', tipo_unidade: 1, tipo_descricao: 'POSTO DE SAUDE' }),
        unidade({ codigo_cnes: '2000158', tipo_unidade: 5, tipo_descricao: 'HOSPITAL GERAL' }),
    ]);

    assert.deepEqual(unidadeSaudeRepository.listarTiposDisponiveis(), [
        { codigo: 5, descricao: 'HOSPITAL GERAL' },
        { codigo: 1, descricao: 'POSTO DE SAUDE' },
    ]);
});

// RN22: a base precisa registrar a data da extracao, que e' exibida ao usuario.
test('registrarExtracao guarda a data e buscarDataExtracao devolve ela', () => {
    unidadeSaudeRepository.registrarExtracao('2026-10-12');

    assert.equal(unidadeSaudeRepository.buscarDataExtracao(), '2026-10-12');
});

test('registrarExtracao substitui a data anterior em vez de acumular', () => {
    unidadeSaudeRepository.registrarExtracao('2026-10-12');
    unidadeSaudeRepository.registrarExtracao('2026-11-20');

    assert.equal(unidadeSaudeRepository.buscarDataExtracao(), '2026-11-20');
    assert.equal(db.prepare('SELECT COUNT(*) AS total FROM extracao_cnes').get().total, 1);
});

test('buscarDataExtracao devolve null quando nenhuma extracao foi registrada', () => {
    db.prepare('DELETE FROM extracao_cnes').run();

    assert.equal(unidadeSaudeRepository.buscarDataExtracao(), null);
});

// RF28: busca por bairro, o caminho de quem nega a geolocalizacao. O nome exibido
// e' o corrigido (bairro_normalizado); o valor cru do CNES fica na coluna bairro,
// para a origem do dado continuar auditavel.
test('substituirTodas grava o bairro ja corrigido, sem perder o valor cru', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade({ bairro: 'NOSSA SENHORA DAS GR', bairro_normalizado: 'Nossa Senhora das Graças' }),
    ]);

    const gravada = db.prepare('SELECT bairro, bairro_normalizado FROM unidade_saude').get();
    assert.equal(gravada.bairro, 'NOSSA SENHORA DAS GR');
    assert.equal(gravada.bairro_normalizado, 'Nossa Senhora das Graças');
});

test('listarComFiltros filtra por bairro', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade({ codigo_cnes: '3000001', nome: 'UBS CENTRO', bairro_normalizado: 'Centro' }),
        unidade({ codigo_cnes: '3000002', nome: 'UBS ALEIXO', bairro_normalizado: 'Aleixo' }),
        unidade({ codigo_cnes: '3000003', nome: 'POLICLINICA CENTRO', bairro_normalizado: 'Centro' }),
    ]);

    const doCentro = unidadeSaudeRepository.listarComFiltros({ bairro: 'Centro' });

    assert.equal(doCentro.length, 2);
    assert.deepEqual(
        doCentro.map((u) => u.nome),
        ['POLICLINICA CENTRO', 'UBS CENTRO']
    );
});

test('listarComFiltros combina bairro com tipo e SUS', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade({ codigo_cnes: '3000004', bairro_normalizado: 'Centro', tipo_unidade: 2, atende_sus: 1 }),
        unidade({ codigo_cnes: '3000005', bairro_normalizado: 'Centro', tipo_unidade: 5, atende_sus: 1 }),
        unidade({ codigo_cnes: '3000006', bairro_normalizado: 'Centro', tipo_unidade: 5, atende_sus: 0 }),
        unidade({ codigo_cnes: '3000007', bairro_normalizado: 'Aleixo', tipo_unidade: 5, atende_sus: 1 }),
    ]);

    const hospitaisSus = unidadeSaudeRepository.listarComFiltros({ bairro: 'Centro', tipo: 5, apenasSus: true });

    assert.equal(hospitaisSus.length, 1);
    assert.equal(hospitaisSus[0].codigo_cnes, '3000005');
});

test('listarBairrosDisponiveis conta as unidades de cada bairro em ordem alfabetica', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade({ codigo_cnes: '3000020', bairro_normalizado: 'Centro' }),
        unidade({ codigo_cnes: '3000021', bairro_normalizado: 'Centro' }),
        unidade({ codigo_cnes: '3000022', bairro_normalizado: 'Aleixo' }),
        unidade({ codigo_cnes: '3000023', bairro_normalizado: null }),
    ]);

    const bairros = unidadeSaudeRepository.listarBairrosDisponiveis();

    // O bairro sem correcao nao entra: oferecer filtro sem nome confunde.
    assert.deepEqual(bairros, [
        { bairro: 'Aleixo', total: 1 },
        { bairro: 'Centro', total: 2 },
    ]);
});

test('listarBairrosDisponiveis respeita o filtro de SUS', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade({ codigo_cnes: '3000011', bairro_normalizado: 'Centro', atende_sus: 1 }),
        unidade({ codigo_cnes: '3000012', bairro_normalizado: 'Centro', atende_sus: 0 }),
        unidade({ codigo_cnes: '3000013', bairro_normalizado: 'Flores', atende_sus: 0 }),
    ]);

    const bairros = unidadeSaudeRepository.listarBairrosDisponiveis({ apenasSus: true });

    assert.deepEqual(bairros, [{ bairro: 'Centro', total: 1 }]);
});
