const unidadeSaudeRepository = require('../repositories/unidade-saude.repository');

// Raio medio da Terra. A conta trata o planeta como esfera, o que basta de sobra
// para distancia dentro de uma cidade.
const RAIO_TERRA_KM = 6371;

const LIMITE_PADRAO = 10;

function paraRadianos(graus) {
    return (graus * Math.PI) / 180;
}

// Haversine: distancia em linha reta entre dois pontos sobre a esfera terrestre.
// A API do CNES nao oferece busca por raio nem por coordenada, entao a conta e'
// nossa. Nao e' distancia de percurso: nao considera rua, rio nem ponte.
function calcularDistanciaKm(origem, destino) {
    const latitudeOrigem = paraRadianos(origem.latitude);
    const latitudeDestino = paraRadianos(destino.latitude);
    const difLatitude = paraRadianos(destino.latitude - origem.latitude);
    const difLongitude = paraRadianos(destino.longitude - origem.longitude);

    const a =
        Math.sin(difLatitude / 2) ** 2 +
        Math.cos(latitudeOrigem) * Math.cos(latitudeDestino) * Math.sin(difLongitude / 2) ** 2;

    return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(a));
}

function grauValido(valor, maximo) {
    return typeof valor === 'number' && Number.isFinite(valor) && Math.abs(valor) <= maximo;
}

// A coordenada chega pela query string, ou seja, como texto. Number('') devolve
// zero, e zero e' coordenada valida (fica no Golfo da Guine), entao converter com
// Number puro faria a pagina listar unidades "proximas" da Africa quando o
// parametro viesse vazio.
function converterCoordenada(texto) {
    if (typeof texto !== 'string' || texto.trim() === '') return null;

    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : null;
}

function grauValido(valor, maximo) {
    return typeof valor === 'number' && Number.isFinite(valor) && Math.abs(valor) <= maximo;
}

// Devolve null em vez de lancar erro, seguindo o mesmo contrato dos outros
// services: quem chama decide o que mostrar. A coordenada chega da geolocalizacao
// do navegador, que falha de varias formas, entao validar aqui e' obrigatorio.
//
// apenasSus comeca ligado porque a plataforma trata de servico gratuito, mas e'
// so o padrao: a RN20 manda exibir os particulares com marcacao distinta quando
// o filtro for desligado, e o RF27 exige que ele exista.
function buscarProximas({ latitude, longitude, limite = LIMITE_PADRAO, apenasSus = true, tipo } = {}) {
    if (!grauValido(latitude, 90) || !grauValido(longitude, 180)) return null;

    const origem = { latitude, longitude };

    return unidadeSaudeRepository
        .listarComFiltros({ apenasSus, tipo })
        .map((unidade) => ({
            ...unidade,
            distancia_km: Math.round(calcularDistanciaKm(origem, unidade) * 100) / 100,
        }))
        .sort((a, b) => a.distancia_km - b.distancia_km)
        .slice(0, limite);
}

function listarTiposDisponiveis() {
    return unidadeSaudeRepository.listarTiposDisponiveis();
}

// RN22: exibida ao usuario no rodape da pagina de servicos.
function buscarDataExtracao() {
    return unidadeSaudeRepository.buscarDataExtracao();
}

module.exports = {
    calcularDistanciaKm,
    converterCoordenada,
    buscarProximas,
    listarTiposDisponiveis,
    buscarDataExtracao,
};
