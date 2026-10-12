// Cobre os requisitos RF17 e RNF21: a dúvida é anônima e passa por um
// filtro de conteúdo impróprio antes de ser aceita.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepararBancoTemporario } = require('./ajuda/banco-teste');

const db = prepararBancoTemporario();
const duvidaService = require('../src/services/duvida.service');

test('rejeita pergunta vazia', () => {
    const resultado = duvidaService.enviarDuvida('   ');
    assert.ok(resultado.erro);
});

test('rejeita pergunta com mais de 1000 caracteres', () => {
    const resultado = duvidaService.enviarDuvida('a'.repeat(1001));
    assert.ok(resultado.erro);
});

test('rejeita pergunta contendo link', () => {
    const resultado = duvidaService.enviarDuvida('Vejam este site https://exemplo.com para saber mais');
    assert.ok(resultado.erro);
});

test('rejeita pergunta com palavrão da lista bloqueada', () => {
    const resultado = duvidaService.enviarDuvida('isso e uma porra de duvida sobre camisinha');
    assert.ok(resultado.erro);
});

test('rejeita spam de caracteres repetidos', () => {
    const resultado = duvidaService.enviarDuvida('aaaaaaaaaa isso e uma duvida valida sobre pilula');
    assert.ok(resultado.erro);
});

test('aceita dúvida válida e retorna o id gerado', () => {
    const resultado = duvidaService.enviarDuvida('Qual a diferença entre DIU de cobre e hormonal?');
    assert.equal(resultado.erro, null);
    assert.ok(resultado.id);
});

test('RNF21: a dúvida gravada não guarda nenhum dado que identifique quem perguntou', () => {
    const resultado = duvidaService.enviarDuvida('Preciso tomar a pílula todo santo dia no mesmo horário?');
    const linha = db.prepare('SELECT * FROM duvida WHERE id = ?').get(resultado.id);
    const colunas = Object.keys(linha).sort();
    assert.deepEqual(colunas, ['criado_em', 'id', 'pergunta', 'publicada', 'status']);
});
