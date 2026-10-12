// Cobre o contrato entre a pagina de servicos e o mapa (RF29).
//
// O mapa e' montado no navegador a partir da lista que o servidor ja renderizou:
// cada item carrega a propria coordenada em data-*. E' o que mantem mapa e lista
// sempre de acordo, inclusive depois de qualquer filtro. Se alguem remover esses
// atributos, o mapa fica vazio sem erro nenhum aparecer — por isso o teste.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const ejs = require('ejs');

const VIEW = path.join(__dirname, '..', 'src', 'views', 'site', 'servicos.ejs');

function unidade(alteracoes = {}) {
    return {
        codigo_cnes: '2000156',
        nome: 'UBS SAO JOSE',
        logradouro: 'AVENIDA AUTAZ MIRIM',
        numero: '1000',
        bairro: 'SAO JOSE OPERARIO',
        bairro_normalizado: 'São José Operário',
        telefone: '9232154000',
        latitude: -3.0589,
        longitude: -59.9512,
        tipo_unidade: 2,
        tipo_descricao: 'CENTRO DE SAUDE/UNIDADE BASICA',
        atende_sus: 1,
        turno_atendimento: 'MANHA E TARDE',
        ...alteracoes,
    };
}

function renderizar(locals = {}) {
    return ejs.renderFile(
        VIEW,
        {
            titulo: 'Serviços de saúde',
            apenasSus: true,
            tipo: '',
            bairro: '',
            tipos: [],
            bairros: [],
            dataExtracao: '2026-10-12',
            latitude: null,
            longitude: null,
            unidades: null,
            erro: null,
            ...locals,
        },
        { async: false }
    );
}

test('cada unidade da lista carrega a coordenada para o mapa', async () => {
    const html = await renderizar({ unidades: [unidade()] });

    assert.match(html, /data-lat="-3\.0589"/);
    assert.match(html, /data-lon="-59\.9512"/);
    assert.match(html, /data-nome="UBS SAO JOSE"/);
    assert.match(html, /data-sus="1"/);
});

test('a unidade que nao atende pelo SUS se identifica no dado do mapa', async () => {
    const html = await renderizar({ unidades: [unidade({ atende_sus: 0 })] });

    assert.match(html, /data-sus="0"/);
});

test('o dado do mapa escapa aspas no nome, em vez de quebrar o atributo', async () => {
    const html = await renderizar({ unidades: [unidade({ nome: 'CLINICA "SAUDE" LTDA' })] });

    assert.ok(!html.includes('data-nome="CLINICA "SAUDE" LTDA"'), 'o atributo ficou quebrado');
    assert.match(html, /data-nome="CLINICA &#34;SAUDE&#34; LTDA"/);
});

test('o mapa so aparece quando ha unidade para mostrar', async () => {
    const semBusca = await renderizar({ unidades: null });
    const semResultado = await renderizar({ unidades: [] });
    const comResultado = await renderizar({ unidades: [unidade()] });

    assert.ok(!semBusca.includes('id="mapa-servicos"'), 'mapa aparece antes de qualquer busca');
    assert.ok(!semResultado.includes('id="mapa-servicos"'), 'mapa aparece sem nenhuma unidade');
    assert.ok(comResultado.includes('id="mapa-servicos"'), 'mapa nao aparece com unidade na lista');
});

// Exigencia da licenca do OpenStreetMap. Fica aqui para ninguem remover por
// descuido ao mexer no visual do mapa.
test('a pagina declara a atribuicao ao OpenStreetMap junto do mapa', async () => {
    const html = await renderizar({ unidades: [unidade()] });

    assert.match(html, /OpenStreetMap/);
});

test('a posicao de quem buscou vai para o mapa quando existe', async () => {
    const html = await renderizar({ unidades: [unidade()], latitude: -3.13, longitude: -60.023 });

    assert.match(html, /data-origem-lat="-3\.13"/);
    assert.match(html, /data-origem-lon="-60\.023"/);
});
