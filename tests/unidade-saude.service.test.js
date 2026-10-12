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

function unidade(latitude, longitude, nome, atendeSus = 1, tipo = 2) {
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
        tipo_unidade: tipo,
        tipo_descricao: 'CENTRO DE SAUDE/UNIDADE BASICA',
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

// A plataforma fala o tempo todo de servico gratuito, entao o padrao e' mostrar
// so quem atende pelo SUS. Mas e' padrao, nao corte: a RN20 manda exibir os
// particulares com marcacao distinta, e o RF27 exige o filtro.
test('buscarProximas ignora, por padrao, quem nao atende pelo SUS', () => {
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

test('buscarProximas com apenasSus false inclui quem nao atende pelo SUS', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade(CENTRO.latitude + 0.001, CENTRO.longitude, 'Clinica particular ao lado', 0),
        unidade(CENTRO.latitude + 0.2, CENTRO.longitude, 'UBS mais longe', 1),
    ]);

    const proximas = unidadeSaudeService.buscarProximas({ ...CENTRO, apenasSus: false });

    assert.deepEqual(
        proximas.map((u) => u.nome),
        ['Clinica particular ao lado', 'UBS mais longe']
    );
});

// RF27: filtrar por tipo de unidade.
test('buscarProximas filtra por tipo de unidade', () => {
    unidadeSaudeRepository.substituirTodas([
        unidade(CENTRO.latitude + 0.01, CENTRO.longitude, 'Posto', 1, 1),
        unidade(CENTRO.latitude + 0.02, CENTRO.longitude, 'Hospital', 1, 5),
    ]);

    const proximas = unidadeSaudeService.buscarProximas({ ...CENTRO, tipo: 5 });

    assert.deepEqual(
        proximas.map((u) => u.nome),
        ['Hospital']
    );
});

// A coordenada chega pela query string, ou seja, como texto. Number('') e' zero,
// e zero e' coordenada valida: sem este tratamento, /servicos?lat=&lon= listaria
// as unidades "mais proximas" do Golfo da Guine.
test('converterCoordenada transforma texto numerico em numero', () => {
    assert.equal(unidadeSaudeService.converterCoordenada('-3.1302'), -3.1302);
    assert.equal(unidadeSaudeService.converterCoordenada('0'), 0);
});

test('converterCoordenada devolve null para texto vazio, e nao zero', () => {
    assert.equal(unidadeSaudeService.converterCoordenada(''), null);
    assert.equal(unidadeSaudeService.converterCoordenada('   '), null);
    assert.equal(unidadeSaudeService.converterCoordenada(undefined), null);
});

test('converterCoordenada devolve null para texto que nao e numero', () => {
    assert.equal(unidadeSaudeService.converterCoordenada('perto daqui'), null);
    assert.equal(unidadeSaudeService.converterCoordenada('-3,1302'), null);
});

// RN22: a data da extracao e' exibida ao usuario na pagina.
test('buscarDataExtracao devolve a data registrada na importacao', () => {
    unidadeSaudeRepository.registrarExtracao('2026-10-12');

    assert.equal(unidadeSaudeService.buscarDataExtracao(), '2026-10-12');
});

test('listarTiposDisponiveis entrega os tipos para o filtro da pagina', () => {
    unidadeSaudeRepository.substituirTodas([unidade(CENTRO.latitude, CENTRO.longitude, 'UBS', 1, 2)]);

    assert.deepEqual(unidadeSaudeService.listarTiposDisponiveis(), [
        { codigo: 2, descricao: 'CENTRO DE SAUDE/UNIDADE BASICA' },
    ]);
});

// RF28: busca por bairro. E' o caminho de quem nao concede a geolocalizacao, e
// tambem de quem prefere procurar pelo bairro onde mora.
function unidadeEmBairro(bairroCru, nome, latitude = -3.13, longitude = -60.023, atendeSus = 1) {
    return { ...unidade(latitude, longitude, nome, atendeSus), bairro: bairroCru };
}

test('importar corrige o nome do bairro antes de gravar', () => {
    unidadeSaudeService.importar(
        [unidadeEmBairro('NOSSA SENHORA DAS GR', 'UBS GRACAS'), unidadeEmBairro('CHPADA', 'UBS CHAPADA')],
        '2026-10-12'
    );

    const gravadas = unidadeSaudeRepository.listarComFiltros({});
    const porNome = Object.fromEntries(gravadas.map((u) => [u.nome, u]));

    assert.equal(porNome['UBS GRACAS'].bairro_normalizado, 'Nossa Senhora das Graças');
    assert.equal(porNome['UBS CHAPADA'].bairro_normalizado, 'Chapada');
    // O valor cru do CNES nao se perde: a pagina mostra o corrigido, a auditoria
    // continua possivel.
    assert.equal(porNome['UBS GRACAS'].bairro, 'NOSSA SENHORA DAS GR');
});

test('importar registra a data da extracao junto com a base', () => {
    unidadeSaudeService.importar([unidadeEmBairro('CENTRO', 'UBS CENTRO')], '2026-10-12');

    assert.equal(unidadeSaudeService.buscarDataExtracao(), '2026-10-12');
});

test('listarPorBairro devolve todas as unidades do bairro, em ordem de nome', () => {
    unidadeSaudeService.importar(
        [
            unidadeEmBairro('CENTRO', 'UBS ZONA CENTRO'),
            unidadeEmBairro('CENTRO', 'POLICLINICA CENTRO'),
            unidadeEmBairro('ALEIXO', 'UBS ALEIXO'),
        ],
        '2026-10-12'
    );

    const encontradas = unidadeSaudeService.listarPorBairro({ bairro: 'Centro' });

    assert.deepEqual(
        encontradas.map((u) => u.nome),
        ['POLICLINICA CENTRO', 'UBS ZONA CENTRO']
    );
    // Sem coordenada nao ha distancia a mostrar.
    assert.equal(encontradas[0].distancia_km, undefined);
});

test('listarPorBairro nao corta a lista em dez: quem escolheu o bairro quer o bairro', () => {
    const muitas = [];
    for (let i = 0; i < 14; i += 1) muitas.push(unidadeEmBairro('CENTRO', `UBS ${String(i).padStart(2, '0')}`));
    unidadeSaudeService.importar(muitas, '2026-10-12');

    assert.equal(unidadeSaudeService.listarPorBairro({ bairro: 'Centro' }).length, 14);
});

test('listarPorBairro ordena por distancia quando a localizacao tambem veio', () => {
    unidadeSaudeService.importar(
        [
            unidadeEmBairro('CENTRO', 'UBS LONGE', CENTRO.latitude + 0.1, CENTRO.longitude),
            unidadeEmBairro('CENTRO', 'A UBS PERTO', CENTRO.latitude + 0.01, CENTRO.longitude),
        ],
        '2026-10-12'
    );

    const encontradas = unidadeSaudeService.listarPorBairro({
        bairro: 'Centro',
        latitude: CENTRO.latitude,
        longitude: CENTRO.longitude,
    });

    // Por nome, 'A UBS PERTO' viria primeiro de qualquer jeito; o que o teste
    // cobra e' a distancia calculada e a ordem vindo dela.
    assert.deepEqual(
        encontradas.map((u) => u.nome),
        ['A UBS PERTO', 'UBS LONGE']
    );
    assert.ok(Math.abs(encontradas[0].distancia_km - 1.11) < 0.05);
    assert.ok(Math.abs(encontradas[1].distancia_km - 11.12) < 0.05);
});

test('listarPorBairro aplica os filtros de tipo e de SUS', () => {
    unidadeSaudeService.importar(
        [
            { ...unidadeEmBairro('CENTRO', 'HOSPITAL SUS'), tipo_unidade: 5, atende_sus: 1 },
            { ...unidadeEmBairro('CENTRO', 'HOSPITAL PARTICULAR'), tipo_unidade: 5, atende_sus: 0 },
            { ...unidadeEmBairro('CENTRO', 'UBS QUALQUER'), tipo_unidade: 2, atende_sus: 1 },
        ],
        '2026-10-12'
    );

    const encontradas = unidadeSaudeService.listarPorBairro({ bairro: 'Centro', tipo: 5, apenasSus: true });

    assert.deepEqual(
        encontradas.map((u) => u.nome),
        ['HOSPITAL SUS']
    );
});

test('listarPorBairro devolve null quando o bairro nao foi informado', () => {
    assert.equal(unidadeSaudeService.listarPorBairro({ bairro: '' }), null);
    assert.equal(unidadeSaudeService.listarPorBairro({}), null);
});

test('listarBairrosDisponiveis entrega os bairros para o seletor da pagina', () => {
    unidadeSaudeService.importar(
        [
            unidadeEmBairro('CENTRO', 'UBS UM'),
            unidadeEmBairro('N SRA DAS GRACAS', 'UBS DOIS'),
            unidadeEmBairro('NOSSA SENHORA DAS GR', 'UBS TRES'),
        ],
        '2026-10-12'
    );

    // As duas grafias de Nossa Senhora das Gracas contam como um bairro so.
    assert.deepEqual(unidadeSaudeService.listarBairrosDisponiveis({ apenasSus: true }), [
        { bairro: 'Centro', total: 1 },
        { bairro: 'Nossa Senhora das Graças', total: 2 },
    ]);
});

test('buscarProximas continua limitando a dez quando nao ha bairro escolhido', () => {
    const muitas = [];
    for (let i = 0; i < 14; i += 1) muitas.push(unidadeEmBairro('CENTRO', `UBS ${String(i).padStart(2, '0')}`));
    unidadeSaudeService.importar(muitas, '2026-10-12');

    assert.equal(unidadeSaudeService.buscarProximas({ ...CENTRO }).length, 10);
});
