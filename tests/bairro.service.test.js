// Cobre a tabela de correcao dos nomes de bairro do CNES (RF28).
//
// A API nao devolve o bairro em forma utilizavel: trunca em 20 caracteres, traz
// erro de digitacao, abreviacao e subdivisao informal. Sem correcao, o seletor da
// pagina mostraria 95 opcoes para cerca de 63 bairros, varias repetidas.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const bairroService = require('../src/services/bairro.service');

test('corrige o nome truncado em 20 caracteres pela API', () => {
    assert.equal(bairroService.normalizarBairro('NOSSA SENHORA DAS GR'), 'Nossa Senhora das Graças');
    assert.equal(bairroService.normalizarBairro('PARQUE 10 DE NOVEMBR'), 'Parque 10 de Novembro');
    assert.equal(bairroService.normalizarBairro('COLONIA ANTONIO ALEI'), 'Colônia Antônio Aleixo');
});

test('corrige erro de digitacao do cadastro', () => {
    assert.equal(bairroService.normalizarBairro('ADRIANNOPOLIS'), 'Adrianópolis');
    assert.equal(bairroService.normalizarBairro('CHPADA'), 'Chapada');
    assert.equal(bairroService.normalizarBairro('TACREDO NEVES'), 'Tancredo Neves');
});

test('expande abreviacao para o nome oficial', () => {
    assert.equal(bairroService.normalizarBairro('N SRA DAS GRACAS'), 'Nossa Senhora das Graças');
    assert.equal(bairroService.normalizarBairro('D PEDRO I'), 'Dom Pedro I');
    assert.equal(bairroService.normalizarBairro('COL OLIVEIRA MACHADO'), 'Colônia Oliveira Machado');
});

test('junta subdivisao informal no bairro oficial', () => {
    // Compensa I, II e III sao o mesmo bairro para quem procura atendimento.
    assert.equal(bairroService.normalizarBairro('COMPENSA III'), 'Compensa');
    assert.equal(bairroService.normalizarBairro('CIDADE NOVA II'), 'Cidade Nova');
    assert.equal(bairroService.normalizarBairro('ALVORADA 2'), 'Alvorada');
});

test('junta sinonimo do mesmo bairro', () => {
    assert.equal(bairroService.normalizarBairro('PARQUE DEZ'), 'Parque 10 de Novembro');
    assert.equal(bairroService.normalizarBairro('PARQUE 10'), 'Parque 10 de Novembro');
    assert.equal(bairroService.normalizarBairro('ZUMBI'), 'Zumbi dos Palmares');
});

test('ignora caixa, acento e espaco sobrando', () => {
    assert.equal(bairroService.normalizarBairro('  centro  '), 'Centro');
    assert.equal(bairroService.normalizarBairro('São Raimundo'), 'São Raimundo');
    assert.equal(bairroService.normalizarBairro('CIDADE   NOVA'), 'Cidade Nova');
});

test('devolve null quando nao ha bairro', () => {
    assert.equal(bairroService.normalizarBairro(null), null);
    assert.equal(bairroService.normalizarBairro(undefined), null);
    assert.equal(bairroService.normalizarBairro(''), null);
    assert.equal(bairroService.normalizarBairro('   '), null);
});

test('devolve null para bairro fora da tabela, em vez de inventar nome', () => {
    assert.equal(bairroService.normalizarBairro('BAIRRO QUE NAO EXISTE'), null);
});

// Este teste e' a rede de seguranca da reextracao: se o CNES passar a devolver um
// valor novo, ele quebra aqui, e nao na tela do usuario.
test('a tabela cobre todos os bairros presentes na base extraida', () => {
    const arquivo = path.join(__dirname, '..', 'database', 'cnes-manaus.json');
    const { unidades } = JSON.parse(fs.readFileSync(arquivo, 'utf8'));

    const semCorrespondencia = [
        ...new Set(
            unidades
                .map((u) => u.bairro)
                .filter((b) => b !== null && b !== undefined && String(b).trim() !== '')
                .filter((b) => bairroService.normalizarBairro(b) === null)
        ),
    ];

    assert.deepEqual(semCorrespondencia, [], `bairros sem correcao: ${semCorrespondencia.join(', ')}`);
});
