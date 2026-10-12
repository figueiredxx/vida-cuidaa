// Cobre o requisito RNF24: limite de tentativas por sessão em uma janela de tempo.
// Não precisa de banco: o middleware só depende de req.session.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { limitarPorSessao } = require('../src/middlewares/rate-limit.middleware');

function criarReq() {
    return { session: {} };
}

test('permite até o limite de tentativas configurado', () => {
    const middleware = limitarPorSessao({ chave: 'teste', maxTentativas: 3, janelaMs: 60000 });
    const req = criarReq();

    for (let i = 0; i < 3; i += 1) {
        middleware(req, {}, () => {});
        assert.equal(req.rateLimitExcedido, undefined);
    }
});

test('marca rateLimitExcedido depois de esgotar as tentativas', () => {
    const middleware = limitarPorSessao({ chave: 'teste', maxTentativas: 3, janelaMs: 60000 });
    const req = criarReq();

    for (let i = 0; i < 3; i += 1) middleware(req, {}, () => {});
    middleware(req, {}, () => {});

    assert.equal(req.rateLimitExcedido, true);
});

test('libera novamente depois que a janela de tempo expira', () => {
    const middleware = limitarPorSessao({ chave: 'teste', maxTentativas: 1, janelaMs: 10 });
    const req = criarReq();

    middleware(req, {}, () => {});
    // Simula a passagem do tempo movendo o timestamp registrado para o passado,
    // sem precisar de um sleep real no teste.
    req.session.teste[0] -= 20;
    middleware(req, {}, () => {});

    assert.equal(req.rateLimitExcedido, undefined);
});
