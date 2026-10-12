// Cobre a busca por proximidade. A API do CNES nao tem busca por raio nem por
// coordenada, entao a distancia e' calculada aqui, com Haversine, sobre as
// unidades ja carregadas no banco.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepararBancoTemporario } = require('./ajuda/banco-teste');

prepararBancoTemporario();
const unidadeSaudeRepository = require('../src/repositories/unidade-saude.repository');
const unidadeSaudeService = require('../src/services/unidade-saude.service');

// Centro de Manaus, usado como ponto de partida das buscas.
const CENTRO = { latitude: -3.13, longitude: -60.023 };

let contador = 0;

function unidade(latitude, longitude, nome, atendeSus = 1) {
    contador += 1;
    return {
        codigo_cnes: String(2000000 + contador),
        nome,
        logradouro: 'RUA EXEMPLO',
        numero: '100',
        bairro: 'CENTRO',
        telefone: '9232154000',
        latitude,
        longitude,
        tipo_unidade: 2,
        atende_sus: atendeSus,
        turno_atendimento: 'MANHA E TARDE',
    };
}

// Um grau de latitude equivale a 2*PI*R/360, ou seja, cerca de 111,19 km para o
// raio medio da Terra. Os valores esperados abaixo saem dessa conta, nao da
// implementacao, justamente para o teste conseguir reprovar uma formula errada.
test('calcularDistanciaKm devolve zero para o mesmo ponto', () => {
    assert.equal(unidadeSaudeService.calcularDistanciaKm(CENTRO, CENTRO), 0);
});

test('calcularDistanciaKm mede 11,12 km para um decimo de grau de latitude', () => {
    const distancia = unidadeSaudeService.calcularDistanciaKm(CENTRO, {
        latitude: CENTRO.latitude + 0.1,
        longitude: CENTRO.longitude,
    });

    assert.ok(Math.abs(distancia - 11.12) < 0.05, `esperava ~11,12 km e veio ${distancia}`);
});

// Este e' o teste que reprova a conta ingenua: um grau de longitude encurta
// conforme se afasta do equador, e em Manaus vale cerca de 111,04 km.
test('calcularDistanciaKm encurta o grau de longitude na latitude de Manaus', () => {
    const distancia = unidadeSaudeService.calcularDistanciaKm(CENTRO, {
        latitude: CENTRO.latitude,
        longitude: CENTRO.longitude + 0.1,
    });

    assert.ok(Math.abs(distancia - 11.1) < 0.05, `esperava ~11,10 km e veio ${distancia}`);
});

test('buscarProximas ordena da unidade mais perto para a mais longe', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade(-3.33, -60.023, 'Longe'),
        unidade(-3.14, -60.023, 'Perto'),
        unidade(-3.23, -60.023, 'Meio'),
    ]);

    const proximas = unidadeSaudeService.buscarProximas(CENTRO);

    assert.deepEqual(
        proximas.map((u) => u.nome),
        ['Perto', 'Meio', 'Longe']
    );
});

test('buscarProximas devolve a distancia em quilometros de cada unidade', () => {
    unidadeSaudeRepository.substituirTodas([unidade(CENTRO.latitude + 0.1, CENTRO.longitude, 'Vizinha')]);

    const [maisProxima] = unidadeSaudeService.buscarProximas(CENTRO);

    assert.ok(Math.abs(maisProxima.distancia_km - 11.12) < 0.05);
});

test('buscarProximas respeita o limite pedido', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade(-3.14, -60.023, 'A'),
        unidade(-3.15, -60.023, 'B'),
        unidade(-3.16, -60.023, 'C'),
    ]);

    assert.equal(unidadeSaudeService.buscarProximas({ ...CENTRO, limite: 2 }).length, 2);
});

test('buscarProximas devolve null para coordenada fora de faixa', () => {
    assert.equal(unidadeSaudeService.buscarProximas({ latitude: -91, longitude: -60 }), null);
    assert.equal(unidadeSaudeService.buscarProximas({ latitude: -3, longitude: 181 }), null);
});

test('buscarProximas devolve null quando a coordenada nao vem', () => {
    assert.equal(unidadeSaudeService.buscarProximas({}), null);
    assert.equal(unidadeSaudeService.buscarProximas({ latitude: 'perto daqui', longitude: -60 }), null);
});

// A plataforma e' educativa e fala o tempo todo de servico gratuito (UBS, CTA,
// testagem pelo SUS). Indicar clinica particular como "unidade mais proxima"
// contradiz o conteudo, entao a busca so considera quem atende pelo SUS.
test('buscarProximas ignora unidade que nao atende pelo SUS', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade(CENTRO.latitude + 0.001, CENTRO.longitude, 'Clinica particular ao lado', 0),
        unidade(CENTRO.latitude + 0.2, CENTRO.longitude, 'UBS mais longe', 1),
    ]);

    const proximas = unidadeSaudeService.buscarProximas(CENTRO);

    assert.deepEqual(
        proximas.map((u) => u.nome),
        ['UBS mais longe']
    );
});

test('buscarProximas devolve lista vazia quando nao ha unidade carregada', () => {
    unidadeSaudeRepository.substituirTodas([]);

    assert.deepEqual(unidadeSaudeService.buscarProximas(CENTRO), []);
});
