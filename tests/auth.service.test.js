// Cobre os requisitos RF20 e RNF23: login por e-mail/senha com bcrypt,
// e o hash da senha nunca deve sair do service para quem chamou.
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const { prepararBancoTemporario } = require('./ajuda/banco-teste');

const db = prepararBancoTemporario();
const authService = require('../src/services/auth.service');

before(async () => {
    const hash = await bcrypt.hash('senha-correta', 10);
    db.prepare('INSERT INTO usuario (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)').run(
        'Admin Teste',
        'admin@teste.com',
        hash,
        'admin'
    );
});

test('retorna null para e-mail inexistente', async () => {
    const resultado = await authService.autenticar('naoexiste@teste.com', 'qualquer');
    assert.equal(resultado, null);
});

test('retorna null para senha incorreta', async () => {
    const resultado = await authService.autenticar('admin@teste.com', 'senha-errada');
    assert.equal(resultado, null);
});

test('autentica com credenciais corretas e não devolve o hash da senha', async () => {
    const resultado = await authService.autenticar('admin@teste.com', 'senha-correta');
    assert.ok(resultado);
    assert.equal(resultado.email, 'admin@teste.com');
    assert.equal(resultado.papel, 'admin');
    assert.equal('senha_hash' in resultado, false);
});
