const unidadeSaudeService = require('../services/unidade-saude.service');

// Pagina de servicos (RF24 a RF28). A coordenada chega pela query string porque
// quem a obtem e' o navegador, via geolocalizacao: o JS da pagina pede a
// permissao e recarrega /servicos com lat e lon. A lista em si e' montada aqui,
// no servidor.
function exibir(req, res) {
    const latitude = unidadeSaudeService.converterCoordenada(req.query.lat);
    const longitude = unidadeSaudeService.converterCoordenada(req.query.lon);

    // Checkbox nao marcada nao e' enviada pelo formulario. Por isso o padrao so
    // e' desligado quando o campo chega explicitamente com 'nao'.
    const apenasSus = req.query.sus !== 'nao';
    const tipo = req.query.tipo || '';

    const locals = {
        titulo: 'Serviços de saúde',
        apenasSus,
        tipo,
        tipos: unidadeSaudeService.listarTiposDisponiveis(),
        dataExtracao: unidadeSaudeService.buscarDataExtracao(),
        latitude,
        longitude,
        unidades: null,
        erro: null,
    };

    // Sem coordenada na URL: primeira visita, a pagina so oferece o botao.
    if (latitude === null && longitude === null) {
        return res.render('site/servicos', locals);
    }

    const unidades = unidadeSaudeService.buscarProximas({ latitude, longitude, apenasSus, tipo });

    if (unidades === null) {
        return res.status(400).render('site/servicos', {
            ...locals,
            latitude: null,
            longitude: null,
            erro: 'A localização informada no endereço da página não é válida. Tente novamente pelo botão abaixo.',
        });
    }

    res.render('site/servicos', { ...locals, unidades });
}

module.exports = { exibir };
