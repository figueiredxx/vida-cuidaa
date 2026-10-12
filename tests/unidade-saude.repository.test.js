// Cobre a carga das unidades de saude do CNES no banco. A importacao precisa ser
// idempotente: rodar de novo depois de uma extracao nova tem que substituir a
// lista, nunca duplicar as unidades.
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
