// Cobre os requisitos RF20 e RF23 (só admin/editor autenticado acessa o CRUD): as
// funções de guarda de rota devem redirecionar ou bloquear corretamente.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { requireAuth, requireRole } = require('../src/middlewares/auth.middleware');

function criarRes() {
    return {
        statusCode: null,
        redirectPara: null,
        renderizado: null,
        status(codigo) {
            this.statusCode = codigo;
            return this;
        },
        redirect(url) {
            this.redirectPara = url;
        },
        render(view, dados) {
            this.renderizado = { view, dados };
        },
    };
}

test('requireAuth redireciona para o login quando não há sessão', () => {
    const req = { session: {} };
    const res = criarRes();
    let chamouNext = false;

    requireAuth(req, res, () => {
        chamouNext = true;
    });

    assert.equal(res.redirectPara, '/admin/login');
    assert.equal(chamouNext, false);
});

test('requireAuth chama next quando há usuário na sessão', () => {
    const req = { session: { usuario: { papel: 'admin' } } };
    const res = criarRes();
    let chamouNext = false;

    requireAuth(req, res, () => {
        chamouNext = true;
    });

    assert.equal(chamouNext, true);
});

test('requireRole bloqueia com 403 quando o papel não está na lista permitida', () => {
    const req = { session: { usuario: { papel: 'editor' } } };
    const res = criarRes();
    const middleware = requireRole('admin');
    let chamouNext = false;

    middleware(req, res, () => {
        chamouNext = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(chamouNext, false);
});

test('requireRole libera quando o papel está na lista permitida', () => {
    const req = { session: { usuario: { papel: 'editor' } } };
    const res = criarRes();
    const middleware = requireRole('admin', 'editor');
    let chamouNext = false;

    middleware(req, res, () => {
        chamouNext = true;
    });

    assert.equal(chamouNext, true);
});
