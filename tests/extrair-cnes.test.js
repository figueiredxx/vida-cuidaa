// Cobre as duas partes do extrator do CNES que nao dependem de rede: o filtro
// que decide quais estabelecimentos interessam e a paginacao por offset, que e'
// obrigatoria porque a API limita cada pagina a 20 registros.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { ehUtil, normalizar, coletarPaginas } = require('../scripts/extrair-cnes');

// Registro no formato que a API devolve, para os testes alterarem so o que importa.
function bruto(alteracoes = {}) {
    return {
        codigo_cnes: '2000156',
        nome_fantasia: 'UBS SAO JOSE',
        nome_razao_social: 'PREFEITURA MUNICIPAL DE MANAUS',
        endereco_estabelecimento: 'AVENIDA AUTAZ MIRIM',
        numero_estabelecimento: '1000',
        bairro_estabelecimento: 'SAO JOSE OPERARIO',
        numero_telefone_estabelecimento: '9232154000',
        latitude_estabelecimento_decimo_grau: -3.0589,
        longitude_estabelecimento_decimo_grau: -59.9512,
        codigo_tipo_unidade: 2,
        estabelecimento_faz_atendimento_ambulatorial_sus: 'SIM',
        descricao_turno_atendimento: 'ATENDIMENTO NOS TURNOS MANHA E TARDE',
        ...alteracoes,
    };
}

test('ehUtil aceita estabelecimento de tipo util com coordenada', () => {
    assert.equal(ehUtil(bruto()), true);
});

test('ehUtil recusa estabelecimento de tipo fora da lista', () => {
    assert.equal(ehUtil(bruto({ codigo_tipo_unidade: 39 })), false);
});

test('ehUtil recusa estabelecimento sem coordenada', () => {
    assert.equal(ehUtil(bruto({ latitude_estabelecimento_decimo_grau: null })), false);
    assert.equal(ehUtil(bruto({ longitude_estabelecimento_decimo_grau: null })), false);
});

test('normalizar traduz os campos da API para o formato gravado no banco', () => {
    assert.deepEqual(normalizar(bruto()), {
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
    });
});

test('normalizar usa a razao social quando o nome fantasia vem vazio', () => {
    assert.equal(normalizar(bruto({ nome_fantasia: null })).nome, 'PREFEITURA MUNICIPAL DE MANAUS');
});

test('normalizar marca atende_sus como 0 quando o estabelecimento nao atende pelo SUS', () => {
    assert.equal(normalizar(bruto({ estabelecimento_faz_atendimento_ambulatorial_sus: 'NAO' })).atende_sus, 0);
});

// A API nao informa o total de registros, entao a unica forma de saber que acabou
// e' receber uma pagina menor que o limite pedido.
test('coletarPaginas acumula as paginas avancando o offset', async () => {
    const offsetsPedidos = [];
    const paginas = [
        [{ codigo_cnes: '1' }, { codigo_cnes: '2' }],
        [{ codigo_cnes: '3' }, { codigo_cnes: '4' }],
        [{ codigo_cnes: '5' }],
    ];

    const itens = await coletarPaginas({
        limite: 2,
        buscarPagina: async (offset) => {
            offsetsPedidos.push(offset);
            return paginas.shift() || [];
        },
    });

    assert.deepEqual(offsetsPedidos, [0, 2, 4]);
    assert.deepEqual(
        itens.map((i) => i.codigo_cnes),
        ['1', '2', '3', '4', '5']
    );
});

test('coletarPaginas para quando a primeira pagina ja vem vazia', async () => {
    const itens = await coletarPaginas({ limite: 2, buscarPagina: async () => [] });

    assert.deepEqual(itens, []);
});
