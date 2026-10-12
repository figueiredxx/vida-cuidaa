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

// Devolve null em vez de lancar erro, seguindo o mesmo contrato dos outros
// services: quem chama decide o que mostrar. A coordenada chega da geolocalizacao
// do navegador, que falha de varias formas, entao validar aqui e' obrigatorio.
function buscarProximas({ latitude, longitude, limite = LIMITE_PADRAO } = {}) {
    if (!grauValido(latitude, 90) || !grauValido(longitude, 180)) return null;

    const origem = { latitude, longitude };

    return unidadeSaudeRepository
        .listarQueAtendemSus()
        .map((unidade) => ({
            ...unidade,
            distancia_km: Math.round(calcularDistanciaKm(origem, unidade) * 100) / 100,
        }))
        .sort((a, b) => a.distancia_km - b.distancia_km)
        .slice(0, limite);
}

module.exports = { calcularDistanciaKm, buscarProximas };
